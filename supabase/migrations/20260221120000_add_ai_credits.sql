-- Adiciona a coluna de créditos na tabela de perfis
ALTER TABLE public.profiles
ADD COLUMN ai_credits INTEGER NOT NULL DEFAULT 200;

-- Cria um comentário na coluna para documentação
COMMENT ON COLUMN public.profiles.ai_credits IS 'Número de créditos de IA disponíveis para o usuário.';

-- Cria a função para decrementar créditos de forma segura
CREATE OR REPLACE FUNCTION public.decrement_ai_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Bloqueia a linha do usuário para evitar race conditions
  SELECT ai_credits INTO current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  -- Verifica se há créditos suficientes
  IF current_credits < p_amount THEN
    RAISE EXCEPTION 'Créditos de IA insuficientes. Saldo atual: %, Custo: %', current_credits, p_amount;
  END IF;

  -- Calcula e atualiza os novos créditos
  new_credits := current_credits - p_amount;
  UPDATE public.profiles SET ai_credits = new_credits WHERE id = p_user_id;

  -- Retorna o novo saldo
  RETURN new_credits;
END;
$$;

-- Garante que a função só pode ser executada por usuários autenticados através da API
GRANT EXECUTE ON FUNCTION public.decrement_ai_credits(UUID, INTEGER) TO authenticated;
