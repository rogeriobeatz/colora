alter table public.profiles
add column if not exists company_phone text,
add column if not exists company_website text,
add column if not exists company_address text,
add column if not exists header_content text,
add column if not exists header_style text,
add column if not exists font_set text;