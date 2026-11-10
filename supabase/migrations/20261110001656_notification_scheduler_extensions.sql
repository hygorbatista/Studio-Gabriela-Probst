-- Credentials and the production-only schedule are configured separately in Vault.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
