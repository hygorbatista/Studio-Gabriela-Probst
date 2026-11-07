-- Sobreposições ficam visíveis na agenda e nas sugestões de horários.
-- A decisão de salvar fica com a profissional.
alter table public.appointments drop constraint appointments_no_overlap;

drop trigger appointments_not_blocked on public.appointments;
drop trigger time_blocks_free on public.time_blocks;

drop function public.appointments_not_blocked();
drop function public.time_blocks_free();
