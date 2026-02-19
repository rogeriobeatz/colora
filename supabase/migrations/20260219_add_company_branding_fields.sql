-- Migration to add company branding fields to profiles table
-- Run this migration to enable company customization features

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS header_content TEXT DEFAULT 'logo+name',
ADD COLUMN IF NOT EXISTS header_style TEXT DEFAULT 'glass',
ADD COLUMN IF NOT EXISTS font_set TEXT DEFAULT 'grotesk';

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policy for users to select profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);