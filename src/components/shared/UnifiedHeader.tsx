import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStore } from "@/contexts/StoreContext";
import { useContrastColor } from "@/hooks/useContrastColor";
import { TokenBadge } from "@/components/ui/token-badge";
import { 
  FileDown, 
  Palette, 
  Save, 
  FolderOpen, 
  Sparkles,
  LogOut,
  ChevronLeft,
  Check,
  Pencil
} from "lucide-react";
import { useState, useEffect } from "react";

interface UnifiedHeaderProps {
  showLogo?: boolean;
  showName?: boolean;
  showBackButton?: boolean;
  backTo?: string;
  onLogout?: () => void;
  onSave?: () => void;
  onRename?: (newName: string) => void;
  onGeneratePDF?: () => void;
  onOpenProjects?: () => void;
  projectName?: string | null;
  hasUnsavedChanges?: boolean;
  hasSimulations?: boolean;
  tokens?: number;
  variant?: "dashboard" | "simulator";
  className?: string;
  primaryColor?: string;
}

const UnifiedHeader = ({
  showLogo = true,
  showName = true,
  showBackButton = false,
  backTo = "/dashboard",
  onLogout,
  onSave,
  onRename,
  onGeneratePDF,
  onOpenProjects,
  projectName,
  hasUnsavedChanges = false,
  hasSimulations = false,
  tokens = 0,
  variant = "dashboard",
  className,
  primaryColor
}: UnifiedHeaderProps) => {
  const { company } = useStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(projectName || "");

  const simulatorTextColor = useContrastColor(primaryColor || "hsl(var(--primary))");
  const logoutTextColor = useContrastColor(primaryColor || "hsl(var(--primary))");

  useEffect(() => {
    setLocalName(projectName || "");
  }, [projectName]);

  const handleNameSubmit = () => {
    if (localName.trim() && localName !== projectName) {
      onRename?.(localName);
    }
    setIsEditingName(false);
  };

  return (
    <div 
      className={cn("z-50 transition-all duration-500", className)} 
      style={{ padding: "var(--header-float, 0px)" }}
    >
      <header 
        className="h-16 flex items-center justify-between px-4 sm:px-8 transition-all duration-500 ease-in-out"
        style={{ 
          background: "var(--header-bg)",
          backdropFilter: "blur(var(--header-blur, 0px))",
          WebkitBackdropFilter: "blur(var(--header-blur, 0px))",
          borderBottom: "var(--header-border, 1px solid hsl(var(--border) / 0.5))",
          border: "var(--header-border)",
          borderRadius: "var(--header-radius, 0px)",
          boxShadow: "var(--header-shadow, none)",
          color: "var(--header-fg, inherit)"
        }}
      >
        {/* LADO ESQUERDO: MARCA & VOLTAR */}
        <div className="flex items-center gap-4 min-w-0">
          {showBackButton && (
            <Link 
              to={backTo} 
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-current/10 transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          )}

          <div className="flex items-center gap-3 min-w-0">
            {showLogo && (
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                {company?.logo ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center">
                    <Palette className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            )}
            
            {showName && (
              <div className="flex items-center gap-3 min-w-0 group">
                <div className="flex flex-col min-w-0">
                  {variant === "simulator" && isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        onBlur={handleNameSubmit}
                        onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                        autoFocus
                        className="h-7 bg-white/10 border-white/20 text-xs font-bold text-current py-0 px-2 min-w-[150px]"
                      />
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => variant === "simulator" && setIsEditingName(true)}
                        className="font-bold text-sm leading-none truncate uppercase tracking-widest opacity-90 flex items-center gap-2 text-left"
                      >
                        {projectName || company?.name || "Colora"}
                        {variant === "simulator" && (
                          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                        )}
                      </button>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 truncate">
                        {variant === "simulator" ? "Projeto em Edição" : company?.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO: AÇÕES & TOKENS */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Tokens Minimalist - Standardized */}
          <TokenBadge tokens={tokens} />

          <div className="h-4 w-px bg-current opacity-10 mx-1 hidden sm:block" />

          {/* Ações Específicas do Simulador */}
          {variant === "simulator" && (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenProjects}
                className="h-9 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-current/10"
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">Meus Projetos</span>
              </Button>

              <Button
                size="sm"
                onClick={onSave}
                className={cn(
                  "h-9 px-4 text-[10px] font-black uppercase tracking-widest transition-all",
                  hasUnsavedChanges 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                    : "bg-current/5 text-current hover:bg-current/10"
                )}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>{hasUnsavedChanges ? "Salvar Alterações" : "Salvo"}</span>
              </Button>

              {hasSimulations && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onGeneratePDF}
                  className="h-9 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-current/10 hidden lg:flex"
                >
                  <FileDown className="w-3.5 h-3.5 mr-1.5" /> Exportar
                </Button>
              )}
            </div>
          )}

          {/* Sair */}
          {onLogout && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="w-9 h-9 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>
    </div>
  );
};

export default UnifiedHeader;
