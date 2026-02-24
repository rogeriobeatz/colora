UPDATE public.profiles 
SET subscription_status = 'active', 
    tokens = 200, 
    tokens_expires_at = now() + interval '100 days',
    last_token_deposit = CURRENT_DATE
WHERE id = '0082fa02-0b4a-4d30-8a02-ab3bbd13cdf7';