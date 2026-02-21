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
  const { company } = useStore(); // Use company from context

  const headerStyle = company?.headerStyle ?? "glass";
  const headerContent = company?.headerContent ?? "logo+name";
  const isPrimaryHeader = headerStyle === "primary";

  const rootClass = cn(
    "sticky top-0 z-50 border-b border-border",
    headerStyle === "glass" && "bg-background/80 backdrop-blur-lg",
    (headerStyle === "white" || headerStyle === "white-accent") && "bg-white",
    isPrimaryHeader && "bg-transparent",
  );

  const rootStyle = isPrimaryHeader ? { backgroundColor: company?.primaryColor || "hsl(var(--primary))" } : undefined;

  const titleColor = getHeaderTextColor(headerStyle);
  const mutedColor = getHeaderMutedTextColor(headerStyle);

  const showLogo = headerContent === "logo+name" || headerContent === "logo";
  const showName = headerContent === "logo+name" || headerContent === "name";

  const ghostOnPrimary = isPrimaryHeader ? "text-white hover:bg-white/10" : "";
  const outlineOnPrimary = isPrimaryHeader
    ? "border-white/20 text-white hover:bg-white/10 hover:text-white"
    : "";

  return (
    <header className={rootClass} style={rootStyle}>
      {headerStyle === "white-accent" && (
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${company?.primaryColor || "#1a8a6a"}, ${company?.secondaryColor || "#e87040"})`,
          }}
        />
      )}

      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" asChild className={cn(ghostOnPrimary)}>
            <Link to={companySlug ? `/empresa/${companySlug}` : "/dashboard"} className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </Link>
          </Button>

          <div className={cn("h-6 w-px mx-1", isPrimaryHeader ? "bg-white/20" : "bg-border")} />

          <div className="flex items-center gap-2.5 min-w-0">
            {showLogo && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: company?.logo
                    ? "transparent"
                    : isPrimaryHeader
                      ? "rgba(255,255,255,0.18)"
                      : company?.primaryColor || "hsl(var(--primary))",
                }}
              >
                {company?.logo ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                ) : (
                  <Palette className={cn("w-4 h-4", isPrimaryHeader ? "text-white" : "text-white")} />
                )}
              </div>
            )}

            {showName && (
              <div className="flex flex-col min-w-0">
                <span className={cn("font-display font-bold text-sm leading-none truncate", titleColor)}>
                  {company?.name || "Simulador"}
                </span>
                <span className={cn("text-[10px] font-medium uppercase tracking-wider truncate", mutedColor)}>
                  {projectName ? projectName : "Simulador de Ambientes"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 h-9 px-3 rounded-md border text-xs font-medium",
            outlineOnPrimary,
            !isPrimaryHeader && "border-border"
          )}>
            <Sparkles className={cn("w-3.5 h-3.5", isPrimaryHeader ? "text-white/80" : "text-amber-500")} />
            <span className={cn(titleColor)}>{company?.aiCredits ?? 0}</span>
            <span className={cn("hidden sm:inline-block", mutedColor)}>créditos</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenProjects}
            className={cn("gap-1.5", outlineOnPrimary)}
          >
            <FolderOpen className="w-3.5 h-3.5" /> Sessões
          </Button>

          <Button
            variant={hasUnsavedChanges ? "default" : "outline"}
            size="sm"
            onClick={onSave}
            className={cn("gap-1.5", outlineOnPrimary)}
            style={hasUnsavedChanges ? { backgroundColor: company?.primaryColor } : undefined}
          >
            <Save className="w-3.5 h-3.5" />
            {hasUnsavedChanges ? "Salvar *" : "Salvar"}
          </Button>

          {hasSimulations && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGeneratePDF}
              className={cn(
                "gap-1.5 hidden sm:inline-flex",
                isPrimaryHeader ? outlineOnPrimary : "border-primary/20 hover:bg-primary/5 text-primary",
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
