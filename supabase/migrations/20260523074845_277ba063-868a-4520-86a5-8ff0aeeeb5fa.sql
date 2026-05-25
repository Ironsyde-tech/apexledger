CREATE UNIQUE INDEX IF NOT EXISTS payments_usdt_tx_hash_unique
ON public.payments (usdt_tx_hash)
WHERE usdt_tx_hash IS NOT NULL;