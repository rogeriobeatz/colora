import { useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { 
  getContrastTextColor, 
  getAAAContrastTextColor,
  getAccessibleStyles,
  isLightColor,
  meetsWCAG_AA,
  meetsWCAG_AAA
} from '@/utils/colorUtils';

/**
 * Hook para gerenciar estilos acessíveis com conformidade WCAG
 */
export function useAccessibleStyles() {
  const { company } = useStore();
  
  const primaryColor = company?.primaryColor || '#1a8a6a';
  const secondaryColor = company?.secondaryColor || '#e87040';
  
  const styles = useMemo(() => {
    // Estilos baseados na cor primária
    const primaryStyles = {
      // Botão primário com contraste WCAG AA
      primaryButton: getAccessibleStyles(primaryColor, {
        level: 'AA',
        includeBorder: false,
        opacity: 1
      }),
      
      // Botão primário com contraste WCAG AAA (mais rigoroso)
      primaryButtonAAA: getAccessibleStyles(primaryColor, {
        level: 'AAA',
        includeBorder: false,
        opacity: 1
      }),
      
      // Badge primário
      primaryBadge: getAccessibleStyles(primaryColor, {
        level: 'AA',
        includeBorder: true,
        opacity: 1
      }),
      
      // Texto sobre fundo primário
      primaryText: {
        color: getContrastTextColor(primaryColor)
      },
      
      // Texto sobre fundo primário (AAA)
      primaryTextAAA: {
        color: getAAAContrastTextColor(primaryColor)
      },
      
      // Fundo primário com transparência
      primaryBackground: {
        backgroundColor: primaryColor,
        color: getContrastTextColor(primaryColor)
      },
      
      // Fundo primário claro (com opacidade)
      primaryBackgroundLight: {
        backgroundColor: `${primaryColor}15`,
        color: isLightColor(primaryColor) ? '#000000' : '#FFFFFF'
      },
      
      // Borda primária
      primaryBorder: {
        borderColor: primaryColor
      },
      
      // Ícone primário
      primaryIcon: {
        color: getContrastTextColor(primaryColor)
      }
    };
    
    // Estilos baseados na cor secundária
    const secondaryStyles = {
      // Botão secundário com contraste WCAG AA
      secondaryButton: getAccessibleStyles(secondaryColor, {
        level: 'AA',
        includeBorder: false,
        opacity: 1
      }),
      
      // Badge secundário
      secondaryBadge: getAccessibleStyles(secondaryColor, {
        level: 'AA',
        includeBorder: true,
        opacity: 1
      }),
      
      // Texto sobre fundo secundário
      secondaryText: {
        color: getContrastTextColor(secondaryColor)
      },
      
      // Fundo secundário com transparência
      secondaryBackground: {
        backgroundColor: secondaryColor,
        color: getContrastTextColor(secondaryColor)
      },
      
      // Fundo secundário claro (com opacidade)
      secondaryBackgroundLight: {
        backgroundColor: `${secondaryColor}15`,
        color: isLightColor(secondaryColor) ? '#000000' : '#FFFFFF'
      },
      
      // Borda secundária
      secondaryBorder: {
        borderColor: secondaryColor
      },
      
      // Ícone secundário
      secondaryIcon: {
        color: getContrastTextColor(secondaryColor)
      }
    };
    
    // Estilos combinados (gradientes)
    const gradientStyles = {
      // Gradiente primário-secundário
      gradientBackground: {
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        color: getContrastTextColor(primaryColor) // Usa a cor primária como referência
      },
      
      // Gradiente com transparência
      gradientBackgroundLight: {
        background: `linear-gradient(135deg, ${primaryColor}22 0%, ${secondaryColor}11 100%)`,
        color: getContrastTextColor(primaryColor)
      }
    };
    
    // Estilos para elementos específicos
    const elementStyles = {
      // KPI Cards
      kpiCard: {
        backgroundColor: `${primaryColor}10`,
        borderColor: `${primaryColor}30`,
        color: primaryColor
      },
      
      // Status badges
      activeStatus: primaryStyles.primaryBadge,
      inactiveStatus: {
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        border: '1px solid #d1d5db'
      },
      
      // Botões de ação
      actionButton: primaryStyles.primaryButton,
      secondaryActionButton: secondaryStyles.secondaryButton,
      
      // Links e elementos interativos
      interactiveElement: {
        color: primaryColor,
        '&:hover': {
          backgroundColor: `${primaryColor}10`
        }
      }
    };
    
    return {
      primary: primaryStyles,
      secondary: secondaryStyles,
      gradient: gradientStyles,
      elements: elementStyles,
      
      // Utilitários
      isPrimaryLight: isLightColor(primaryColor),
      isSecondaryLight: isLightColor(secondaryColor),
      
      // Verificações WCAG
      primaryMeetsAA: meetsWCAG_AA('#000000', primaryColor) || meetsWCAG_AA('#FFFFFF', primaryColor),
      primaryMeetsAAA: meetsWCAG_AAA('#000000', primaryColor) || meetsWCAG_AAA('#FFFFFF', primaryColor),
      secondaryMeetsAA: meetsWCAG_AA('#000000', secondaryColor) || meetsWCAG_AA('#FFFFFF', secondaryColor),
      secondaryMeetsAAA: meetsWCAG_AAA('#000000', secondaryColor) || meetsWCAG_AAA('#FFFFFF', secondaryColor)
    };
  }, [primaryColor, secondaryColor]);
  
  return styles;
}
