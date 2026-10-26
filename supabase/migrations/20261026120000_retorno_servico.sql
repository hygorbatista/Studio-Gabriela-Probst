-- Retorno sugerido por serviço (docs/12-plano-agendamentos.md, item 4.2).
-- Depois de concluir, o painel oferece "Agendar o retorno?" para daqui a
-- return_days dias. As clientes dela voltam cerca de uma vez por mês: 30 por
-- padrão (os serviços que já existem também ficam com 30). Vazio (null) =
-- serviço avulso, sem sugestão de retorno.

alter table public.services
  add column return_days int default 30
  check (return_days is null or return_days between 1 and 365);
