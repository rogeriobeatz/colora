-- Isolamento total do cache de análise por loja (B2B Isolation)
-- Adiciona user_id para garantir que a análise de um usuário não seja visível para outro

-- 1. Adicionar coluna user_id
ALTER TABLE wall_cache ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Atualizar Primary Key para incluir o user_id (permite a mesma imagem em lojas diferentes com caches diferentes)
ALTER TABLE wall_cache DROP CONSTRAINT IF EXISTS wall_cache_pkey;
ALTER TABLE wall_cache ADD PRIMARY KEY (hash, user_id);

-- 3. Atualizar Políticas de RLS para isolamento total
DROP POLICY IF EXISTS "Anyone can read wall_cache" ON wall_cache;
DROP POLICY IF EXISTS "Service role can manage wall_cache" ON wall_cache;

-- Somente o próprio usuário (ou a service role representando-o) pode ver seu cache
CREATE POLICY "Users can only see their own wall_cache" ON wall_cache
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Service role pode gerenciar tudo para as Edge Functions
CREATE POLICY "Service role full access to wall_cache" ON wall_cache
FOR ALL USING (auth.role() = 'service_role');
