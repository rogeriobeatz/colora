import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, Palette } from "lucide-react";

interface SimulatorHeaderProps {
  companySlug?: string;
  companyName?: string;
  companyLogo?: string;
  hasSimulations: boolean;
  onGeneratePDF: () => void;
}

const SimulatorHeader = ({ 
  companySlug, 
  companyName, 
  companyLogo, 
  hasSimulations, 
  onGeneratePDF 
}: SimulatorHeaderProps) => (
  <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
    <div className="container mx-auto flex items-center justify-between h-14 px-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={companySlug ? `/empresa/${companySlug}` : "/dashboard"} className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
        </Button>
        <div className="h-6 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-white border border-border flex items-center justify-center overflow-hidden">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Palette className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <span className="font-display font-semibold text-foreground text-sm truncate max-w-[150px]">
            {companyName || "Simulador de Ambientes"}
          </span>
        </div>
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