-- Tabela para registrar consumos de tokens
CREATE TABLE IF NOT EXISTS token_consumptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE token_consumptions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can see their own consumptions" ON token_consumptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consumptions" ON token_consumptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_token_consumptions_user_id ON token_consumptions(user_id);
CREATE INDEX idx_token_consumptions_created_at ON token_consumptions(created_at);
