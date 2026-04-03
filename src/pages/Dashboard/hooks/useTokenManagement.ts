import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useTokenManagement = () => {
  const { user } = useAuth();
  const { company, refreshData } = useStore();
  
  const [tokenHistory, setTokenHistory] = useState<any[]>([]);
  const [tokenHistoryLoading, setTokenHistoryLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  // Carregar histórico de tokens com mais detalhes
  const loadTokenHistory = useCallback(async () => {
    if (!user) return;
    try {
      setTokenHistoryLoading(true);
      const { data, error } = await supabase
        .from('token_consumptions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTokenHistory(data || []);
    } catch (error) {
      console.error("Erro ao carregar histórico de tokens:", error);
    } finally {
      setTokenHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTokenHistory();
  }, [loadTokenHistory]);

  const getTokenStatus = () => {
    if (!company) return { status: 'loading', text: 'Sincronizando...' };
    if (company.tokens <= 0) return { status: 'empty', text: 'Saldo esgotado' };
    
    if (company.tokensExpiresAt) {
      const expiryDate = new Date(company.tokensExpiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 0) return { status: 'expired', text: 'Tokens expirados' };
      if (daysLeft <= 7) return { status: 'expiring', text: `Expira em ${daysLeft}d` };
    }
    return { status: 'available', text: 'Créditos ativos' };
  };

  const formatTokenAmount = (amount: number) => amount.toLocaleString('pt-BR');

  const handleCheckout = async (mode: "subscription" | "recharge") => {
    setIsCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { mode, customerData: { email: user?.email } }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url; // Redireciona na mesma aba para consistência
      }
    } catch (error: any) {
      toast.error("Não foi possível iniciar o checkout.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        // Fallback: se não tiver portal, talvez não tenha assinatura. Abre o checkout.
        toast.info("Você será redirecionado para a página de planos.");
        handleCheckout("subscription");
      }
    } catch (error: any) {
      toast.error("Erro ao acessar portal de gestão.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  return {
    tokenHistory,
    tokenHistoryLoading,
    isCheckoutLoading,
    isPortalLoading,
    getTokenStatus,
    formatTokenAmount,
    handleCheckout,
    handleManageSubscription,
    refreshHistory: loadTokenHistory
  };
};
