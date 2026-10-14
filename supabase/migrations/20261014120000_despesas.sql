-- Fase 3: despesas, para o resumo do mês chegar em "quanto sobrou".

-- Avulsas: lançadas no dia em que aconteceram (materiais, compras pontuais).
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null check (length(trim(description)) > 0),
  category text not null check (category in ('rent', 'mei', 'materials', 'other')),
  amount numeric(10, 2) not null check (amount >= 0),
  expense_date date not null,
  created_at timestamptz not null default now()
);

create index expenses_date_idx on public.expenses (expense_date);

-- Fixas: entram em todo mês entre starts_on e ends_on (meses guardados como o dia 1).
-- Mudar o valor encerra a versão antiga no mês anterior e cria uma nova a partir
-- do mês atual: os meses passados não mudam.
create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null check (length(trim(description)) > 0),
  category text not null check (category in ('rent', 'mei', 'materials', 'other')),
  amount numeric(10, 2) not null check (amount >= 0),
  starts_on date not null check (extract(day from starts_on) = 1),
  -- Último mês em que entra; null = sem fim.
  ends_on date check (extract(day from ends_on) = 1),
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

alter table public.expenses enable row level security;
alter table public.recurring_expenses enable row level security;

create policy "Gabriela gerencia as despesas" on public.expenses
  for all to authenticated using (true) with check (true);

create policy "Gabriela gerencia as despesas fixas" on public.recurring_expenses
  for all to authenticated using (true) with check (true);

revoke all on public.expenses, public.recurring_expenses from anon;
grant select, insert, update, delete on public.expenses, public.recurring_expenses to authenticated;
