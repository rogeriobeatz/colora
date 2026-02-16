import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Company, Catalog, Paint, createDefaultCompany } from "@/data/defaultColors";

interface StoreContextType {
  company: Company | null;
  setCompany: (company: Company) => void;
  updateCompany: (updates: Partial<Company>) => void;
  addCatalog: (catalog: Catalog) => void;
  updateCatalog: (catalogId: string, updates: Partial<Catalog>) => void;
  deleteCatalog: (catalogId: string) => void;
  addPaint: (catalogId: string, paint: Paint) => void;
  updatePaint: (catalogId: string, paintId: string, updates: Partial<Paint>) => void;
  deletePaint: (catalogId: string, paintId: string) => void;
  importPaintsCSV: (catalogId: string, csvText: string) => void;
  exportPaintsCSV: (catalogId: string) => string;
  initCompany: (name: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = "colora_company";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [company, setCompanyState] = useState<Company | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (company) localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
  }, [company]);

  const setCompany = (c: Company) => setCompanyState(c);

  const updateCompany = (updates: Partial<Company>) => {
    if (!company) return;
    setCompanyState({ ...company, ...updates });
  };

  const addCatalog = (catalog: Catalog) => {
    if (!company) return;
    setCompanyState({ ...company, catalogs: [...company.catalogs, catalog] });
  };

  const updateCatalog = (catalogId: string, updates: Partial<Catalog>) => {
    if (!company) return;
    setCompanyState({
      ...company,
      catalogs: company.catalogs.map((c) => (c.id === catalogId ? { ...c, ...updates } : c)),
    });
  };

  const deleteCatalog = (catalogId: string) => {
    if (!company) return;
    setCompanyState({ ...company, catalogs: company.catalogs.filter((c) => c.id !== catalogId) });
  };

  const addPaint = (catalogId: string, paint: Paint) => {
    if (!company) return;
    setCompanyState({
      ...company,
      catalogs: company.catalogs.map((c) =>
        c.id === catalogId ? { ...c, paints: [...c.paints, paint] } : c
      ),
    });
  };

  const updatePaint = (catalogId: string, paintId: string, updates: Partial<Paint>) => {
    if (!company) return;
    setCompanyState({
      ...company,
      catalogs: company.catalogs.map((c) =>
        c.id === catalogId
          ? { ...c, paints: c.paints.map((p) => (p.id === paintId ? { ...p, ...updates } : p)) }
          : c
      ),
    });
  };

  const deletePaint = (catalogId: string, paintId: string) => {
    if (!company) return;
    setCompanyState({
      ...company,
      catalogs: company.catalogs.map((c) =>
        c.id === catalogId ? { ...c, paints: c.paints.filter((p) => p.id !== paintId) } : c
      ),
    });
  };

  const importPaintsCSV = (catalogId: string, csvText: string) => {
    if (!company) return;
    const lines = csvText.trim().split("\n").slice(1);
    const newPaints: Paint[] = lines.map((line) => {
      const [name, code, hex, rgb, cmyk, category] = line.split(",").map((s) => s.trim());
      return { id: Math.random().toString(36).substring(2, 10), name, code, hex, rgb, cmyk, category };
    });
    setCompanyState({
      ...company,
      catalogs: company.catalogs.map((c) =>
        c.id === catalogId ? { ...c, paints: [...c.paints, ...newPaints] } : c
      ),
    });
  };

  const exportPaintsCSV = (catalogId: string): string => {
    if (!company) return "";
    const catalog = company.catalogs.find((c) => c.id === catalogId);
    if (!catalog) return "";
    const header = "Nome,Código,HEX,RGB,CMYK,Categoria";
    const rows = catalog.paints.map(
      (p) => `${p.name},${p.code},${p.hex},${p.rgb},${p.cmyk},${p.category}`
    );
    return [header, ...rows].join("\n");
  };

  const initCompany = (name: string) => {
    const newCompany = createDefaultCompany(name);
    setCompanyState(newCompany);
  };

  return (
    <StoreContext.Provider
      value={{
        company, setCompany, updateCompany, addCatalog, updateCatalog, deleteCatalog,
        addPaint, updatePaint, deletePaint, importPaintsCSV, exportPaintsCSV, initCompany,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
