-- Migration: Security Hardening
-- Resolves multiple vulnerabilities identified in the security audit

-- 1. PROTECT PROFILES: Prevent direct manipulation of sensitive fields
CREATE OR REPLACE FUNCTION public.protect_profiles_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permite alterações apenas se vierem da service_role
  -- auth.role() no Supabase retorna 'service_role' para operações administrativas
  IF (auth.role() <> 'service_role') THEN
    IF NEW.tokens IS DISTINCT FROM OLD.tokens OR
       NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id OR
       NEW.subscription_status IS DISTINCT FROM OLD.subscription_status OR
       NEW.account_type IS DISTINCT FROM OLD.account_type OR
       NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Alteração de campos sensíveis (tokens, stripe_id, etc.) não é permitida diretamente pelo usuário.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profiles_sensitive_fields ON public.profiles;
CREATE TRIGGER tr_protect_profiles_sensitive_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_sensitive_fields();

-- 2. TOKEN CONSUMPTIONS: Only system can record consumption
-- Removing the ability for users to manually insert into this table
DROP POLICY IF EXISTS "Users can insert their own consumptions" ON public.token_consumptions;
-- Apenas leitura permanece permitida para o próprio usuário
-- INSERT será feito exclusivamente via service_role nas Edge Functions

-- 3. STORAGE PRIVACY: Make images bucket private
-- Requires update in storage.buckets table
UPDATE storage.buckets SET public = false WHERE id = 'images';

-- 4. FUNCTION SEARCH PATHS: Prevent search_path hijacking
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.decrement_ai_credits(p_user_id UUID, p_amount INTEGER) SET search_path = public;

-- 5. CATALOGS & PAINTS: Explicitly restrict any write access to authenticated owners only
-- Ensure RLS is active
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paints ENABLE ROW LEVEL SECURITY;

-- Re-affirming policies
DROP POLICY IF EXISTS "Users can manage their own catalogs" ON public.catalogs;
CREATE POLICY "Users can manage their own catalogs" ON public.catalogs
  FOR ALL TO authenticated USING (auth.uid() = company_id)
  WITH CHECK (auth.uid() = company_id);

DROP POLICY IF EXISTS "Users can manage their own paints" ON public.paints;
CREATE POLICY "Users can manage their own paints" ON public.paints
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.catalogs 
      WHERE catalogs.id = paints.catalog_id AND catalogs.company_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.catalogs 
      WHERE catalogs.id = paints.catalog_id AND catalogs.company_id = auth.uid()
    )
  );

-- 6. WALL CACHE: Ensure SELECT policy exists and RLS is active
ALTER TABLE public.wall_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only see their own wall_cache" ON public.wall_cache;
CREATE POLICY "Users can only see their own wall_cache" ON public.wall_cache
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 7. CLEANUP: Remove unused column if ai_credits exists and tokens is being used
-- Only run if ai_credits was replaced by tokens
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='ai_credits') THEN
    ALTER TABLE public.profiles DROP COLUMN ai_credits;
  END IF;
END $$;
