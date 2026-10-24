-- Mais categorias de despesa: contas, equipamentos, cursos, transporte,
-- alimentação e marketing. As antigas continuam valendo.

alter table public.expenses drop constraint expenses_category_check;
alter table public.expenses
  add constraint expenses_category_check
  check (category in (
    'rent', 'bills', 'mei', 'materials', 'equipment', 'courses',
    'transport', 'food', 'marketing', 'other'
  ));

alter table public.recurring_expenses drop constraint recurring_expenses_category_check;
alter table public.recurring_expenses
  add constraint recurring_expenses_category_check
  check (category in (
    'rent', 'bills', 'mei', 'materials', 'equipment', 'courses',
    'transport', 'food', 'marketing', 'other'
  ));
