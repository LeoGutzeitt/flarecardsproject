-- Ativar APENAS após publicar a função e configurar os segredos no Vault.
-- Vault: flare_supabase_url = https://SEU-PROJETO.supabase.co
-- Vault: flare_auction_cron_secret = mesmo AUCTION_CRON_SECRET da Edge Function
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('flare-auction-close-and-email', '* * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='flare_supabase_url') || '/functions/v1/process-auctions',
    headers := jsonb_build_object('Content-Type','application/json','x-auction-cron-secret',
      (select decrypted_secret from vault.decrypted_secrets where name='flare_auction_cron_secret')),
    body := '{}'::jsonb, timeout_milliseconds := 10000
  );
$job$);
