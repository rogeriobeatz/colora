-- Migration: Financial Integrity & Trial Hardening
-- Prevents "Infinite Trial" bug and improves subscription tracking

-- 1. Ensure email column exists in profiles for better auditing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update existing profiles with emails from auth.users (one-time fix)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Hardened Trial Logic: One trial per email, ever.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_had_trial boolean;
  initial_tokens integer := 0;
BEGIN
  -- Check if this email has EVER received a trial credit
  -- We check token_consumptions by email (via join to profiles or NEW.email)
  SELECT EXISTS (
    SELECT 1 FROM public.token_consumptions tc
    JOIN public.profiles p ON tc.user_id = p.id
    WHERE p.email = NEW.email AND tc.source = 'trial_signup'
  ) INTO has_had_trial;

  -- Only give 3 tokens if they never had a trial
  IF NOT has_had_trial THEN
    initial_tokens := 3;
  END IF;

  -- Insert profile with safe defaults
  -- We use ON CONFLICT (id) DO NOTHING to prevent resets
  INSERT INTO public.profiles (
    id, 
    email,
    full_name, 
    company_name, 
    tokens, 
    subscription_status, 
    account_type
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    initial_tokens,
    'inactive',
    'trial'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    company_name = COALESCE(NULLIF(EXCLUDED.company_name, ''), profiles.company_name);

  -- Record the trial token credit ONLY if granted
  IF initial_tokens > 0 THEN
    INSERT INTO public.token_consumptions (user_id, amount, description, source)
    VALUES (NEW.id, initial_tokens, 'Crédito de teste gratuito', 'trial_signup');
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Clean up the obsolete ai_credits function and path
ALTER FUNCTION public.decrement_ai_credits(UUID, INTEGER) SET search_path = public;
DROP FUNCTION IF EXISTS public.decrement_ai_credits(UUID, INTEGER);
