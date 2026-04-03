// Performance-optimized hook for WCAG contrast color calculation
import { useMemo } from 'react';
import { WCAG_CONSTANTS } from '@/constants/wcag';

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!hex || !hex.startsWith('#')) return null;
  
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return null;
  
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
  
  return { r, g, b };
};

// Calculate relative luminance using WCAG 2.1 formula
const getLuminance = (color: number): number => {
  return color <= WCAG_CONSTANTS.LUMINANCE_THRESHOLD 
    ? color / 12.92 
    : Math.pow((color + 0.055) / 1.055, 2.4);
};

export const useContrastColor = (backgroundColor: string): string => {
  return useMemo(() => {
    // For theme colors, default to white text
    if (!backgroundColor || !backgroundColor.startsWith('#')) {
      return 'text-white';
    }
    
    const rgb = hexToRgb(backgroundColor);
    if (!rgb) return 'text-white';
    
    // Calculate relative luminance
    const { r, g, b } = rgb;
    const L = WCAG_CONSTANTS.RGB_COEFFICIENTS.R * getLuminance(r) +
        WCAG_CONSTANTS.RGB_COEFFICIENTS.G * getLuminance(g) +
        WCAG_CONSTANTS.RGB_COEFFICIENTS.B * getLuminance(b);
    
    // WCAG 2.1 AA: if luminance > 0.5, use black text, otherwise white
    return L > 0.5 ? 'text-black' : 'text-white';
  }, [backgroundColor]);
};
