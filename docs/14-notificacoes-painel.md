# Notificações do painel

O sino no cabeçalho abre as preferências da conta e a ativação deste aparelho.
A permissão é solicitada ao ativar. No iPhone, abra o painel pelo ícone da
Tela de Início. O botão de teste é independente do agendador.

## Configuração

1. Aplique a migration de notificações ao Supabase.
2. Gere um par VAPID com `npx --no-install web-push generate-vapid-keys`.
   Preserve o par entre deploys para manter as inscrições existentes.
3. Configure as variáveis da seção Web Push de `.env.example` na Vercel.
   Use um segredo Supabase de servidor, um contato VAPID válido e um segredo
   aleatório exclusivo para o agendador. Publique com a chave pública disponível
   durante o build. Separe credenciais e assinaturas de prévia e produção.
4. No Supabase de produção, habilite Cron e pg_net. No Vault, crie os segredos
   `panel_notifications_url` (URL HTTPS de produção com
   `/api/internal/notifications`) e `panel_notifications_cron_secret` (o mesmo
   valor de `NOTIFICATIONS_CRON_SECRET`). Cadastre este job após validar o envio
   manual em um aparelho.

```sql
select cron.schedule('panel-notifications', '* * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'panel_notifications_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'panel_notifications_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
$job$);
```

O job enfileira a chamada HTTP. Ao investigar falhas, confira tanto o histórico
do Cron quanto a resposta HTTP do pg_net ou os logs da rota na Vercel. A rota
retorna contagens, e `accepted` significa aceito pelo serviço push.

## Regras

- Próximo atendimento com hora conhecida e ainda agendado, com 30 ou 60 minutos de antecedência.
- Pendências a partir de 24 horas após o término, agrupadas por dia a partir das 9h.
- Aniversariantes agrupados às 9h. O dia e o mês são comparados no calendário de Brasília.
- Confirmações de amanhã agrupadas às 17h, se houver horários sem confirmação.
- Cada meta positiva atingida gera um aviso por mês por aparelho. Quando ambas são processadas juntas, o aviso é combinado.
- A lista de revisão do painel também mostra pendências recentes para permitir correção antes do aviso.
- As mensagens na tela bloqueada usam horários e contagens. Os dados da cliente são consultados no painel autenticado.
