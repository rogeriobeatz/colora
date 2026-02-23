-- Adicionar campos de tokens e assinatura na tabela profiles
ALTER TABLE profiles 
  ADD COLUMN tokens INTEGER DEFAULT 0,
  ADD COLUMN tokens_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive')),
  ADD COLUMN last_token_deposit DATE;

-- Comentários para documentação
COMMENT ON COLUMN profiles.tokens IS 'Número de tokens disponíveis para o usuário';
COMMENT ON COLUMN profiles.tokens_expires_at IS 'Data de expiração dos tokens (100 dias após depósito)';
COMMENT ON COLUMN profiles.subscription_status IS 'Status da assinatura: active ou inactive';
COMMENT ON COLUMN profiles.last_token_deposit IS 'Última data em que tokens foram depositados';
