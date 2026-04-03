import { useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import type { FontSet } from "@/data/defaultColors";
import { WCAG_CONSTANTS } from "@/constants/wcag";

function normalizeFontSet(v: any): FontSet {
  if (v === "rounded" || v === "neo" || v === "grotesk") return v;
  return "grotesk";
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  if (!hex || hex === 'undefined' || hex === 'null') return { h: 222, s: 47, l: 11 };
  let r = 0, g = 0, b = 0;
  try {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }
  } catch {
    return { h: 222, s: 47, l: 11 };
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Compute relative luminance per WCAG 2.1 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= WCAG_CONSTANTS.LUMINANCE_THRESHOLD
      ? c / 12.92
      : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return WCAG_CONSTANTS.RGB_COEFFICIENTS.R * rs +
         WCAG_CONSTANTS.RGB_COEFFICIENTS.G * gs +
         WCAG_CONSTANTS.RGB_COEFFICIENTS.B * bs;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

/** Contrast ratio between two relative luminances */
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Returns WCAG AA-safe foreground HSL string for a given background hex */
function wcagSafeForeground(bgHex: string): string {
  try {
    const [r, g, b] = hexToRgb(bgHex);
    const bgLum = relativeLuminance(r, g, b);
    const whiteLum = relativeLuminance(255, 255, 255);
    const blackLum = relativeLuminance(0, 0, 0);

    const whiteContrast = contrastRatio(whiteLum, bgLum);
    const blackContrast = contrastRatio(bgLum, blackLum);

    // Pick the one with higher contrast; prefer white for visual appeal if both pass
    if (whiteContrast >= WCAG_CONSTANTS.MIN_CONTRAST_RATIO) return "0 0% 100%";
    if (blackContrast >= WCAG_CONSTANTS.MIN_CONTRAST_RATIO) return "222 47% 11%";

    // Fallback: use the one with higher contrast
    return whiteContrast > blackContrast ? "0 0% 100%" : "222 47% 11%";
  } catch {
    return "0 0% 100%";
  }
}

const BrandingApplier = () => {
  const { company } = useStore();

  useEffect(() => {
    if (!company) return;

    const root = document.documentElement;
    const p = hexToHsl(company.primaryColor || "#3b82f6");
    const s = hexToHsl(company.secondaryColor || "#1d4ed8");
    const fontSet = normalizeFontSet(company.fontSet);

    const isMinimal = company.headerStyle === "glass" || company.headerStyle === "card";

    // 1. BASE VARIABLES with WCAG-safe foregrounds
    root.style.setProperty("--primary", `${p.h} ${p.s}% ${p.l}%`);
    root.style.setProperty("--secondary", `${s.h} ${s.s}% ${s.l}%`);

    const primaryFg = wcagSafeForeground(company.primaryColor || "#3b82f6");
    const secondaryFg = wcagSafeForeground(company.secondaryColor || "#1d4ed8");
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--secondary-foreground", secondaryFg);

    const safeL = p.l > 55 ? 35 : p.l;
    root.style.setProperty("--primary-safe", `${p.h} ${p.s}% ${safeL}%`);

    // 2. GEOMETRY
    const radiusMap: Record<string, string> = { rounded: "1.5rem", grotesk: "0.6rem", neo: "0px" };
    root.style.setProperty("--radius", radiusMap[fontSet] || "0.5rem");
    root.dataset.font = fontSet;

    // 3. HEADER & SIDEBAR ARCHITECTURE
    if (isMinimal) {
      root.style.setProperty("--header-bg", "rgba(255, 255, 255, 0.8)");
      root.style.setProperty("--header-blur", "12px");
      root.style.setProperty("--header-fg", "hsl(222 47% 11%)");
      root.style.setProperty("--header-border", "1px solid rgba(0, 0, 0, 0.06)");
      root.style.setProperty("--header-float", "0px");
      root.style.setProperty("--header-radius", "0px");
      root.style.setProperty("--header-shadow", "none");

      root.style.setProperty("--sidebar-background", "0 0% 100%");
      root.style.setProperty("--sidebar-foreground", "222 47% 11%");
      root.style.setProperty("--sidebar-border", "rgba(0, 0, 0, 0.06)");
      root.style.setProperty("--sidebar-accent", `${p.h} ${p.s}% ${p.l}% / 0.06`);
      root.style.setProperty("--sidebar-accent-foreground", `${p.h} ${p.s}% ${safeL}%`);
      root.style.setProperty("--sidebar-muted-foreground", "215 16% 47%");
      root.style.setProperty("--sidebar-blur", "0px");
    } else {
      const sidebarL = Math.max(8, Math.min(p.l, 16));
      root.style.setProperty("--header-bg", `linear-gradient(135deg, hsl(${p.h} ${p.s}% ${p.l}%), hsl(${s.h} ${s.s}% ${s.l}%))`);
      root.style.setProperty("--header-fg", `hsl(${primaryFg})`);
      root.style.setProperty("--header-float", "10px");
      root.style.setProperty("--header-radius", "1rem");
      root.style.setProperty("--header-shadow", "0 10px 20px -5px rgba(0,0,0,0.1)");
      root.style.setProperty("--header-border", "none");
      root.style.setProperty("--header-blur", "0px");

      // Sidebar dark mode: ensure text contrasts against dark sidebar
      root.style.setProperty("--sidebar-background", `${p.h} ${p.s}% ${sidebarL}%`);
      root.style.setProperty("--sidebar-foreground", "0 0% 98%");
      root.style.setProperty("--sidebar-border", "rgba(255, 255, 255, 0.04)");
      root.style.setProperty("--sidebar-accent", "0 0% 100% / 0.12");
      root.style.setProperty("--sidebar-accent-foreground", "0 0% 100%");
      root.style.setProperty("--sidebar-muted-foreground", `${p.h} ${Math.min(p.s, 30)}% 65%`);
      root.style.setProperty("--sidebar-blur", "0px");
    }

  }, [company?.primaryColor, company?.secondaryColor, company?.fontSet, company?.headerStyle]);

  return null;
};

export default BrandingApplier;
