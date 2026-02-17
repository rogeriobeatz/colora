import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, Palette, Save, FolderOpen } from "lucide-react";
import { Company } from "@/data/defaultColors";

interface SimulatorHeaderProps {
  company?: Company | null;
  companySlug?: string;
  hasSimulations: boolean;
  onGeneratePDF: () => void;
  onSave: () => void;
  onOpenProjects: () => void;
  projectName?: string | null;
}

const SimulatorHeader = ({
  company,
  companySlug,
  hasSimulations,
  onGeneratePDF,
  onSave,
  onOpenProjects,
  projectName,
}: SimulatorHeaderProps) => (
  <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
    <div className="container mx-auto flex items-center justify-between h-16 px-4">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="sm" asChild>
          <Link to={companySlug ? `/empresa/${companySlug}` : "/dashboard"} className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
        </Button>
        <div className="h-6 w-px bg-border mx-1" />

        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: company?.logo ? "transparent" : company?.primaryColor || "hsl(var(--primary))" }}
          >
            {company?.logo ? (
              <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
            ) : (
              <Palette className="w-4 h-4 text-white" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-display font-bold text-foreground text-sm leading-none truncate">
              {company?.name || "Simulador"}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
              {projectName ? projectName : "Simulador de Ambientes"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onOpenProjects} className="gap-1.5">
          <FolderOpen className="w-3.5 h-3.5" /> Projetos
        </Button>

        <Button variant="outline" size="sm" onClick={onSave} className="gap-1.5">
          <Save className="w-3.5 h-3.5" /> Salvar
        </Button>

        {hasSimulations && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGeneratePDF}
            className="gap-1.5 border-primary/20 hover:bg-primary/5 text-primary hidden sm:inline-flex"
          >
            <FileDown className="w-3.5 h-3.5" /> Gerar PDF
          </Button>
        )}
      </div>
    </div>
  </header>
);

export default SimulatorHeader;