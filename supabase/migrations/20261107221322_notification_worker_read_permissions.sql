-- The worker reads agenda state and monthly aggregates without customer contact data.
grant select (id, status, starts_at, ends_at, time_known, confirmed_at) on public.appointments to service_role;
grant select (birth_date) on public.clients to service_role;
grant select (amount, paid_at) on public.payments to service_role;
grant select (id, monthly_revenue_goal, monthly_appointments_goal) on public.settings to service_role;
