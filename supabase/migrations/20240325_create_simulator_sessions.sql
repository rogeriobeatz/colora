-- Tabela para salvar sessões do simulador no Supabase
CREATE TABLE IF NOT EXISTS simulator_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE simulator_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can see their own sessions" ON simulator_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON simulator_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON simulator_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON simulator_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);