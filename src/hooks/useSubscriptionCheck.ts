import { useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useSubscriptionCheck = () => {
  const { checkSubscription, subscriptionChecked } = useAuth();
  const lastCheckTime = useRef<number>(0);
  const CHECK_COOLDOWN = 30000; // 30 segundos

  return useCallback(async () => {
    const now = Date.now();
    
    // Evita chamadas muito frequentes
    if (now - lastCheckTime.current < CHECK_COOLDOWN) {
      console.log('[useSubscriptionCheck] Skip: chamada muito recente');
      return null;
    }
    
    // Evita chamadas duplicadas
    if (subscriptionChecked) {
      console.log('[useSubscriptionCheck] Skip: verificação já em andamento');
      return null;
    }
    
    console.log('[useSubscriptionCheck] Executando verificação de assinatura...');
    lastCheckTime.current = now;
    
    const result = await checkSubscription();
    return result;
  }, [checkSubscription, subscriptionChecked, CHECK_COOLDOWN]);
};
