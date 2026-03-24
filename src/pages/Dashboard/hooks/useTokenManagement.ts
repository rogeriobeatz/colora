import { useState, useEffect } from "react";
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

  // Carregar histórico de tokens
  useEffect(() => {
    const loadTokenHistory = async () => {
      try {
        setTokenHistoryLoading(true);
        const { data, error } = await supabase
          .from('token_consumptions')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setTokenHistory(data || []);
      } catch (error) {
        console.error("Erro ao carregar histórico de tokens:", error);
      } finally {
        setTokenHistoryLoading(false);
      }
    };

    if (user) {
      loadTokenHistory();
    }
  }, [user]);

  // Funções auxiliares para tokens
  const getTokenStatus = () => {
    if (!company) return { status: 'loading', color: 'gray', text: 'Carregando...' };

    if (company.tokens <= 0) {
      return { status: 'empty', color: 'red', text: 'Sem tokens' };
    }

    if (company.tokensExpiresAt) {
      const expiryDate = new Date(company.tokensExpiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 7) {
        return { status: 'expiring', color: 'orange', text: `Expira em ${daysLeft} dias` };
      }
    }

    return { status: 'available', color: 'green', text: 'Disponíveis' };
  };

  const formatTokenAmount = (amount: number) => {
    return amount.toLocaleString('pt-BR');
  };

  const handleCheckout = async (mode: "subscription" | "recharge") => {
    setIsCheckoutLoading(true);
    try {
      const customerData = {
        email: user?.email,
        name: company?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0],
        company: company?.name,
        phone: company?.phone,
        document: '',
        documentType: 'cpf'
      };

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          mode,
          customerData
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast.error("Erro ao abrir portal. Verifique se possui uma assinatura ativa.");
    }
  };

  return {
    tokenHistory,
    tokenHistoryLoading,
    isCheckoutLoading,
    getTokenStatus,
    formatTokenAmount,
    handleCheckout,
    handleManageSubscription
  };
};
