import { useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import type { FontSet } from "@/data/defaultColors";

function normalizeFontSet(v: any): FontSet {
  if (v === "rounded" || v === "neo" || v === "grotesk") return v;
  return "grotesk";
}

const BrandingApplier = () => {
  const { company } = useStore();

  useEffect(() => {
    const root = document.documentElement;

    const fontSet = normalizeFontSet(company?.fontSet);
    root.dataset.font = fontSet;
  }, [company?.fontSet]);

  return null;
};

export default BrandingApplier;