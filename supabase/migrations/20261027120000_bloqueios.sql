-- Bloquear horário: folga, médico, almoço (docs/12-plano-agendamentos.md, item 6.1).
-- Tabela própria, para não entrar em nenhuma conta de atendimentos (faturamento,
-- metas, histórico). A agenda trata os bloqueios como horário ocupado.

create table public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- "Folga", "Médico"... Opcional.
  reason text check (reason is null or length(reason) <= 80),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index time_blocks_starts_at_idx on public.time_blocks (starts_at);

-- Atendimento ativo (com horário) não pode cair num bloqueio. O intervalo
-- depois do atendimento também conta. Erro 23P01, o mesmo de conflito entre
-- atendimentos, que a tela já traduz.
-- O nome vem depois de appointments_fill em ordem alfabética: o Postgres
-- dispara nessa ordem, então blocked_until já está calculado aqui.
create function public.appointments_not_blocked()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('scheduled', 'completed') and new.time_known and exists (
    select 1 from public.time_blocks b
     where tstzrange(b.starts_at, b.ends_at) && tstzrange(new.starts_at, new.blocked_until)
  ) then
    raise exception 'Horário bloqueado.' using errcode = '23P01';
  end if;
  return new;
end;
$$;

create trigger appointments_not_blocked
  before insert or update of starts_at, ends_at, blocked_until, status, time_known
  on public.appointments
  for each row execute function public.appointments_not_blocked();

-- E o contrário: não dá para bloquear em cima de um atendimento ativo.
create function public.time_blocks_free()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.appointments a
     where a.status in ('scheduled', 'completed') and a.time_known
       and tstzrange(a.starts_at, a.blocked_until) && tstzrange(new.starts_at, new.ends_at)
  ) then
    raise exception 'Já tem atendimento nesse horário.' using errcode = '23P01';
  end if;
  return new;
end;
$$;

create trigger time_blocks_free
  before insert or update on public.time_blocks
  for each row execute function public.time_blocks_free();

-- Segurança: só a Gabriela (logada).
alter table public.time_blocks enable row level security;

create policy "Gabriela gerencia os bloqueios" on public.time_blocks
  for all to authenticated using (true) with check (true);

revoke all on public.time_blocks from anon;
grant select, insert, update, delete on public.time_blocks to authenticated;
