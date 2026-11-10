create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  upcoming boolean not null default true,
  lead_minutes integer not null default 30 check (lead_minutes in (30, 60)),
  pending boolean not null default true,
  birthdays boolean not null default false,
  goals boolean not null default false,
  confirmations boolean not null default false
);

create table public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index notification_devices_user_idx on public.notification_devices(user_id);

create table public.notification_deliveries (
  device_id uuid not null references public.notification_devices(id) on delete cascade,
  event_key text not null,
  lease_until timestamptz not null,
  sent_at timestamptz,
  primary key (device_id, event_key)
);

alter table public.notification_preferences enable row level security;
alter table public.notification_devices enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on public.notification_preferences, public.notification_devices, public.notification_deliveries from public, anon, authenticated;
grant select, insert, update on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.notification_devices to authenticated;
grant select, insert, update, delete on public.notification_preferences, public.notification_devices, public.notification_deliveries to service_role;

create policy own_preferences on public.notification_preferences for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_devices on public.notification_devices for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Recompute eligibility from current data on each run. Only the worker can claim a delivery.
create function public.claim_panel_notifications()
returns table(device_id uuid, event_key text, lease_until timestamptz, endpoint text,
  p256dh text, auth text, title text, body text, path text, expires_at timestamptz)
language sql security invoker set search_path = ''
as $$
  with clock as (
    select now() as instant, now() at time zone 'America/Sao_Paulo' as local_time
  ), bounds as (
    select *, local_time::date as today,
      date_trunc('month', local_time) at time zone 'America/Sao_Paulo' as month_start,
      (date_trunc('month', local_time) + interval '1 month') at time zone 'America/Sao_Paulo' as month_end
    from clock
  ), counts as (
    select b.*,
      (select count(*) from public.appointments a where a.status = 'scheduled' and a.ends_at <= b.instant - interval '24 hours') as pending_count,
      (select count(*) from public.clients c where to_char(c.birth_date, 'MM-DD') = to_char(b.today, 'MM-DD')) as birthday_count,
      (select count(*) from public.appointments a where a.status = 'scheduled' and a.confirmed_at is null
        and a.starts_at >= ((b.today + 1)::timestamp at time zone 'America/Sao_Paulo')
        and a.starts_at < ((b.today + 2)::timestamp at time zone 'America/Sao_Paulo')) as confirmation_count,
      (select count(*) from public.appointments a where a.status = 'completed' and a.starts_at >= b.month_start and a.starts_at < b.month_end) as visits,
      (select coalesce(sum(p.amount), 0) from public.payments p where p.paid_at >= b.month_start and p.paid_at < b.month_end) as revenue
    from bounds b
  ), devices as (
    select d.id, p.upcoming, p.lead_minutes, p.pending, p.birthdays, p.goals, p.confirmations
    from public.notification_devices d join public.notification_preferences p using (user_id)
  ), events as (
    select d.id, 'upcoming:' || a.id || ':' || extract(epoch from a.starts_at) as key,
      'Próximo atendimento' as title,
      'Você tem um atendimento às ' || to_char(a.starts_at at time zone 'America/Sao_Paulo', 'HH24:MI') || '.' as body,
      '/painel/agenda/' || a.id as path, a.starts_at as expires_at
    from devices d cross join bounds b join public.appointments a
      on a.status = 'scheduled' and a.time_known and a.starts_at > b.instant
      and a.starts_at <= b.instant + make_interval(mins => d.lead_minutes)
    where d.upcoming

    union all

    select d.id, e.kind || ':' || c.today, e.title, e.body, e.path,
      (c.today + e.until_time) at time zone 'America/Sao_Paulo'
    from devices d cross join counts c cross join lateral (values
      ('pending', d.pending and c.pending_count > 0, time '09:00', time '12:00',
        'Atendimentos pendentes', 'Há ' || c.pending_count || ' atendimento(s) para revisar.', '/painel/notificacoes/revisar?tipo=pendencias'),
      ('birthday', d.birthdays and c.birthday_count > 0, time '09:00', time '12:00',
        'Aniversários de hoje', 'Há ' || c.birthday_count || ' aniversário(s) de clientes hoje.', '/painel/notificacoes/revisar?tipo=aniversarios'),
      ('confirmation', d.confirmations and c.confirmation_count > 0, time '17:00', time '20:00',
        'Confirmações de amanhã', 'Há ' || c.confirmation_count || ' atendimento(s) para confirmar.', '/painel/agenda/confirmar')
    ) as e(kind, enabled, from_time, until_time, title, body, path)
    where e.enabled and c.local_time::time >= e.from_time and c.local_time::time < e.until_time

    union all

    select d.id, g.kind || ':' || to_char(c.local_time, 'YYYY-MM'), 'Meta do mês batida',
      g.body, '/painel/resumo?m=' || to_char(c.local_time, 'YYYY-MM'), c.month_end
    from devices d cross join counts c cross join public.settings s cross join lateral (values
      ('goal-revenue', s.monthly_revenue_goal > 0 and c.revenue >= s.monthly_revenue_goal, 'Você alcançou a meta de faturamento.'),
      ('goal-visits', s.monthly_appointments_goal > 0 and c.visits >= s.monthly_appointments_goal, 'Você alcançou a meta de atendimentos.')
    ) as g(kind, reached, body)
    where d.goals and s.id = 1 and g.reached
  ), eligible as (
    select e.* from events e
    left join public.notification_deliveries log on log.device_id = e.id and log.event_key = e.key
    where log.sent_at is null and (log.lease_until is null or log.lease_until <= now())
    order by e.expires_at, e.id, e.key limit 24
  ), claimed as (
    insert into public.notification_deliveries as log (device_id, event_key, lease_until)
    select e.id, e.key, now() + interval '2 minutes' from eligible e
    on conflict (device_id, event_key) do update set lease_until = excluded.lease_until
      where log.sent_at is null and log.lease_until <= now()
    returning log.device_id, log.event_key, log.lease_until
  )
  select q.device_id, q.event_key, q.lease_until, d.endpoint, d.p256dh, d.auth, e.title, e.body, e.path, e.expires_at
  from claimed q join eligible e on e.id = q.device_id and e.key = q.event_key
    join public.notification_devices d on d.id = q.device_id;
$$;

revoke execute on function public.claim_panel_notifications() from public, anon, authenticated;
grant execute on function public.claim_panel_notifications() to service_role;

create function public.panel_birthdays_today()
returns table(id uuid, name text)
language sql stable security invoker set search_path = ''
as $$
  select c.id, c.name from public.clients c
  where to_char(c.birth_date, 'MM-DD') = to_char(now() at time zone 'America/Sao_Paulo', 'MM-DD')
  order by c.name, c.id;
$$;

revoke execute on function public.panel_birthdays_today() from public, anon;
grant execute on function public.panel_birthdays_today() to authenticated;
