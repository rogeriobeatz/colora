// WCAG 2.1 AA Constants
export const WCAG_CONSTANTS = {
  // Minimum contrast ratio for AA compliance
  MIN_CONTRAST_RATIO: 4.5,
  
  // Luminance threshold for sRGB linearization
  LUMINANCE_THRESHOLD: 0.03928,
  
  // RGB coefficients for relative luminance calculation
  RGB_COEFFICIENTS: {
    R: 0.2126,
    G: 0.7152,
    B: 0.0722
  },
  
  // Common opacity values
  OPACITY: {
    LIGHT: 0.1,
    MEDIUM: 0.2,
    DARK: 0.3,
    HOVER: 0.05,
    FOCUS: 0.15
  }
} as const;
