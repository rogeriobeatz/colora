-- Adicionar campos para idempotência e origem no ledger de tokens
ALTER TABLE token_consumptions
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Evitar duplicidade de créditos do mesmo evento externo (ex.: invoice.paid)
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_consumptions_source_external_id_unique
  ON token_consumptions(source, external_id)
  WHERE source IS NOT NULL AND external_id IS NOT NULL;
