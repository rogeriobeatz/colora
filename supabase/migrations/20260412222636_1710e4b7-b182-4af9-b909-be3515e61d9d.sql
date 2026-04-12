
-- Add account_type to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'trial';

-- Add external_id and source to token_consumptions (for idempotency)
ALTER TABLE public.token_consumptions 
ADD COLUMN IF NOT EXISTS external_id text,
ADD COLUMN IF NOT EXISTS source text;

-- Create function to handle new user signup with trial tokens
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_profile_id uuid;
BEGIN
  -- Insert profile with trial defaults
  INSERT INTO public.profiles (
    id, 
    full_name, 
    company_name, 
    company_slug, 
    tokens, 
    subscription_status, 
    account_type
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_slug', ''),
    3,
    'inactive',
    'trial'
  )
  ON CONFLICT (id) DO UPDATE SET
    tokens = CASE 
      WHEN profiles.tokens = 0 AND profiles.account_type = 'trial' 
      THEN 3 
      ELSE profiles.tokens 
    END;

  -- Record the trial token credit
  INSERT INTO public.token_consumptions (user_id, amount, description, source)
  VALUES (NEW.id, 3, 'Crédito de teste gratuito', 'trial_signup');

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
