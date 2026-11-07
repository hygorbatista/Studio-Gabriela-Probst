create table public.recurring_expense_month_overrides (
  recurring_expense_id uuid not null references public.recurring_expenses(id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  amount numeric(10, 2) check (amount >= 0),
  description text,
  category text,
  primary key (recurring_expense_id, month),
  check (
    (amount is null and description is null and category is null) or
    (amount is not null and description is not null and category is not null
      and length(trim(description)) between 1 and 80
      and category in ('rent', 'bills', 'mei', 'materials', 'equipment', 'courses', 'transport', 'food', 'marketing', 'other'))
  )
);

create index recurring_expense_month_overrides_month_idx
  on public.recurring_expense_month_overrides(month);

alter table public.recurring_expense_month_overrides enable row level security;
create policy "Gerenciar ajustes de despesas fixas"
  on public.recurring_expense_month_overrides for all to authenticated
  using (true) with check (true);
revoke all on public.recurring_expense_month_overrides from public, anon;
grant select, insert, update, delete on public.recurring_expense_month_overrides to authenticated;

create function public.set_recurring_expense_month(
  p_id uuid, p_month date, p_amount numeric, p_description text, p_category text
)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
  perform 1 from public.recurring_expenses
    where id = p_id and starts_on <= p_month and (ends_on is null or ends_on >= p_month)
    for update;
  if not found then
    raise exception 'Despesa não se aplica a este mês.' using errcode = 'P0002';
  end if;
  insert into public.recurring_expense_month_overrides
    (recurring_expense_id, month, amount, description, category)
  values (p_id, p_month, p_amount, p_description, p_category)
  on conflict (recurring_expense_id, month) do update
    set amount = excluded.amount, description = excluded.description, category = excluded.category;
end;
$$;

revoke execute on function public.set_recurring_expense_month(uuid, date, numeric, text, text) from public, anon;
grant execute on function public.set_recurring_expense_month(uuid, date, numeric, text, text) to authenticated;

create or replace function public.revise_recurring_expense(
  p_id uuid, p_description text, p_category text, p_amount numeric, p_current date, p_previous date
)
returns void language plpgsql security invoker set search_path = ''
as $$
declare
  old_end date;
  new_id uuid;
begin
  select ends_on into old_end from public.recurring_expenses
    where id = p_id and starts_on < p_current and (ends_on is null or ends_on >= p_current)
    for update;
  if not found then
    raise exception 'Despesa não encontrada.' using errcode = 'P0002';
  end if;

  update public.recurring_expenses set ends_on = p_previous where id = p_id;
  insert into public.recurring_expenses (description, category, amount, starts_on, ends_on)
  values (p_description, p_category, p_amount, p_current, old_end)
  returning id into new_id;
  update public.recurring_expense_month_overrides
    set recurring_expense_id = new_id
    where recurring_expense_id = p_id and month >= p_current;
end;
$$;
