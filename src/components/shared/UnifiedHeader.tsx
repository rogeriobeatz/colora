import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStore } from "@/contexts/StoreContext";
import { HeaderStyleMode } from "@/data/defaultColors";
import { 
  ArrowLeft, 
  FileDown, 
  Palette, 
  Save, 
  FolderOpen, 
  Sparkles,
  Menu,
  LogOut,
  Settings
} from "lucide-react";

// Hook para calcular cores acessíveis
const useAccessibleColors = (style: HeaderStyleMode, primaryColor?: string, secondaryColor?: string) => {
  // Função para calcular contraste WCAG
  const getContrastRatio = (hex1: string, hex2: string): number => {
    const getLuminance = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
      const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
      const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
      
      return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
    };
    
    const lum1 = getLuminance(hex1);
    const lum2 = getLuminance(hex2);
    
    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  };

  // Determinar cor do texto baseada no fundo
  const getTextColor = (): string => {
    if (style === "glass" || style === "card") {
      return "text-foreground";
    }
    
    if (!primaryColor) return "text-white";
    
    const whiteContrast = getContrastRatio(primaryColor, "#FFFFFF");
    const blackContrast = getContrastRatio(primaryColor, "#000000");
    
    return whiteContrast > blackContrast ? "text-white" : "text-black";
  };

  // Determinar cor do texto secundário
  const getMutedTextColor = (): string => {
    if (style === "glass" || style === "card") {
      return "text-muted-foreground";
    }
    
    const baseColor = getTextColor();
    return baseColor === "text-white" ? "text-white/75" : "text-black/75";
  };

  // Determinar cor dos ícones
  const getIconColor = (): string => {
    if (style === "glass" || style === "card") {
      return "text-foreground";
    }
    
    return getTextColor();
  };

  // Determinar cor dos ícones secundários
  const getMutedIconColor = (): string => {
    if (style === "glass" || style === "card") {
      return "text-muted-foreground";
    }
    
    return getMutedTextColor();
  };

  return {
    textColor: getTextColor(),
    mutedTextColor: getMutedTextColor(),
    iconColor: getIconColor(),
    mutedIconColor: getMutedIconColor()
  };
};

// Hook para estilos do header
const useHeaderStyles = (style: HeaderStyleMode, primaryColor?: string, secondaryColor?: string) => {
  const colors = useAccessibleColors(style, primaryColor, secondaryColor);
  
  // Classes base do header
  const getHeaderClasses = (): string => {
    const baseClasses = "sticky top-0 z-50 transition-all duration-300";
    
    switch (style) {
      case "glass":
        return cn(baseClasses, "bg-background/80 backdrop-blur-lg border-b border-border/50");
      case "gradient":
        return cn(baseClasses, "border-b border-transparent");
      case "card":
        return cn(baseClasses, "bg-card border-b border-border shadow-lg");
      case "primary":
        return cn(baseClasses, "border-b border-transparent");
      default:
        return baseClasses;
    }
  };

  // Estilos inline para gradientes e cores sólidas
  const getHeaderStyles = (): React.CSSProperties => {
    switch (style) {
      case "gradient":
        return {
          background: `linear-gradient(135deg, ${primaryColor || "hsl(var(--primary))"} 0%, ${secondaryColor || "hsl(var(--secondary))"} 100%)`
        };
      case "primary":
        return {
          backgroundColor: primaryColor || "hsl(var(--primary))"
        };
      default:
        return {};
    }
  };

  // Classes para botões
  const getButtonClasses = (variant: "ghost" | "outline" | "default" = "ghost"): string => {
    const isColored = style === "gradient" || style === "primary";
    
    switch (variant) {
      case "ghost":
        return isColored 
          ? "text-white hover:bg-white/10 active:bg-white/20" 
          : "text-foreground hover:bg-accent active:bg-accent/80";
      case "outline":
        return isColored 
          ? "border-white/20 text-white hover:bg-white/10 hover:border-white/30" 
          : "border-border text-foreground hover:bg-accent hover:border-accent-foreground/20";
      case "default":
        return isColored 
          ? "bg-white/10 text-white hover:bg-white/20 border-white/20" 
          : "bg-primary text-primary-foreground hover:bg-primary/90";
      default:
        return "";
    }
  };

  // Classes para elementos decorativos
  const getAccentLineClasses = (): string => {
    return "h-1 w-full transition-all duration-300";
  };

  return {
    headerClasses: getHeaderClasses(),
    headerStyles: getHeaderStyles(),
    buttonClasses: getButtonClasses,
    accentLineClasses: getAccentLineClasses(),
    colors
  };
};

// Props do componente
interface UnifiedHeaderProps {
  // Conteúdo
  showLogo?: boolean;
  showName?: boolean;
  showBackButton?: boolean;
  backTo?: string;
  
  // Ações
  onMenuClick?: () => void;
  onLogout?: () => void;
  onSave?: () => void;
  onGeneratePDF?: () => void;
  onOpenProjects?: () => void;
  
  // Estados
  projectName?: string | null;
  hasUnsavedChanges?: boolean;
  hasSimulations?: boolean;
  tokens?: number;
  
  // Estilo
  variant?: "dashboard" | "simulator";
  className?: string;
}

const UnifiedHeader = ({
  showLogo = true,
  showName = true,
  showBackButton = false,
  backTo = "/dashboard",
  onMenuClick,
  onLogout,
  onSave,
  onGeneratePDF,
  onOpenProjects,
  projectName,
  hasUnsavedChanges = false,
  hasSimulations = false,
  tokens = 0,
  variant = "dashboard",
  className
}: UnifiedHeaderProps) => {
  const { company } = useStore();
  
  // Estilos disponíveis - apenas 4 modelos como solicitado
  const headerStyle: HeaderStyleMode = company?.headerStyle || "glass";
  const primaryColor = company?.primaryColor;
  const secondaryColor = company?.secondaryColor;
  
  const styles = useHeaderStyles(headerStyle, primaryColor, secondaryColor);
  
  // Configuração de conteúdo
  const headerContent = company?.headerContent || "logo+name";
  const shouldShowLogo = showLogo && (headerContent === "logo+name" || headerContent === "logo");
  const shouldShowName = showName && (headerContent === "logo+name" || headerContent === "name");

  return (
    <header className={cn(styles.headerClasses, className)} style={styles.headerStyles}>
      {/* Linha de destaque para estilo card */}
      {headerStyle === "card" && (
        <div 
          className={styles.accentLineClasses}
          style={{
            background: `linear-gradient(90deg, ${primaryColor || "#1a8a6a"}, ${secondaryColor || "#e87040"})`,
          }}
        />
      )}

      <div className="container mx-auto flex items-center justify-between h-14 sm:h-16 px-2 sm:px-4">
        {/* Lado esquerdo */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Botão voltar */}
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              asChild 
              className={cn("h-8 px-2 sm:px-3", styles.buttonClasses("ghost"))}
            >
              <Link to={backTo} className="gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voltar</span>
              </Link>
            </Button>
          )}





          {/* Logo e nome */}
          {(shouldShowLogo || shouldShowName) && (
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              {shouldShowLogo && (
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: company?.logo
                      ? "transparent"
                      : headerStyle === "gradient" || headerStyle === "primary"
                        ? "rgba(255,255,255,0.15)"
                        : primaryColor || "hsl(var(--primary))",
                  }}
                >
                  {company?.logo ? (
                    <img 
                      src={company.logo} 
                      alt={company.name} 
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <Palette className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", styles.colors.iconColor)} />
                  )}
                </div>
              )}

              {shouldShowName && (
                <div className="flex flex-col min-w-0">
                  <span className={cn(
                    "font-display font-bold text-xs sm:text-sm leading-none truncate max-w-[100px] sm:max-w-none transition-colors duration-300",
                    styles.colors.textColor
                  )}>
                    {company?.name || "Colora"}
                  </span>
                  {variant === "simulator" && (
                    <span className={cn(
                      "text-[9px] sm:text-[10px] font-medium uppercase tracking-wider truncate max-w-[100px] sm:max-w-none transition-colors duration-300",
                      styles.colors.mutedTextColor
                    )}>
                      {projectName || "Simulador"}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lado direito */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Tokens */}
          <div className={cn(
            "flex items-center gap-1 h-7 sm:h-9 px-2 sm:px-3 rounded-md border text-xs font-medium transition-all duration-300",
            styles.buttonClasses("outline")
          )}>
            <Sparkles className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", styles.colors.mutedIconColor)} />
            <span className={cn("text-[11px] sm:text-xs", styles.colors.textColor)}>{tokens}</span>
          </div>

          {/* Botões específicos do simulador */}
          {variant === "simulator" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenProjects}
                className={cn("gap-1 h-7 sm:h-9 px-2 sm:px-3 text-xs", styles.buttonClasses("outline"))}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sessões</span>
              </Button>

              <Button
                variant={hasUnsavedChanges ? "default" : "outline"}
                size="sm"
                onClick={onSave}
                className={cn("gap-1 h-7 sm:h-9 px-2 sm:px-3 text-xs", 
                  hasUnsavedChanges ? styles.buttonClasses("default") : styles.buttonClasses("outline")
                )}
                style={hasUnsavedChanges && (headerStyle === "gradient" || headerStyle === "primary") 
                  ? { backgroundColor: "rgba(255,255,255,0.2)" } 
                  : undefined
                }
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {hasUnsavedChanges ? "Salvar *" : "Salvar"}
                </span>
              </Button>

              {hasSimulations && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGeneratePDF}
                  className={cn(
                    "gap-1 h-7 sm:h-9 px-2 sm:px-3 text-xs hidden sm:inline-flex transition-all duration-300",
                    headerStyle === "gradient" || headerStyle === "primary"
                      ? styles.buttonClasses("outline")
                      : "border-primary/20 hover:bg-primary/5 text-primary"
                  )}
                >
                  <FileDown className="w-3.5 h-3.5" /> Gerar PDF
                </Button>
              )}
            </>
          )}

          {/* Botões específicos do dashboard */}
          {variant === "dashboard" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className={cn("h-8 px-2 sm:px-3", styles.buttonClasses("ghost"))}
              >
                <LogOut className="w-4 h-4" />texto
                <span className="hidden sm:inline ml-1">Sair</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default UnifiedHeader;
