import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  Company,
  Catalog,
  Paint,
  createDefaultCompany,
  createDefaultCatalog,
  HeaderContentMode,
  HeaderStyleMode,
  FontSet,
} from "@/data/defaultColors";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Funções auxiliares
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function hexToCmyk(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return "0, 0, 0, 100";
  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);
  return `${c}, ${m}, ${y}, ${Math.round(k * 100)}`;
}

interface Profile {
  id: string;
  company_name: string | null;
  company_slug: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  avatar_url: string | null;

  company_phone: string | null;
  company_website: string | null;
  company_address: string | null;
  header_content: string | null;
  header_style: string | null;
  font_set: string | null;

  // Novos campos do checkout
  full_name: string | null;
  document_type: string | null;
  document_number: string | null;
  stripe_customer_id: string | null;

  // Sistema de Tokens
  tokens: number | null;
  tokens_expires_at: string | null;
  subscription_status: string | null;
  last_token_deposit: string | null;

  created_at?: string;
  updated_at?: string;
}

interface StoreContextType {
  company: Company | null;
  loading: boolean;
  setCompany: (company: Company) => void;
  updateCompany: (updates: Partial<Company>) => void;
  updateCompanyLocal: (updates: Partial<Company>) => void;
  fetchCompanyBySlug: (slug: string) => Promise<void>;
  refreshData: () => Promise<void>;
  initCompany: (name: string) => void;
  addCatalog: (catalog: Omit<Catalog, "id" | "paints">) => Promise<void>;
  updateCatalog: (id: string, updates: Partial<Catalog>) => Promise<void>;
  deleteCatalog: (id: string) => Promise<void>;
  importPaintsCSV: (catalogId: string, csvText: string) => void;
  exportPaintsCSV: (catalogId: string) => string;
  
  // Sistema de Tokens
  consumeToken: (amount: number, description: string) => Promise<boolean>;
  checkTokensAvailable: (amount: number) => boolean;
  depositMonthlyTokens: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function isHeaderContentMode(v: any): v is HeaderContentMode {
  return v === "logo+name" || v === "logo" || v === "name";
}
function isHeaderStyleMode(v: any): v is HeaderStyleMode {
  return v === "glass" || v === "gradient" || v === "card" || v === "minimal" || v === "primary" || v === "white" || v === "white-accent";
}
function isFontSet(v: any): v is FontSet {
  return v === "grotesk" || v === "rounded" || v === "neo";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [company, setCompanyState] = useState<Company | null>(() => {
    // Carregamento inicial do cache para velocidade instantânea
    try {
      const cached = localStorage.getItem("colora_company_cache");
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      // Validar estrutura básica do objeto Company
      if (parsed && typeof parsed === 'object' && parsed.id && parsed.name) {
        return parsed;
      }
      
      console.warn('[StoreContext] Cache com estrutura inválida, ignorando');
      return null;
    } catch (error) {
      console.error('[StoreContext] Erro ao carregar cache, limpando:', error);
      localStorage.removeItem("colora_company_cache");
      return null;
    }
  });
  const [loading, setLoading] = useState(!company);

  // Sincroniza o cache sempre que o estado muda
  useEffect(() => {
    if (company) {
      localStorage.setItem("colora_company_cache", JSON.stringify(company));
    }
  }, [company]);

  const refreshData = async () => {
    try {
      // Usar a sessão mais rápida possível
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        setLoading(false);
        return;
      }

      console.log("[StoreContext] Iniciando busca paralela de dados...");

      // BUSCA PARALELA: Perfil e Catálogos ao mesmo tempo
      const [profileRes, catalogsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('catalogs').select('*, paints(*)').eq('company_id', user.id)
      ]);

      if (profileRes.error) {
        console.error("Erro ao buscar perfil:", profileRes.error);
      }
      
      const profile = profileRes.data;
      const catalogsData = catalogsRes.data;

      if (profile) {
        const p = profile as Profile;
        
        // Montagem do objeto Company otimizada
        const formattedCompany: Company = {
          id: p.id,
          name: p.company_name || user?.user_metadata?.full_name || user?.user_metadata?.name || p.full_name || "Minha Loja",
          slug: p.company_slug || "minha-loja",
          primaryColor: p.primary_color || "#1a8a6a",
          secondaryColor: p.secondary_color || "#e87040",
          logo: p.avatar_url || undefined,
          catalogs: catalogsData && catalogsData.length > 0
            ? catalogsData.map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                active: cat.active,
                paints: cat.paints || []
              }))
            : [createDefaultCatalog()],

          phone: p.company_phone || user?.user_metadata?.phone || "",
          website: p.company_website || "",
          address: p.company_address || user?.user_metadata?.company || p.company_name || "",

          headerContent: isHeaderContentMode(p.header_content) ? p.header_content : "logo+name",
          headerStyle: isHeaderStyleMode(p.header_style) ? p.header_style : "glass",
          fontSet: isFontSet(p.font_set) ? p.font_set : "grotesk",

          tokens: p.tokens || 0,
          tokensExpiresAt: p.tokens_expires_at,
          subscriptionStatus: (p.subscription_status as 'active' | 'inactive') || 'inactive',
          lastTokenDeposit: p.last_token_deposit,
        };
        
        // Verificação de igualdade profunda simples para evitar re-renders desnecessários
        setCompanyState(prev => {
          if (JSON.stringify(prev) === JSON.stringify(formattedCompany)) return prev;
          return formattedCompany;
        });
      } else if (!company) {
        setCompanyState(createDefaultCompany(user?.user_metadata?.full_name || user?.user_metadata?.name || "Minha Loja"));
      }
    } catch (error) {
      console.error("Erro crítico no StoreContext:", error);
      if (!company) setCompanyState(createDefaultCompany("Minha Loja"));
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyBySlug = async (slug: string) => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_slug', slug)
        .maybeSingle() as any;

      if (profile) {
        const { data: catalogsData } = await supabase
          .from('catalogs')
          .select('*, paints(*)')
          .eq('company_id', profile.id);

        const p = profile as Profile;

        const formattedCompany: Company = {
          id: p.id,
          name: p.company_name || "",
          slug: p.company_slug || "",
          primaryColor: p.primary_color || "#1a8a6a",
          secondaryColor: p.secondary_color || "#e87040",
          logo: p.avatar_url || undefined,
          catalogs: (catalogsData || []).map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            active: cat.active,
            paints: cat.paints || []
          })),

          phone: p.company_phone || "",
          website: p.company_website || "",
          address: p.company_address || "",

          headerContent: isHeaderContentMode(p.header_content) ? p.header_content : "logo+name",
          headerStyle: isHeaderStyleMode(p.header_style) ? p.header_style : "glass",
          fontSet: isFontSet(p.font_set) ? p.font_set : "grotesk",

          // Sistema de Tokens
          tokens: p.tokens || 0,
          tokensExpiresAt: p.tokens_expires_at,
          subscriptionStatus: (p.subscription_status as 'active' | 'inactive') || 'inactive',
          lastTokenDeposit: p.last_token_deposit,
        };
        setCompanyState(formattedCompany);
      }
    } catch (error) {
      console.error("Error fetching public company:", error);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const handleSubscriptionUpdate = (event: CustomEvent) => {
      console.log('[StoreContext] Assinatura atualizada via evento:', event.detail);
      // Força refresh dos dados quando assinatura for atualizada
      refreshData();
    };

    window.addEventListener('subscription-updated', handleSubscriptionUpdate as EventListener);
    
    return () => {
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate as EventListener);
    };
  }, []);

  const initCompany = (name: string) => {
    if (!company) {
      setCompanyState(createDefaultCompany(name));
    }
  };

  const updateCompany = async (updates: Partial<Company>) => {
    if (!company) return;
    
    console.log('[DASHBOARD] Atualizando empresa:', updates);
    
    // Atualiza estado local imediatamente
    setCompanyState({ ...company, ...updates });
    
    // Persiste no banco de dados
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[DASHBOARD] Usuário não encontrado');
        toast.error("Usuário não autenticado");
        return;
      }
      
      // Prepara dados para atualização
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Mapeia os campos do update para o banco
      if (updates.name !== undefined) updateData.company_name = updates.name;
      if (updates.slug !== undefined) updateData.company_slug = updates.slug;
      if (updates.primaryColor !== undefined) updateData.primary_color = updates.primaryColor;
      if (updates.secondaryColor !== undefined) updateData.secondary_color = updates.secondaryColor;
      if (updates.logo !== undefined) updateData.avatar_url = updates.logo;
      if (updates.phone !== undefined) updateData.company_phone = updates.phone;
      if (updates.website !== undefined) updateData.company_website = updates.website;
      if (updates.address !== undefined) updateData.company_address = updates.address;
      if (updates.headerContent !== undefined) updateData.header_content = updates.headerContent;
      if (updates.headerStyle !== undefined) updateData.header_style = updates.headerStyle;
      if (updates.fontSet !== undefined) updateData.font_set = updates.fontSet;

      console.log('[DASHBOARD] Dados para salvar:', updateData);
      console.log('[DASHBOARD] User ID:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('[DASHBOARD] Erro ao salvar:', error);
        toast.error("Erro ao salvar alterações");
      } else {
        console.log('[DASHBOARD] Salvo com sucesso!');
        toast.success("Alterações salvas com sucesso!");
      }
    } catch (error) {
      console.error('[DASHBOARD] Erro crítico:', error);
      toast.error("Erro ao salvar alterações");
    }
  };

  const updateCompanyLocal = (updates: Partial<Company>) => {
    if (!company) return;
    
    console.log('[DASHBOARD] Atualizando estado local:', updates);
    setCompanyState({ ...company, ...updates });
  };

  const addCatalog = async (catalog: Omit<Catalog, "id" | "paints">) => {
    if (!company) return;
    
    const newCatalogData = {
      ...catalog,
      company_id: company.id,
      active: catalog.active ?? true,
    };

    try {
      const { data, error } = await supabase
        .from('catalogs')
        .insert(newCatalogData)
        .select()
        .single();

      if (error) throw error;

      const finalCatalog: Catalog = {
        id: data.id,
        name: data.name,
        active: data.active ?? true,
        paints: []
      }

      setCompanyState({
        ...company,
        catalogs: [...company.catalogs, finalCatalog],
      });

    } catch (error) {
      console.error("Error adding catalog:", error);
      toast.error("Não foi possível adicionar o catálogo. Tente novamente.");
    }
  };

  const updateCatalog = async (id: string, updates: Partial<Catalog>) => {
    if (!company) return;

    try {
      const { error } = await supabase
        .from('catalogs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setCompanyState({
        ...company,
        catalogs: company.catalogs.map(c => 
          c.id === id ? { ...c, ...updates } : c
        ),
      });
    } catch (error) {
      console.error("Error updating catalog:", error);
      toast.error("Não foi possível atualizar o catálogo. Tente novamente.");
    }
  };

  const deleteCatalog = async (id: string) => {
    if (!company) return;

    try {
      const { error } = await supabase
        .from('catalogs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompanyState({
        ...company,
        catalogs: company.catalogs.filter(c => c.id !== id),
      });

    } catch (error) {
      console.error("Error deleting catalog:", error);
      toast.error("Não foi possível remover o catálogo. Tente novamente.");
    }
  };

  const importPaintsCSV = async (catalogId: string, csvText: string) => {
    if (!company) return;
    const lines = csvText.split("\n").slice(1);
    const newPaints: Paint[] = lines.filter(l => l.trim()).map(line => {
      const [name, code, hex, category] = line.split(",");
      return {
        id: Math.random().toString(36).substring(2, 10),
        name: name?.trim() || "Sem nome",
        code: code?.trim() || "",
        hex: hex?.trim() || "#000000",
        rgb: hexToRgb(hex?.trim() || "#000000"),
        cmyk: hexToCmyk(hex?.trim() || "#000000"),
        category: category?.trim() || "Geral"
      };
    });

    // Atualiza estado local
    const updatedCatalogs = company.catalogs.map(c => 
      c.id === catalogId ? { ...c, paints: [...c.paints, ...newPaints] } : c
    );
    setCompanyState({ ...company, catalogs: updatedCatalogs });

    // Salva no banco de dados
    try {
      const catalog = company.catalogs.find(c => c.id === catalogId);
      if (!catalog) return;

      const { error } = await supabase
        .from('paints')
        .insert(newPaints.map(p => ({
          catalog_id: catalogId,
          name: p.name,
          code: p.code,
          hex: p.hex,
          rgb: p.rgb,
          cmyk: p.cmyk,
          category: p.category
        })));

      if (error) {
        console.error("Erro ao importar tintas:", error);
        toast.error("Erro ao salvar tintas no banco");
      }
    } catch (error) {
      console.error("Erro na importação:", error);
    }
  };

  const exportPaintsCSV = (catalogId: string) => {
    const catalog = company?.catalogs.find(c => c.id === catalogId);
    if (!catalog) return "";
    const header = "Nome,Código,Hex,Categoria\n";
    const rows = catalog.paints.map(p => `${p.name},${p.code},${p.hex},${p.category}`).join("\n");
    return header + rows;
  };

  // Sistema de Tokens
  const checkTokensAvailable = (amount: number): boolean => {
    if (!company) return false;
    
    // Verifica se tem tokens suficientes
    if (company.tokens < amount) return false;
    
    // Verifica se tokens não expiraram
    if (company.tokensExpiresAt) {
      const expiryDate = new Date(company.tokensExpiresAt);
      const now = new Date();
      if (now > expiryDate) return false;
    }
    
    return true;
  };

  const consumeToken = async (amount: number, description: string): Promise<boolean> => {
    if (!company) return false;
    
    // Verifica se tem tokens disponíveis
    if (!checkTokensAvailable(amount)) {
      toast.error("Tokens insuficientes ou expirados");
      return false;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Registra consumo
      await (supabase as any)
        .from('token_consumptions')
        .insert({
          user_id: user.id,
          amount: -amount,
          description
        });
      
      // Atualiza tokens
      const newTokens = company.tokens - amount;
      await updateCompany({ tokens: newTokens });
      
      toast.success(`${amount} token(s) consumido(s)`);
      return true;
    } catch (error) {
      console.error("Erro ao consumir tokens:", error);
      toast.error("Erro ao consumir tokens");
      return false;
    }
  };

  const depositMonthlyTokens = async (): Promise<void> => {
    if (!company) return;
    
    // Verifica se assinatura está ativa
    if (company.subscriptionStatus !== 'active') {
      console.log("Assinatura inativa, não depositando tokens");
      return;
    }
    
    // Verifica se já depositou este mês
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    
    if (company.lastTokenDeposit?.startsWith(currentMonth)) {
      console.log("Tokens já depositados este mês");
      return;
    }
    
    try {
      // Calcula data de expiração (180 dias a partir de agora - 6 meses)
      const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
      
      // Deposita tokens
      const newTokens = company.tokens + 200;
      await updateCompany({ 
        tokens: newTokens,
        tokensExpiresAt: expiresAt.toISOString(),
        lastTokenDeposit: now.toISOString().slice(0, 10)
      });
      
      // Registra depósito
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any)
          .from('token_consumptions')
          .insert({
            user_id: user.id,
            amount: 200,
            description: "Depósito mensal de tokens"
          });
      }
      
      toast.success("200 tokens depositados com sucesso! Validade por 6 meses.");
    } catch (error) {
      console.error("Erro ao depositar tokens:", error);
      toast.error("Erro ao depositar tokens");
    }
  };

  return (
    <StoreContext.Provider value={{ 
      company, loading, setCompany: setCompanyState, updateCompany, updateCompanyLocal,
      fetchCompanyBySlug, refreshData, initCompany, addCatalog,
      updateCatalog, deleteCatalog, importPaintsCSV, exportPaintsCSV,
      consumeToken, checkTokensAvailable, depositMonthlyTokens
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}