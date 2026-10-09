-- Data de nascimento (opcional), para lembrar aniversários e campanhas futuras.
alter table public.clients
  add column birth_date date check (birth_date >= '1900-01-01');

-- Busca de aniversariantes do mês.
create index clients_birth_month_idx on public.clients (extract(month from birth_date));
