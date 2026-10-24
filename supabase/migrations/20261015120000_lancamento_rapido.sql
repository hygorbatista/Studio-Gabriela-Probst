-- Lançar atendimento que já aconteceu, só com o que a Gabriela lembra.
-- Para atendimentos de antes do sistema e esquecidos: cliente, serviço, horário
-- e forma de pagamento podem ficar em branco. O valor é o único obrigatório.

-- Cliente e serviço passam a ser opcionais no banco. O agendamento normal
-- continua exigindo os dois (validação na tela).
alter table public.appointments
  alter column client_id drop not null,
  alter column service_id drop not null,
  -- false: ela não lembra o horário. Fica ao meio-dia do dia, sem ocupar a agenda.
  add column time_known boolean not null default true;

-- Sem horário não ocupa a agenda: dois lançamentos no mesmo dia não conflitam.
alter table public.appointments drop constraint appointments_no_overlap;
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (tstzrange(starts_at, blocked_until) with &&)
  where (status in ('scheduled', 'completed') and time_known);

-- Sem serviço, a duração padrão é de 1 hora.
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
  elsif new.ends_at is not distinct from old.ends_at then
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

-- Forma de pagamento "não informada", para quando ela não lembra.
alter table public.payments drop constraint payments_method_check;
alter table public.payments
  add constraint payments_method_check
  check (method in ('pix', 'cash', 'debit', 'credit', 'unknown'));

-- Lança o atendimento já concluído e o pagamento numa única transação.
-- Recusa datas futuras (no horário de Brasília): para o futuro, é agendar.
create function public.record_past_appointment(
  p_starts_at timestamptz,
  p_time_known boolean,
  p_client_id uuid,
  p_service_id uuid,
  p_amount numeric,
  p_method text,
  p_notes text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if (p_starts_at at time zone 'America/Sao_Paulo')::date
     > (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'A data não pode estar no futuro.' using errcode = '22023';
  end if;

  insert into public.appointments
    (client_id, service_id, starts_at, time_known, status, price_charged, notes)
  values
    (p_client_id, p_service_id, p_starts_at, p_time_known, 'completed', p_amount, p_notes)
  returning id into new_id;

  insert into public.payments (appointment_id, amount, method, paid_at)
  values (new_id, p_amount, coalesce(p_method, 'unknown'), p_starts_at);

  return new_id;
end;
$$;

revoke execute on function public.record_past_appointment(timestamptz, boolean, uuid, uuid, numeric, text, text)
  from public, anon;
grant execute on function public.record_past_appointment(timestamptz, boolean, uuid, uuid, numeric, text, text)
  to authenticated;
