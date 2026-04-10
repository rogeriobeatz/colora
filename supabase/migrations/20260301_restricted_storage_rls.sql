-- Políticas de acesso RESTRITAS para o bucket de imagens (Uso exclusivo de Lojistas/Vendedores)
-- Garante que apenas usuários autenticados possam interagir com o sistema

-- Remover políticas anteriores
DROP POLICY IF EXISTS "Public read access for images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;

-- 1. Permite leitura apenas para usuários autenticados
CREATE POLICY "Authenticated users can read images" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'images');

-- 2. Permite upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');

-- 3. Permite que o usuário gerencie apenas seus próprios uploads (Isolamento por Vendedor)
CREATE POLICY "Users can manage own images" ON storage.objects
FOR ALL TO authenticated USING (auth.uid() = owner_id);

-- 4. Service role mantém acesso total para as Edge Functions de IA
CREATE POLICY "Service role full access" ON storage.objects
FOR ALL USING (auth.role() = 'service_role');
