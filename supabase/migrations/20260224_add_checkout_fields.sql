-- Adicionar campos do checkout na tabela profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'cpf',
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Comentários para documentação
COMMENT ON COLUMN profiles.full_name IS 'Nome completo do usuário do formulário de checkout';
COMMENT ON COLUMN profiles.document_type IS 'Tipo de documento: cpf ou cnpj';
COMMENT ON COLUMN profiles.document_number IS 'Número do CPF ou CNPJ formatado';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'ID do cliente no Stripe para referência';

-- Criar índice para otimizar buscas por Stripe customer_id
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
