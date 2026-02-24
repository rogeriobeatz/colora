// Utilitários de cor com conformidade WCAG

/**
 * Calcula a luminosidade relativa de uma cor (WCAG 2.0)
 * @param hex Cor em formato hexadecimal
 * @returns Valor de luminosidade (0-1)
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.split(',').map(Number);
  
  // Normalizar para 0-1
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;
  
  // Aplicar correção gamma
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  // Calcular luminosidade
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calcula o contraste entre duas cores (WCAG 2.0)
 * @param foreground Cor do texto
 * @param background Cor do fundo
 * @returns Razão de contraste (1-21)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determina se uma cor é clara ou escura
 * @param hex Cor em formato hexadecimal
 * @returns true se for clara, false se for escura
 */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.5;
}

/**
 * Retorna a cor de texto com melhor contraste WCAG AA
 * @param backgroundColor Cor do fundo
 * @returns Cor do texto (#000000 ou #FFFFFF)
 */
export function getContrastTextColor(backgroundColor: string): '#000000' | '#FFFFFF' {
  const whiteContrast = getContrastRatio('#FFFFFF', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);
  
  // WCAG AA requer contraste mínimo de 4.5:1
  if (whiteContrast >= 4.5 && whiteContrast >= blackContrast) {
    return '#FFFFFF';
  }
  
  if (blackContrast >= 4.5) {
    return '#000000';
  }
  
  // Se nenhum atingir WCAG AA, usar o que tiver melhor contraste
  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
}

/**
 * Retorna a cor de texto com melhor contraste WCAG AAA (mais rigoroso)
 * @param backgroundColor Cor do fundo
 * @returns Cor do texto (#000000 ou #FFFFFF)
 */
export function getAAAContrastTextColor(backgroundColor: string): '#000000' | '#FFFFFF' {
  const whiteContrast = getContrastRatio('#FFFFFF', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);
  
  // WCAG AAA requer contraste mínimo de 7:1
  if (whiteContrast >= 7 && whiteContrast >= blackContrast) {
    return '#FFFFFF';
  }
  
  if (blackContrast >= 7) {
    return '#000000';
  }
  
  // Se nenhum atingir WCAG AAA, usar o que tiver melhor contraste
  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
}

/**
 * Gera estilos com contraste WCAG para elementos
 * @param backgroundColor Cor do fundo
 * @param options Opções de configuração
 * @returns Objeto de estilos CSS
 */
export function getAccessibleStyles(
  backgroundColor: string, 
  options: {
    level?: 'AA' | 'AAA';
    includeBorder?: boolean;
    opacity?: number;
  } = {}
) {
  const { level = 'AA', includeBorder = false, opacity = 1 } = options;
  
  const textColor = level === 'AAA' ? getAAAContrastTextColor(backgroundColor) : getContrastTextColor(backgroundColor);
  const isLightBg = isLightColor(backgroundColor);
  
  const styles: any = {
    backgroundColor,
    color: textColor,
    opacity: opacity < 1 ? opacity : undefined,
  };
  
  if (includeBorder) {
    styles.border = `1px solid ${textColor}20`;
  }
  
  return styles;
}

/**
 * Converte hex para RGB
 */
function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Verifica se o contraste atende WCAG AA
 */
export function meetsWCAG_AA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/**
 * Verifica se o contraste atende WCAG AAA
 */
export function meetsWCAG_AAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 7;
}
