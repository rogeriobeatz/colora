-- Criar bucket de imagens para o simulador
-- Este bucket armazena as imagens geradas pela IA (paint-wall)

-- Habilitar extensão de storage
CREATE EXTENSION IF NOT EXISTS "pg_storage";

-- Criar bucket de imagens
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('images', 'images', true, 52428800, 'image/jpeg, image/png, image/webp')
ON CONFLICT (id) DO NOTHING;

-- Política de acesso para o bucket de imagens
CREATE POLICY "Users can upload images" ON storage.buckets
FOR SELECT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload images" ON storage.buckets
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload images" ON storage.buckets
FOR UPDATE WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload images" ON storage.buckets
FOR DELETE WITH CHECK (
  auth.uid() = (SELECT owner_id FROM storage.objects WHERE id = storage.object_id)
);

-- RLS já está habilitado para storage por padrão no Supabase
