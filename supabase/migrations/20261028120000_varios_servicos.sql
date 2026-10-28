-- Vários serviços num atendimento (pés e mãos), preço promocional e o
-- intervalo de 15 min deixando de travar a agenda. Pedido do Hygor em
-- 2026-10-27 (docs/12-plano-agendamentos.md, "Ajustes depois do uso").

-- 1. O intervalo depois do atendimento vira só aviso (na tela) -------------
-- O conflito passa a considerar só o atendimento em si (starts_at a ends_at).
-- Atender duas clientes ao mesmo tempo continua proibido.
alter table public.appointments drop constraint appointments_no_overlap;
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (tstzrange(starts_at, ends_at) with &&)
  where (status in ('scheduled', 'completed') and time_known);

-- Bloqueios também: o intervalo não conta.
create or replace function public.appointments_not_blocked()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('scheduled', 'completed') and new.time_known and exists (
    select 1 from public.time_blocks b
     where tstzrange(b.starts_at, b.ends_at) && tstzrange(new.starts_at, new.ends_at)
  ) then
    raise exception 'Horário bloqueado.' using errcode = '23P01';
  end if;
  return new;
end;
$$;

create or replace function public.time_blocks_free()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.appointments a
     where a.status in ('scheduled', 'completed') and a.time_known
       and tstzrange(a.starts_at, a.ends_at) && tstzrange(new.starts_at, new.ends_at)
  ) then
    raise exception 'Já tem atendimento nesse horário.' using errcode = '23P01';
  end if;
  return new;
end;
$$;

-- 2. Preço promocional no serviço ------------------------------------------
-- Vale até promo_until (inclusive, no horário de Brasília). Os dois juntos.
alter table public.services
  add column promo_price numeric(10, 2) check (promo_price >= 0),
  add column promo_until date,
  add constraint services_promo_both check ((promo_price is null) = (promo_until is null));

-- 3. Vários serviços num atendimento ---------------------------------------
-- appointments.service_id continua sendo o primeiro serviço (as telas e
-- relatórios antigos seguem funcionando). Os serviços de cada atendimento
-- ficam aqui, com o preço e a duração daquele dia.
create table public.appointment_services (
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  position int not null,
  price numeric(10, 2) not null check (price >= 0),
  duration_minutes int not null check (duration_minutes > 0),
  primary key (appointment_id, position)
);

create index appointment_services_service_idx on public.appointment_services (service_id);

-- Nome pronto para mostrar: "Manicure + Pedicure". Vazio nos atendimentos
-- antigos (as telas usam o nome do serviço único).
alter table public.appointments add column services_label text;

alter table public.appointment_services enable row level security;

create policy "Gabriela gerencia os serviços dos atendimentos" on public.appointment_services
  for all to authenticated using (true) with check (true);

revoke all on public.appointment_services from anon;
grant select, insert, update, delete on public.appointment_services to authenticated;

-- Agenda um atendimento com um ou mais serviços numa transação só. A duração é
-- a soma; o valor é o informado (a tela sugere a soma dos preços, com promoção).
create function public.create_appointment(
  p_client_id uuid,
  p_starts_at timestamptz,
  p_service_ids uuid[],
  p_price numeric,
  p_notes text
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

  insert into public.appointment_services (appointment_id, service_id, position, price, duration_minutes)
  select new_id, s.id, x.ord,
         case when s.promo_price is not null and s.promo_until >= today then s.promo_price else s.price end,
         s.duration_minutes
    from unnest(p_service_ids) with ordinality as x(id, ord)
    join public.services s on s.id = x.id;

  return new_id;
end;
$$;

revoke execute on function public.create_appointment(uuid, timestamptz, uuid[], numeric, text) from public, anon;
grant execute on function public.create_appointment(uuid, timestamptz, uuid[], numeric, text) to authenticated;

-- 4. Tabela de serviços nova (pedido do Hygor, 2026-10-27) -------------------
update public.services set duration_minutes = 180, duration_up_to = true
 where name = 'Aplicação de fibra de vidro';
-- Aplicação em promoção por R$ 100 neste mês.
update public.services set promo_price = 100, promo_until = '2026-10-31'
 where name = 'Aplicação de fibra de vidro';
update public.services set duration_minutes = 120, duration_up_to = false
 where name = 'Manutenção de fibra';
update public.services set duration_minutes = 120, duration_up_to = false, price = 100
 where name = 'Banho de gel';
update public.services set duration_minutes = 90, duration_up_to = false
 where name = 'Esmaltação em gel';
update public.services set duration_minutes = 40, duration_up_to = false
 where name in ('Manicure', 'Pedicure');

-- A Blindagem sai: é apagada se nunca foi usada; senão, só desativada (o
-- histórico continua apontando para ela).
delete from public.services s
 where s.name = 'Blindagem'
   and not exists (select 1 from public.appointments a where a.service_id = s.id);
update public.services set active = false where name = 'Blindagem';
