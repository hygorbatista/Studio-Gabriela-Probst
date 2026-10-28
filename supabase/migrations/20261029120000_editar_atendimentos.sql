-- Editar atendimentos (inclusive os antigos), agendamentos futuros com a tabela
-- de serviços nova e a revisão de despesa fixa numa transação só.
-- Pedido do Hygor em 2026-10-28, depois da auditoria.

-- 1. Gatilho: respeitar o término informado por quem edita ----------------
-- Antes, se o término novo coincidisse com o antigo, o gatilho achava que
-- ninguém tinha mexido e recalculava a duração. As funções que já calculam o
-- término (update_appointment) ligam app.keep_ends para o gatilho não mexer.
create or replace function public.appointments_fill()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  service_duration int;
  service_price numeric(10, 2);
  buffer int;
begin
  select duration_minutes, price
    into service_duration, service_price
    from public.services
   where id = new.service_id;
  service_duration := coalesce(service_duration, 60);

  if tg_op = 'INSERT' then
    new.ends_at := coalesce(new.ends_at, new.starts_at + make_interval(mins => service_duration));
    new.price_charged := coalesce(new.price_charged, service_price);
  elsif coalesce(current_setting('app.keep_ends', true), '') <> 'on'
        and new.ends_at is not distinct from old.ends_at then
    if new.service_id is distinct from old.service_id then
      -- Trocou o serviço: nova duração a partir do início.
      new.ends_at := new.starts_at + make_interval(mins => service_duration);
    elsif new.starts_at is distinct from old.starts_at then
      -- Remarcou: mantém a duração que o atendimento já tinha.
      new.ends_at := new.starts_at + (old.ends_at - old.starts_at);
    end if;
  end if;

  select buffer_minutes into buffer from public.settings where id = 1;
  new.blocked_until := new.ends_at + make_interval(mins => coalesce(buffer, 0));

  return new;
end;
$$;

-- 2. Agendamentos futuros com a tabela de serviços nova ---------------------
-- Duração e preço do serviço hoje (com a promoção, se valer). Só os ainda
-- agendados, de agora em diante, com um serviço só. Se a duração nova
-- encavalar com outro atendimento (não deve: as durações diminuíram), aquele
-- fica como estava.
do $$
declare
  r record;
  today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  for r in
    select a.id, a.starts_at, s.duration_minutes,
           case when s.promo_price is not null and s.promo_until >= today
                then s.promo_price else s.price end as price
      from public.appointments a
      join public.services s on s.id = a.service_id
     where a.status = 'scheduled'
       and a.starts_at >= now()
       and not exists (select 1 from public.appointment_services i where i.appointment_id = a.id)
  loop
    begin
      update public.appointments
         set ends_at = r.starts_at + make_interval(mins => r.duration_minutes),
             price_charged = r.price
       where id = r.id;
    exception when exclusion_violation then
      null;
    end;
  end loop;
end;
$$;

-- 3. Atendimentos antigos ganham os itens -----------------------------------
-- Todo atendimento com serviço passa a ter a linha em appointment_services, com
-- o valor cobrado e a duração que tem. Assim, relatórios e a edição tratam
-- antigos e novos do mesmo jeito.
insert into public.appointment_services (appointment_id, service_id, position, price, duration_minutes)
select a.id, a.service_id, 1, a.price_charged,
       greatest(1, round(extract(epoch from (a.ends_at - a.starts_at)) / 60)::int)
  from public.appointments a
 where a.service_id is not null
   and not exists (select 1 from public.appointment_services i where i.appointment_id = a.id);

update public.appointments a
   set services_label = s.name
  from public.services s
 where s.id = a.service_id and a.services_label is null;

-- 4. Editar um atendimento --------------------------------------------------
-- Cliente, serviços, valor, observações, dia e horário; no concluído, também o
-- pagamento. Serviço que já estava no atendimento mantém o preço e a duração
-- de quando foi marcado (a promoção continua valendo); serviço novo entra com
-- o preço de hoje. Sem serviços, a duração fica como estava.
create function public.update_appointment(
  p_id uuid,
  p_client_id uuid,
  p_service_ids uuid[],
  p_price numeric,
  p_notes text,
  p_starts_at timestamptz,
  p_time_known boolean,
  p_method text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  a public.appointments%rowtype;
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  n int := coalesce(array_length(p_service_ids, 1), 0);
  items jsonb;
  total int;
  names text;
  matched int;
begin
  select * into a from public.appointments where id = p_id for update;
  if not found then
    raise exception 'Atendimento não encontrado.' using errcode = 'P0002';
  end if;

  if n > 0 then
    select jsonb_agg(jsonb_build_object(
             'service_id', s.id,
             'position', x.ord,
             'price', coalesce(o.price,
               case when s.promo_price is not null and s.promo_until >= today
                    then s.promo_price else s.price end),
             'duration', coalesce(o.duration_minutes, s.duration_minutes)
           ) order by x.ord),
           sum(coalesce(o.duration_minutes, s.duration_minutes)),
           string_agg(s.name, ' + ' order by x.ord),
           count(*)
      into items, total, names, matched
      from unnest(p_service_ids) with ordinality as x(id, ord)
      join public.services s on s.id = x.id
      left join public.appointment_services o on o.appointment_id = p_id and o.service_id = x.id;
    if matched <> n then
      raise exception 'Serviço inválido.' using errcode = '22023';
    end if;
  else
    total := greatest(1, round(extract(epoch from (a.ends_at - a.starts_at)) / 60)::int);
  end if;

  delete from public.appointment_services where appointment_id = p_id;
  if n > 0 then
    insert into public.appointment_services (appointment_id, service_id, position, price, duration_minutes)
    select p_id, (e->>'service_id')::uuid, (e->>'position')::int, (e->>'price')::numeric, (e->>'duration')::int
      from jsonb_array_elements(items) e;
  end if;

  perform set_config('app.keep_ends', 'on', true);
  update public.appointments
     set client_id = p_client_id,
         service_id = p_service_ids[1],
         services_label = names,
         starts_at = p_starts_at,
         ends_at = p_starts_at + make_interval(mins => total),
         time_known = p_time_known,
         price_charged = p_price,
         notes = p_notes,
         -- Mudou o horário: a confirmação era do antigo.
         confirmed_at = case when p_starts_at = a.starts_at then a.confirmed_at end
   where id = p_id;
  perform set_config('app.keep_ends', '', true);

  -- Concluído: o pagamento acompanha o valor, a forma e o dia.
  if a.status = 'completed' then
    update public.payments
       set amount = p_price,
           method = coalesce(p_method, method),
           paid_at = p_starts_at
     where appointment_id = p_id;
  end if;
end;
$$;

revoke execute on function public.update_appointment(uuid, uuid, uuid[], numeric, text, timestamptz, boolean, text)
  from public, anon;
grant execute on function public.update_appointment(uuid, uuid, uuid[], numeric, text, timestamptz, boolean, text)
  to authenticated;

-- 5. Revisar despesa fixa numa transação ------------------------------------
-- Encerra a versão antiga no mês anterior e cria a nova a partir deste mês.
-- Antes eram dois passos separados: se o segundo falhasse, a despesa sumia.
create function public.revise_recurring_expense(
  p_id uuid,
  p_description text,
  p_category text,
  p_amount numeric,
  p_current date,
  p_previous date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  old_end date;
begin
  select ends_on into old_end from public.recurring_expenses where id = p_id for update;
  if not found then
    raise exception 'Despesa não encontrada.' using errcode = 'P0002';
  end if;

  update public.recurring_expenses set ends_on = p_previous where id = p_id;
  insert into public.recurring_expenses (description, category, amount, starts_on, ends_on)
  values (p_description, p_category, p_amount, p_current, old_end);
end;
$$;

revoke execute on function public.revise_recurring_expense(uuid, text, text, numeric, date, date)
  from public, anon;
grant execute on function public.revise_recurring_expense(uuid, text, text, numeric, date, date)
  to authenticated;
