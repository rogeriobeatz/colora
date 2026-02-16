import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";

interface SimulatorHeaderProps {
  companySlug?: string;
  hasSimulations: boolean;
  onGeneratePDF: () => void;
}

const SimulatorHeader = ({ companySlug, hasSimulations, onGeneratePDF }: SimulatorHeaderProps) => (
  <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
    <div className="container mx-auto flex items-center justify-between h-14 px-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={companySlug ? `/empresa/${companySlug}` : "/dashboard"} className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
        </Button>
        <div className="h-6 w-px bg-border" />
        <span className="font-display font-semibold text-foreground text-sm">Simulador de Ambientes</span>
      </div>
      <div className="flex items-center gap-2">
        {hasSimulations && (
          <Button variant="outline" size="sm" onClick={onGeneratePDF} className="gap-1.5">
            <FileDown className="w-3.5 h-3.5" /> Gerar PDF
          </Button>
        )}
      </div>
    </div>
  </header>
);

export default SimulatorHeader;
