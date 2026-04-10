-- Operação Limpeza de Slug: Remoção definitiva do conceito de slug público
-- Transforma o Colora em uma plataforma 100% B2B baseada em ID de usuário

-- 1. Remover coluna da tabela profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS company_slug;

-- 2. Remover índices relacionados se existirem
DROP INDEX IF EXISTS idx_profiles_company_slug;

-- 3. Atualizar a tabela de catalógos (opcional, apenas para garantir integridade)
-- Como os catálogos já usam company_id (que é o ID do perfil), não há mudanças necessárias aqui.

-- 4. Log da operação
COMMENT ON TABLE public.profiles IS 'Perfis de usuários lojistas. Slugs públicos removidos para segurança B2B.';
