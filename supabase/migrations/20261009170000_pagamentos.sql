-- Pagamentos (FN-01): um por atendimento concluído.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  method text not null check (method in ('pix', 'cash', 'debit', 'credit')),
  -- Data do atendimento: o faturamento conta no dia em que o serviço foi feito,
  -- mesmo que a Gabriela conclua no sistema depois.
  paid_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index payments_paid_at_idx on public.payments (paid_at);

alter table public.payments enable row level security;

create policy "Gabriela gerencia os pagamentos" on public.payments
  for all to authenticated using (true) with check (true);

revoke all on public.payments from anon;
grant select, insert, update, delete on public.payments to authenticated;

-- Concluir: marca o atendimento e registra o pagamento numa única transação.
-- O valor pago vira o valor cobrado (pode haver desconto).
create function public.complete_appointment(
  p_appointment_id uuid,
  p_amount numeric,
  p_method text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  appointment_start timestamptz;
begin
  update public.appointments
     set status = 'completed', price_charged = p_amount
   where id = p_appointment_id
     and status in ('scheduled', 'no_show')
  returning starts_at into appointment_start;

  if not found then
    raise exception 'Atendimento não encontrado ou já concluído.' using errcode = 'P0002';
  end if;

  insert into public.payments (appointment_id, amount, method, paid_at)
  values (p_appointment_id, p_amount, p_method, appointment_start);
end;
$$;

-- Reabrir: desfaz uma conclusão, falta ou cancelamento feito por engano.
create function public.reopen_appointment(p_appointment_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.payments where appointment_id = p_appointment_id;

  update public.appointments
     set status = 'scheduled'
   where id = p_appointment_id;

  if not found then
    raise exception 'Atendimento não encontrado.' using errcode = 'P0002';
  end if;
end;
$$;

-- Funções nascem executáveis por qualquer um (PUBLIC): só a Gabriela pode.
revoke execute on function public.complete_appointment(uuid, numeric, text) from public, anon;
revoke execute on function public.reopen_appointment(uuid) from public, anon;
grant execute on function public.complete_appointment(uuid, numeric, text) to authenticated;
grant execute on function public.reopen_appointment(uuid) to authenticated;
