-- Tabela para cache de análises de paredes
CREATE TABLE IF NOT EXISTS wall_cache (
  hash TEXT PRIMARY KEY,
  surfaces JSONB NOT NULL DEFAULT '[]',
  room_name TEXT DEFAULT '',
  room_type TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_wall_cache_created_at ON wall_cache(created_at);

-- Habilitar RLS
ALTER TABLE wall_cache ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (todos podem ler, apenas service role pode escrever)
CREATE POLICY "Anyone can read wall_cache" ON wall_cache
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage wall_cache" ON wall_cache
  FOR ALL USING (auth.role() = 'service_role');
