import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, Palette, Save, FolderOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/contexts/StoreContext";

interface SimulatorHeaderProps {
  companySlug?: string;
  hasSimulations: boolean;
  hasUnsavedChanges?: boolean;
  onGeneratePDF: () => void;
  onSave: () => void;
  onOpenProjects: () => void;
  projectName?: string | null;
}

function getHeaderTextColor(style?: string) {
  return style === "primary" ? "text-white" : "text-foreground";
}
function getHeaderMutedTextColor(style?: string) {
  return style === "primary" ? "text-white/75" : "text-muted-foreground";
}

const SimulatorHeader = ({
  companySlug,
  hasSimulations,
  onGeneratePDF,
  onSave,
  onOpenProjects,
  projectName,
  hasUnsavedChanges,
}: SimulatorHeaderProps) => {
  const { company } = useStore();

  const headerStyle = company?.headerStyle ?? "glass";
  const headerContent = company?.headerContent ?? "logo+name";
  const isPrimaryHeader = headerStyle === "primary";
  const isGradientHeader = headerStyle === "gradient";
  const isCardHeader = headerStyle === "card";
  const isMinimalHeader = headerStyle === "minimal";
  const isColoredHeader = isPrimaryHeader || isGradientHeader || isMinimalHeader;

  const rootClass = cn(
    "sticky top-0 z-50",
    headerStyle === "glass" && "bg-background/80 backdrop-blur-lg border-b border-border",
    (headerStyle === "white" || headerStyle === "white-accent") && "bg-white border-b border-border",
    isCardHeader && "bg-card border-b border-border shadow-xl",
    (isPrimaryHeader || isGradientHeader || isMinimalHeader) && "border-b border-transparent",
  );

  const rootStyle = isPrimaryHeader
    ? { backgroundColor: company?.primaryColor || "hsl(var(--primary))" }
    : isGradientHeader
      ? { background: `linear-gradient(135deg, ${company?.primaryColor || "hsl(var(--primary))"} 0%, ${company?.secondaryColor || "hsl(var(--secondary))"} 100%)` }
      : isMinimalHeader
        ? { backgroundColor: company?.primaryColor || "hsl(var(--primary))", opacity: 0.95 }
        : undefined;

  const coloredStyle = isColoredHeader ? "primary" : headerStyle;
  const titleColor = getHeaderTextColor(coloredStyle);
  const mutedColor = getHeaderMutedTextColor(coloredStyle);

  const showLogo = headerContent === "logo+name" || headerContent === "logo";
  const showName = headerContent === "logo+name" || headerContent === "name";

  const ghostOnPrimary = isColoredHeader ? "text-white hover:bg-white/10" : "";
  const outlineOnPrimary = isColoredHeader
    ? "border-white/20 text-white hover:bg-white/10 hover:text-white"
    : "";

  return (
    <header className={rootClass} style={rootStyle}>
      {(headerStyle === "white-accent" || isCardHeader) && (
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${company?.primaryColor || "#1a8a6a"}, ${company?.secondaryColor || "#e87040"})`,
          }}
        />
      )}

      <div className="container mx-auto flex items-center justify-between h-14 sm:h-16 px-2 sm:px-4">
        {/* Left side */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <Button variant="ghost" size="sm" asChild className={cn("h-8 px-2 sm:px-3", ghostOnPrimary)}>
            <Link to={companySlug ? `/empresa/${companySlug}` : "/dashboard"} className="gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
          </Button>

          <div className={cn("h-5 w-px", isColoredHeader ? "bg-white/20" : "bg-border")} />

          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            {showLogo && (
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{
                  backgroundColor: company?.logo
                    ? "transparent"
                    : isColoredHeader
                      ? "rgba(255,255,255,0.18)"
                      : company?.primaryColor || "hsl(var(--primary))",
                }}
              >
                {company?.logo ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                ) : (
                  <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                )}
              </div>
            )}

            {showName && (
              <div className="flex flex-col min-w-0">
                <span className={cn("font-display font-bold text-xs sm:text-sm leading-none truncate max-w-[100px] sm:max-w-none", titleColor)}>
                  {company?.name || "Simulador"}
                </span>
                <span className={cn("text-[9px] sm:text-[10px] font-medium uppercase tracking-wider truncate max-w-[100px] sm:max-w-none", mutedColor)}>
                  {projectName ? projectName : "Simulador"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className={cn(
            "flex items-center gap-1 h-7 sm:h-9 px-2 sm:px-3 rounded-md border text-xs font-medium",
            outlineOnPrimary,
            !isPrimaryHeader && "border-border"
          )}>
            <Sparkles className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", isColoredHeader ? "text-white/80" : "text-amber-500")} />
            <span className={cn("text-[11px] sm:text-xs", titleColor)}>{company?.tokens ?? 0}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenProjects}
            className={cn("gap-1 h-7 sm:h-9 px-2 sm:px-3 text-xs", outlineOnPrimary)}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sessões</span>
          </Button>

          <Button
            variant={hasUnsavedChanges ? "default" : "outline"}
            size="sm"
            onClick={onSave}
            className={cn("gap-1 h-7 sm:h-9 px-2 sm:px-3 text-xs", outlineOnPrimary)}
            style={hasUnsavedChanges ? { backgroundColor: company?.primaryColor } : undefined}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{hasUnsavedChanges ? "Salvar *" : "Salvar"}</span>
          </Button>

          {hasSimulations && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGeneratePDF}
              className={cn(
                "gap-1 h-7 sm:h-9 px-2 sm:px-3 text-xs hidden sm:inline-flex",
                isColoredHeader ? outlineOnPrimary : "border-primary/20 hover:bg-primary/5 text-primary",
              )}
            >
              <FileDown className="w-3.5 h-3.5" /> Gerar PDF
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default SimulatorHeader;
