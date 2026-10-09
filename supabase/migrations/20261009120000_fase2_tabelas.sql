-- Fase 2: serviços, clientes, agenda e configurações.
-- Modelo descrito em docs/04-modelo-dados.md.

-- Configurações ---------------------------------------------------------------

-- Linha única (id = 1) com metas e regras da agenda.
create table public.settings (
  id int primary key default 1 check (id = 1),
  monthly_revenue_goal numeric(10, 2) not null default 3600 check (monthly_revenue_goal >= 0),
  monthly_appointments_goal int not null default 30 check (monthly_appointments_goal >= 0),
  -- Intervalo depois de cada atendimento, para limpar e preparar a mesa.
  buffer_minutes int not null default 15 check (buffer_minutes between 0 and 120),
  -- Dias sem atendimento para a cliente aparecer como "sumida".
  inactive_days_threshold int not null default 45 check (inactive_days_threshold > 0)
);

insert into public.settings (id) values (1);

-- Serviços -------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  -- Grupo exibido na landing page, ex.: "Fibra e gel".
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  duration_minutes int not null check (duration_minutes > 0),
  -- true quando a duração é um máximo ("até 2 h").
  duration_up_to boolean not null default false,
  -- Serviço usado em atendimentos antigos é desativado, nunca apagado.
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Clientes -------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  -- Só dígitos, com DDI: 5548999999999.
  phone text check (phone ~ '^[0-9]{12,13}$'),
  preferences text,
  created_at timestamptz not null default now()
);

create index clients_name_idx on public.clients (lower(name));
create index clients_phone_idx on public.clients (phone);

-- Atendimentos ---------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  starts_at timestamptz not null,
  -- Preenchido pelo gatilho com a duração do serviço, se não for informado.
  ends_at timestamptz not null,
  -- Fim do atendimento + intervalo. Calculado pelo gatilho; é o que bloqueia a agenda.
  blocked_until timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  -- Valor cobrado na hora: mudar o preço do serviço não altera o passado.
  price_charged numeric(10, 2) not null check (price_charged >= 0),
  notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (blocked_until >= ends_at)
);

create index appointments_starts_at_idx on public.appointments (starts_at);
create index appointments_client_idx on public.appointments (client_id, starts_at desc);

-- Preenche término, bloqueio e valor a partir do serviço e das configurações.
create function public.appointments_fill()
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

create trigger appointments_fill
  before insert or update on public.appointments
  for each row execute function public.appointments_fill();

-- Dois atendimentos ativos não podem ocupar o mesmo horário (incluindo o intervalo).
-- Cancelados e faltas liberam o horário. Erro 23P01 quando há conflito.
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (tstzrange(starts_at, blocked_until) with &&)
  where (status in ('scheduled', 'completed'));

-- Segurança (RLS) ------------------------------------------------------------
-- O cadastro público está desligado no Supabase: o único usuário autenticado é a Gabriela.

alter table public.settings enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;

create policy "Gabriela gerencia as configurações" on public.settings
  for all to authenticated using (true) with check (true);

create policy "Gabriela gerencia os serviços" on public.services
  for all to authenticated using (true) with check (true);

create policy "Gabriela gerencia as clientes" on public.clients
  for all to authenticated using (true) with check (true);

create policy "Gabriela gerencia a agenda" on public.appointments
  for all to authenticated using (true) with check (true);

-- A landing page (sem login) vê só os serviços ativos.
create policy "Site lê serviços ativos" on public.services
  for select to anon using (active);

-- Segunda camada: o Supabase concede tudo ao anônimo por padrão. Sem login, só leitura de serviços.
revoke all
  on public.settings, public.services, public.clients, public.appointments
  from anon;
grant select on public.services to anon;
grant select, insert, update, delete
  on public.settings, public.services, public.clients, public.appointments
  to authenticated;
