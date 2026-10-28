-- A promoção deixa de entrar sozinha: no fim do Agendar, a Gabriela escolhe
-- se aplica (pedido do Hygor, 2026-10-28). Sem marcar, vale o preço cheio,
-- mesmo com a promoção em vigor.

-- 1. Agendar: p_use_promo (padrão: não) -------------------------------------
-- O padrão mantém funcionando quem ainda chama sem o parâmetro.
drop function public.create_appointment(uuid, timestamptz, uuid[], numeric, text);

create function public.create_appointment(
  p_client_id uuid,
  p_starts_at timestamptz,
  p_service_ids uuid[],
  p_price numeric,
  p_notes text,
  p_use_promo boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  total_minutes int;
  names text;
  found int;
  new_id uuid;
begin
  if coalesce(array_length(p_service_ids, 1), 0) = 0 then
    raise exception 'Escolha o serviço.' using errcode = '22023';
  end if;

  select sum(s.duration_minutes), string_agg(s.name, ' + ' order by x.ord), count(*)
    into total_minutes, names, found
    from unnest(p_service_ids) with ordinality as x(id, ord)
    join public.services s on s.id = x.id;
  if found <> array_length(p_service_ids, 1) then
    raise exception 'Serviço inválido.' using errcode = '22023';
  end if;

  insert into public.appointments
    (client_id, service_id, starts_at, ends_at, price_charged, notes, services_label)
  values
    (p_client_id, p_service_ids[1], p_starts_at,
     p_starts_at + make_interval(mins => total_minutes), p_price, p_notes, names)
  returning id into new_id;

  -- Preço de cada serviço: o promocional só se ela escolheu aplicar a promoção
  -- e a promoção do serviço está valendo hoje.
  insert into public.appointment_services (appointment_id, service_id, position, price, duration_minutes)
  select new_id, s.id, x.ord,
         case when p_use_promo and s.promo_price is not null and s.promo_until >= today
              then s.promo_price else s.price end,
         s.duration_minutes
    from unnest(p_service_ids) with ordinality as x(id, ord)
    join public.services s on s.id = x.id;

  return new_id;
end;
$$;

revoke execute on function public.create_appointment(uuid, timestamptz, uuid[], numeric, text, boolean)
  from public, anon;
grant execute on function public.create_appointment(uuid, timestamptz, uuid[], numeric, text, boolean)
  to authenticated;

-- 2. Editar: serviço novo entra com o preço cheio ---------------------------
-- O que já estava mantém o preço de quando foi marcado (com ou sem promoção).
create or replace function public.update_appointment(
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
             'price', coalesce(o.price, s.price),
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
         confirmed_at = case when p_starts_at = a.starts_at then a.confirmed_at end
   where id = p_id;
  perform set_config('app.keep_ends', '', true);

  if a.status = 'completed' then
    update public.payments
       set amount = p_price,
           method = coalesce(p_method, method),
           paid_at = p_starts_at
     where appointment_id = p_id;
  end if;
end;
$$;
