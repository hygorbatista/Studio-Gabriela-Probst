-- Read-only functions, subject to the caller's existing RLS policies.
create or replace function public.client_options(p_term text default '', p_offset integer default 0)
returns table(id uuid, name text, phone text)
language sql stable security invoker set search_path = ''
as $$
  with term as (
    select translate(lower(trim(left(coalesce(p_term, ''), 80))),
      'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') as name,
      regexp_replace(coalesce(p_term, ''), '[^0-9]', '', 'g') as digits
  )
  select c.id, c.name, c.phone from public.clients c cross join term t
  where t.name = '' or strpos(translate(lower(c.name),
    'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'), t.name) > 0
    or (length(t.digits) >= 3 and strpos(c.phone, t.digits) > 0)
  order by c.name, c.id
  limit 21 offset greatest(0, least(coalesce(p_offset, 0), 1000000));
$$;
revoke all on function public.client_options(text, integer) from public, anon;
grant execute on function public.client_options(text, integer) to authenticated;

create or replace function public.client_statistics(p_client_id uuid)
returns jsonb
language sql stable security invoker set search_path = ''
as $$
  with done as materialized (
    select a.*, coalesce(a.services_label, s.name) as label,
      row_number() over (order by a.starts_at desc, a.id desc) as position
    from public.appointments a left join public.services s on s.id = a.service_id
    where a.client_id = p_client_id and a.status = 'completed'
  ), summary as (
    select count(*) as visits, coalesce(sum(price_charged), 0) as total,
      coalesce(avg(price_charged), 0) as average, max(starts_at) as last,
      count(*) filter (where time_known) as known from done
  ), favorite_day as (
    select extract(isodow from starts_at at time zone 'America/Sao_Paulo')::int as day
    from done where time_known group by day order by count(*) desc, min(position) limit 1
  ), favorite_hour as (
    select extract(hour from starts_at at time zone 'America/Sao_Paulo')::int as hour
    from done where time_known group by hour order by count(*) desc, min(position) limit 1
  ), favorite_service as (
    select label from done where label is not null and label <> ''
    group by label order by count(*) desc, min(position) limit 1
  )
  select jsonb_build_object(
    'visits', visits, 'totalSpent', total, 'averageTicket', average, 'lastVisit', last,
    'nextVisit', (select min(starts_at) from public.appointments
      where client_id = p_client_id and status = 'scheduled' and starts_at >= now()),
    'favoriteService', (select label from favorite_service),
    'favoriteTime', case when known >= 2 then
      (select (array['Segundas', 'Terças', 'Quartas', 'Quintas', 'Sextas', 'Sábados', 'Domingos'])[day] from favorite_day)
      || ', por volta das ' || (select hour from favorite_hour) || 'h' else null end
  ) from summary;
$$;
revoke all on function public.client_statistics(uuid) from public, anon;
grant execute on function public.client_statistics(uuid) to authenticated;
