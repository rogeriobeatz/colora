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
}

interface StoreContextType {
  company: Company | null;
  loading: boolean;
  setCompany: (company: Company) => void;
  updateCompany: (updates: Partial<Company>) => void;
  fetchCompanyBySlug: (slug: string) => Promise<void>;
  refreshData: () => Promise<void>;
  initCompany: (name: string) => void;
  addCatalog: (catalog: Catalog) => void;
  updateCatalog: (id: string, updates: Partial<Catalog>) => void;
  deleteCatalog: (id: string) => void;
  importPaintsCSV: (catalogId: string, csvText: string) => void;
  exportPaintsCSV: (catalogId: string) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function isHeaderContentMode(v: any): v is HeaderContentMode {
  return v === "logo+name" || v === "logo" || v === "name";
}
function isHeaderStyleMode(v: any): v is HeaderStyleMode {
  return v === "glass" || v === "primary" || v === "white" || v === "white-accent";
}
function isFontSet(v: any): v is FontSet {
  return v === "grotesk" || v === "rounded" || v === "neo";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [company, setCompanyState] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Usamos maybeSingle() para evitar erro 406 se o perfil não existir
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle() as any;

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Erro ao buscar perfil:", profileError);
      }

      if (profile) {
        // Buscamos catálogos. Se a tabela não existir, o Supabase retornará erro, que tratamos aqui.
        const { data: catalogsData, error: catalogsError } = await supabase
          .from('catalogs')
          .select('*, paints(*)')
          .eq('company_id', user.id) as any;

        if (catalogsError) {
          console.warn("Tabela 'catalogs' não encontrada ou erro na busca. Usando dados padrão.");
        }

        const p = profile as Profile;

        const formattedCompany: Company = {
          id: p.id,
          name: p.company_name || "Minha Loja",
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

          phone: p.company_phone || "",
          website: p.company_website || "",
          address: p.company_address || "",

          headerContent: isHeaderContentMode(p.header_content) ? p.header_content : "logo+name",
          headerStyle: isHeaderStyleMode(p.header_style) ? p.header_style : "glass",
          fontSet: isFontSet(p.font_set) ? p.font_set : "grotesk",
        };
        setCompanyState(formattedCompany);
      } else {
        // Se não houver perfil, inicializamos com dados padrão para o dashboard não quebrar
        setCompanyState(createDefaultCompany("Minha Loja"));
      }
    } catch (error) {
      console.error("Erro crítico no StoreContext:", error);
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
          .eq('company_id', profile.id)
          .eq('active', true) as any;

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
        };
        setCompanyState(formattedCompany);
      }
    } catch (error) {
      console.error("Error fetching public company:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const initCompany = (name: string) => {
    if (!company) {
      setCompanyState(createDefaultCompany(name));
    }
  };

  const updateCompany = (updates: Partial<Company>) => {
    if (!company) return;
    setCompanyState({ ...company, ...updates });
  };

  const addCatalog = (catalog: Catalog) => {
    if (!company) return;
    setCompanyState({
      ...company,
      catalogs: [...company.catalogs, catalog]
    });
  };

  const updateCatalog = (id: string, updates: Partial<Catalog>) => {
    if (!company) return;
    setCompanyState({
      ...company,
      catalogs: company.catalogs.map(c => c.id === id ? { ...c, ...updates } : c)
    });
  };

  const deleteCatalog = (id: string) => {
    if (!company) return;
    setCompanyState({
      ...company,
      catalogs: company.catalogs.filter(c => c.id !== id)
    });
  };

  const importPaintsCSV = (catalogId: string, csvText: string) => {
    if (!company) return;
    const lines = csvText.split("\n").slice(1);
    const newPaints: Paint[] = lines.filter(l => l.trim()).map(line => {
      const [name, code, hex, category] = line.split(",");
      return {
        id: Math.random().toString(36).substring(2, 10),
        name: name?.trim() || "Sem nome",
        code: code?.trim() || "",
        hex: hex?.trim() || "#000000",
        rgb: "",
        cmyk: "",
        category: category?.trim() || "Geral"
      };
    });

    setCompanyState({
      ...company,
      catalogs: company.catalogs.map(c => 
        c.id === catalogId ? { ...c, paints: [...c.paints, ...newPaints] } : c
      )
    });
  };

  const exportPaintsCSV = (catalogId: string) => {
    const catalog = company?.catalogs.find(c => c.id === catalogId);
    if (!catalog) return "";
    const header = "Nome,Código,Hex,Categoria\n";
    const rows = catalog.paints.map(p => `${p.name},${p.code},${p.hex},${p.category}`).join("\n");
    return header + rows;
  };

  return (
    <StoreContext.Provider value={{ 
      company, loading, setCompany: setCompanyState, updateCompany, 
      fetchCompanyBySlug, refreshData, initCompany, addCatalog,
      updateCatalog, deleteCatalog, importPaintsCSV, exportPaintsCSV
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