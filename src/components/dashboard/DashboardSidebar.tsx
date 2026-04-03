import React from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Palette, 
  User, 
  CreditCard, 
  PlusCircle, 
  ChevronRight,
  LogOut,
  Settings,
  Box,
  FolderOpen
} from "lucide-react";

interface SidebarItemProps {
  icon?: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  badge?: string | number;
  image?: string;
}

const SidebarItem = ({ icon: Icon, label, isActive, onClick, badge, image }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all duration-200 group",
      isActive 
        ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] shadow-sm" 
        : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
    )}
  >
    <div className="flex items-center gap-3 min-w-0">
      {image ? (
        <div className={cn(
          "w-6 h-6 rounded-md overflow-hidden border border-border/40 shrink-0 transition-transform duration-300",
          isActive ? "scale-110 shadow-sm" : "group-hover:scale-110"
        )}>
          <img src={image} alt={label} className="w-full h-full object-cover" />
        </div>
      ) : Icon ? (
        <Icon className={cn("w-4 h-4 transition-transform duration-200 opacity-70 group-hover:opacity-100", isActive && "opacity-100 scale-110")} />
      ) : null}
      
      <span className={cn(
        "text-[11px] font-bold transition-opacity duration-200 truncate",
        !isActive && "opacity-70 group-hover:opacity-100"
      )}>
        {label}
      </span>
    </div>
    {badge !== undefined ? (
      <span className="bg-primary/20 text-primary text-[9px] font-black px-2 py-0.5 rounded-full ml-2">
        {badge}
      </span>
    ) : (
      isActive && <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
    )}
  </button>
);

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tokens: number;
  onLogout: () => void;
  companyName?: string;
  logoUrl?: string;
  recentProjects?: any[];
  onOpenProject?: (id: string) => void;
}

export const DashboardSidebar = ({ 
  activeTab, 
  setActiveTab, 
  tokens, 
  onLogout,
  companyName,
  logoUrl,
  recentProjects = [],
  onOpenProject
}: DashboardSidebarProps) => {
  // Filtrar apenas projetos que tenham ao menos uma imagem (sala)
  const validProjects = recentProjects
    .filter(p => p.rooms && p.rooms.length > 0)
    .slice(0, 5);

  return (
    <aside 
      className="w-64 h-screen border-r flex flex-col sticky top-0 overflow-hidden transition-all duration-500 z-30"
      style={{
        background: "hsl(var(--sidebar-background))",
        backdropFilter: "blur(var(--sidebar-blur, 0px))",
        WebkitBackdropFilter: "blur(var(--sidebar-blur, 0px))",
        borderColor: "var(--sidebar-border)",
        color: "hsl(var(--sidebar-foreground))"
      }}
    >
      {/* Brand Area */}
      <div className="p-6 mb-4">
        <div className="flex flex-col gap-4">
          {logoUrl ? (
            <div className="h-10 w-full flex items-center justify-start overflow-hidden">
              <img src={logoUrl} alt={companyName} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <Palette className="text-primary-foreground w-4 h-4" />
              </div>
              <span className="font-black text-sm tracking-tighter">Colora <span className="text-primary italic">Pro</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 space-y-8 overflow-y-auto py-2 scrollbar-none">
        {/* Workspace */}
        <div>
          <p className="px-4 text-[9px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--sidebar-muted-foreground)' }}>
            Workspace
          </p>
          <div className="space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Visão Geral" isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
            <button
              onClick={() => window.location.href = '/simulator'}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-secondary-foreground bg-secondary hover:opacity-90 transition-all duration-200 mt-2 shadow-sm text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simulador</span>
            </button>
          </div>
        </div>

        {/* Gestão */}
        <div>
          <p className="px-4 text-[9px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--sidebar-muted-foreground)' }}>
            Gestão
          </p>
          <div className="space-y-1">
            <SidebarItem icon={Box} label="Catálogos & Cores" isActive={activeTab === "catalogs"} onClick={() => setActiveTab("catalogs")} />
            <SidebarItem icon={Palette} label="Identidade Visual" isActive={activeTab === "branding"} onClick={() => setActiveTab("branding")} />
          </div>
        </div>

        {/* Conta */}
        <div>
          <p className="px-4 text-[9px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--sidebar-muted-foreground)' }}>
            Conta
          </p>
          <div className="space-y-1">
            <SidebarItem icon={CreditCard} label="Tokens & Planos" isActive={activeTab === "profile"} onClick={() => setActiveTab("profile")} badge={tokens} />
            <SidebarItem icon={Settings} label="Configurações" isActive={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          </div>
        </div>

        {/* Footer & Brand Signature */}
        <div className="p-4 border-t space-y-4" style={{ borderColor: 'var(--sidebar-border)' }}>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors duration-200 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>

          <div className="flex flex-col items-center gap-1.5 pt-2 opacity-30 hover:opacity-100 transition-opacity duration-500">
             <span className="text-[8px] font-black uppercase tracking-[0.3em]">Technology by</span>
             <div className="flex items-center gap-1.5">
                <img src="/colora-logo.svg" alt="Colora Logo" className="h-3 w-auto" />
             </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
