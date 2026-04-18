import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Company, Catalog, Paint, createDefaultCompany, createDefaultCatalog, HeaderContentMode, HeaderStyleMode, FontSet } from "@/data/defaultColors";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  border_radius?: string | null;
  document_number: string | null;
  tokens: number | null;
  tokens_expires_at: string | null;
  subscription_status: string | null;
  last_token_deposit: string | null;
  account_type: string | null;
}

interface StoreContextType {
  company: Company | null;
  loading: boolean;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
  updateCompanyLocal: (updates: Partial<Company>) => void;
  refreshData: () => Promise<void>;
  addCatalog: (catalog: Omit<Catalog, "id" | "paints">) => Promise<void>;
  updateCatalog: (id: string, updates: Partial<Catalog>) => Promise<void>;
  deleteCatalog: (id: string) => Promise<void>;
  importPaintsCSV: (catalogId: string, csvText: string) => Promise<void>;
  exportPaintsCSV: (catalogId: string) => Promise<void>;
  savePaintsToDatabase: (catalogId: string, paints: Paint[]) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [company, setCompanyState] = useState<Company | null>(() => {
    const cached = localStorage.getItem("colora_company_cache");
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!company);

  useEffect(() => {
    if (company) localStorage.setItem("colora_company_cache", JSON.stringify(company));
  }, [company]);

  const refreshData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      const [profileRes, catalogsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabase.from('catalogs').select('*, paints(*)').or(`company_id.eq.${session.user.id},is_default.eq.true`)
      ]);

      if (profileRes.data) {
        const p = profileRes.data as Profile;
        const formatted: Company = {
          id: p.id,
          name: p.company_name || "Minha Loja",
          slug: p.company_slug || "",
          primaryColor: p.primary_color || "#1a8a6a",
          secondaryColor: p.secondary_color || "#e87040",
          logo: p.avatar_url || undefined,
          catalogs: (catalogsRes.data || []).map((cat: any) => ({ 
          id: cat.id, 
          name: cat.name, 
          active: cat.active, 
          paints: (cat.paints || []).map((paint: any) => ({
            id: paint.id,
            name: paint.name,
            code: paint.code || '',
            hex: paint.hex,
            rgb: paint.rgb || '',
            cmyk: paint.cmyk || '',
            category: paint.category || '',
            subcategory: paint.subcategory || undefined,
            finish: paint.finish || 'fosco'
          })),
          logo_url: cat.logo_url || undefined
        })),
          phone: p.company_phone || "",
          website: p.company_website || "",
          address: p.company_address || "",
          headerContent: (p.header_content as HeaderContentMode) || "logo+name",
          headerStyle: (p.header_style as HeaderStyleMode) || "glass",
          fontSet: (p.font_set as FontSet) || "grotesk",
          border_radius: (p.border_radius as any) || "rounded",
          documentNumber: p.document_number || "",
          tokens: p.tokens || 0,
          tokensExpiresAt: p.tokens_expires_at,
          subscriptionStatus: (p.subscription_status as 'active' | 'inactive') || 'inactive',
          lastTokenDeposit: p.last_token_deposit,
          accountType: (p.account_type as 'trial' | 'subscriber' | 'churned') || 'trial',
        };
        setCompanyState(formatted);
      }
    } catch (error) { console.error("Error refreshing data:", error); }
    finally { setLoading(false); }
  };

  const updateCompany = async (updates: Partial<Company>) => {
    if (!company) return;
    setCompanyState({ ...company, ...updates });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.company_name = updates.name;
      if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor;
      if (updates.secondaryColor !== undefined) dbUpdates.secondary_color = updates.secondaryColor;
      if (updates.logo !== undefined) dbUpdates.avatar_url = updates.logo;
      if (updates.phone !== undefined) dbUpdates.company_phone = updates.phone;
      if (updates.website !== undefined) dbUpdates.company_website = updates.website;
      if (updates.address !== undefined) dbUpdates.company_address = updates.address;
      if (updates.headerContent !== undefined) dbUpdates.header_content = updates.headerContent;
      if (updates.headerStyle !== undefined) dbUpdates.header_style = updates.headerStyle;
      if (updates.fontSet !== undefined) dbUpdates.font_set = updates.fontSet;
      if (updates.border_radius !== undefined) dbUpdates.border_radius = updates.border_radius;
      if (updates.documentNumber !== undefined) dbUpdates.document_number = updates.documentNumber;

      const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
      if (error) throw error;
      toast.success("Alterações salvas");
    } catch (error) { toast.error("Erro ao salvar"); }
  };

  const addCatalog = async (catalog: Omit<Catalog, "id" | "paints">) => {
    if (!company) return;
    const { data, error } = await supabase.from('catalogs').insert({ ...catalog, company_id: company.id }).select().single();
    if (!error && data) {
      setCompanyState({ ...company, catalogs: [...company.catalogs, { id: data.id, name: data.name, active: data.active, paints: [] }] });
    }
  };

  const updateCatalog = async (id: string, updates: Partial<Catalog>) => {
    console.log('updateCatalog called:', id, updates);
    if (!company) return;
    const { error } = await supabase.from('catalogs').update(updates).eq('id', id);
    console.log('updateCatalog result:', error);
    if (!error) {
      setCompanyState({ ...company, catalogs: company.catalogs.map(c => c.id === id ? { ...c, ...updates } : c) });
    }
  };

  const deleteCatalog = async (id: string) => {
    if (!company) return;
    
    // Impedir exclusão de catálogo padrão
    const catalog = company.catalogs.find(c => c.id === id);
    if (catalog && catalog.id === '00000000-0000-0000-0000-000000000001') {
      toast.error("O catálogo padrão não pode ser excluído, apenas desativado.");
      return;
    }
    
    const { error } = await supabase.from('catalogs').delete().eq('id', id);
    if (!error) {
      setCompanyState({ ...company, catalogs: company.catalogs.filter(c => c.id !== id) });
    }
  };

  const importPaintsCSV = async (catalogId: string, csvText: string) => {
    if (!company) return;
    const lines = csvText.split("\n").slice(1);
    const paints = lines.filter(l => l.trim()).map(line => {
      const [name, code, hex, category] = line.split(",");
      return { catalog_id: catalogId, name: name?.trim(), code: code?.trim(), hex: hex?.trim(), category: category?.trim() || "Geral" };
    });
    const { error } = await supabase.from('paints').insert(paints);
    if (!error) refreshData();
  };

  const savePaintsToDatabase = async (catalogId: string, paints: Paint[]) => {
    console.log('=== DEBUG: savePaintsToDatabase iniciado ===');
    console.log('DEBUG: catalogId:', catalogId);
    console.log('DEBUG: paints.length:', paints.length);
    console.log('DEBUG: paints:', paints);
    
    if (!company) {
      console.error('DEBUG: company é null em savePaintsToDatabase');
      return;
    }
    
    try {
      console.log('DEBUG: Removendo cores existentes do catálogo...');
      // Remover cores existentes do catálogo
      const { error: deleteError } = await supabase.from('paints').delete().eq('catalog_id', catalogId);
      if (deleteError) {
        console.error('DEBUG: Erro ao deletar cores existentes:', deleteError);
        throw deleteError;
      }
      console.log('DEBUG: Cores existentes removidas com sucesso');
      
      // Inserir novas cores
      const paintsToInsert = paints.map(paint => ({
        catalog_id: catalogId,
        name: paint.name,
        code: paint.code,
        hex: paint.hex,
        rgb: paint.rgb,
        cmyk: paint.cmyk,
        category: paint.category,
        subcategory: paint.subcategory || null,
        finish: paint.finish
      }));
      
      console.log('DEBUG: paintsToInsert preparados:', paintsToInsert);
      console.log('DEBUG: paintsToInsert.length:', paintsToInsert.length);
      
      if (paintsToInsert.length > 0) {
        console.log('DEBUG: Inserindo novas cores no banco...');
        const { error: insertError } = await supabase.from('paints').insert(paintsToInsert);
        if (insertError) {
          console.error('DEBUG: Erro ao inserir cores:', insertError);
          throw insertError;
        }
        console.log('DEBUG: Cores inseridas com sucesso');
      } else {
        console.log('DEBUG: Nenhuma cor para inserir');
      }
      
      console.log('Cores salvas no banco:', paintsToInsert.length);
      
      console.log('DEBUG: Recarregando dados do banco...');
      // Recarregar dados do banco para garantir sincronização
      await refreshData();
      console.log('DEBUG: refreshData concluído');
    } catch (error) {
      console.error('DEBUG: Erro ao salvar cores no banco:', error);
      throw error;
    }
    
    console.log('=== DEBUG: savePaintsToDatabase finalizado ===');
  };

  const exportPaintsCSV = async (catalogId: string) => {
    if (!company) return;
    const catalog = company.catalogs.find(c => c.id === catalogId);
    if (!catalog) return;
    
    const csvContent = "Nome,Código,Hex,Categoria\n" + 
      catalog.paints.map(p => `${p.name},${p.code},${p.hex},${p.category}`).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `catalogo_${catalog.name.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => { refreshData(); }, []);

  return (
    <StoreContext.Provider value={{ 
      company, loading, updateCompany, updateCompanyLocal: (u) => company && setCompanyState({ ...company, ...u }), 
      refreshData, addCatalog, updateCatalog, deleteCatalog, importPaintsCSV, exportPaintsCSV, savePaintsToDatabase
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
