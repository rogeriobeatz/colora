import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  subscriptionChecked: boolean;
  refreshCompanyData?: () => Promise<void>; // ✅ Adicionar referência
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  
  // ✅ MELHORIA: Cache para evitar múltiplas chamadas
  const lastSubscriptionCheck = useRef<string | null>(null);
  const subscriptionCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  const checkSubscription = async () => {
    try {
      console.log("[Auth] Verificando assinatura...");
      
      // ✅ MELHORIA: Evitar chamadas duplicadas
      const currentUserId = session?.user?.id;
      const lastCheck = lastSubscriptionCheck.current;
      
      // Se não há usuário ou já verificou recentemente, pula
      if (!currentUserId || (lastCheck === currentUserId)) {
        console.log("[Auth] Skip: verificação já feita recentemente");
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      // Atualiza cache
      lastSubscriptionCheck.current = currentUserId;
      
      if (error) {
        console.error("[Auth] Erro ao verificar assinatura:", error);
      } else {
        console.log("[Auth] Assinatura verificada:", data);
        
        // ✅ FORÇAR ATUALIZAÇÃO DO STORECONTEXT APÓS VERIFICAR ASSINATURA
        if (data?.success) {
          // Dispara evento customizado para o StoreContext ouvir
          window.dispatchEvent(new CustomEvent('subscription-updated', { 
            detail: { subscriptionStatus: data.subscriptionStatus, tokens: data.tokens } 
          }));
        }
      }
      setSubscriptionChecked(true);
    } catch (err) {
      console.error("[Auth] Erro ao invocar check-subscription:", err);
    }
  };

  useEffect(() => {
    // Verificar sessão inicial
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } finally {
        // Só setta loading como false DEPOIS de verificar
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // ✅ REMOVIDO: Check subscription automático no login (evita sobrecarga)
      // if (session?.user) {
      //   checkSubscription();
      // }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, checkSubscription, subscriptionChecked }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
