-- Confirmação da véspera (docs/12-plano-agendamentos.md, item 5.2).
-- Quando a cliente responde o lembrete, a Gabriela marca "Confirmado".
-- Vazio (null) = ainda não confirmou. Remarcar limpa a confirmação (no painel).

alter table public.appointments add column confirmed_at timestamptz;
