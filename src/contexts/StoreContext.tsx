import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Company, Catalog, Paint, createDefaultCompany } from "@/data/defaultColors";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StoreContextType {
  company: Company | null;
  loading: boolean;
  setCompany: (company: Company) => void;
  updateCompany: (updates: Partial<Company>) => void;
  fetchCompanyBySlug: (slug: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

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
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        const { data: catalogsData } = await supabase
          .from('catalogs')
          .select('*, paints(*)')
          .eq('company_id', user.id);

        const formattedCompany: Company = {
          id: profile.id,
          name: profile.company_name || "Minha Loja",
          slug: profile.company_slug || "minha-loja",
          primaryColor: profile.primary_color || "#1a8a6a",
          secondaryColor: profile.secondary_color || "#e87040",
          logo: profile.avatar_url || undefined,
          catalogs: (catalogsData || []).map(cat => ({
            id: cat.id,
            name: cat.name,
            active: cat.active,
            paints: cat.paints || []
          }))
        };
        setCompanyState(formattedCompany);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyBySlug = async (slug: string) => {
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('company_slug', slug).single();
      if (profile) {
        const { data: catalogsData } = await supabase
          .from('catalogs')
          .select('*, paints(*)')
          .eq('company_id', profile.id)
          .eq('active', true);

        const formattedCompany: Company = {
          id: profile.id,
          name: profile.company_name || "",
          slug: profile.company_slug || "",
          primaryColor: profile.primary_color || "#1a8a6a",
          secondaryColor: profile.secondary_color || "#e87040",
          logo: profile.avatar_url || undefined,
          catalogs: (catalogsData || []).map(cat => ({
            id: cat.id,
            name: cat.name,
            active: cat.active,
            paints: cat.paints || []
          }))
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

  const updateCompany = (updates: Partial<Company>) => {
    if (!company) return;
    setCompanyState({ ...company, ...updates });
  };

  return (
    <StoreContext.Provider value={{ company, loading, setCompany: setCompanyState, updateCompany, fetchCompanyBySlug, refreshData }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}