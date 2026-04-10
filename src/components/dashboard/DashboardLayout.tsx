import React, { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { cn } from "@/lib/utils";
import { useStore } from "@/contexts/StoreContext";
import { Menu, X, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TokenBadge } from "@/components/ui/token-badge";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tokens: number;
  onLogout: () => void;
  companyName?: string;
  logoUrl?: string;
  headerTitle: string;
  recentProjects?: any[];
  onOpenProject?: (id: string) => void;
}

export const DashboardLayout = ({
  children,
  activeTab,
  setActiveTab,
  tokens,
  onLogout,
  companyName,
  logoUrl,
  headerTitle,
  recentProjects,
  onOpenProject
}: DashboardLayoutProps) => {
  const { company } = useStore();
  const headerStyle = company?.headerStyle || "glass";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const SidebarContent = () => (
    <DashboardSidebar 
      activeTab={activeTab} 
      setActiveTab={(tab) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
      }} 
      tokens={tokens} 
      onLogout={onLogout}
      companyName={companyName}
      logoUrl={logoUrl}
      recentProjects={recentProjects}
      onOpenProject={onOpenProject}
    />
  );

  return (
    <div className="flex min-h-screen bg-[#fafafa] transition-colors duration-500 font-sans">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block shrink-0 border-r">
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Sutil */}
        <div className="z-20 transition-all duration-500 ease-in-out" style={{ padding: "var(--header-float, 0px)" }}>
          <header 
            className="h-16 flex items-center justify-between px-4 lg:px-8 transition-all duration-500 ease-in-out"
            style={{ 
              background: "var(--header-bg)",
              backdropFilter: "blur(var(--header-blur, 0px))",
              WebkitBackdropFilter: "blur(var(--header-blur, 0px))",
              border: "var(--header-border)",
              borderRadius: "var(--header-radius, 0px)",
              boxShadow: "var(--header-shadow, none)",
              color: "var(--header-fg, inherit)"
            }}
          >
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Mobile Menu Trigger */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 border-none">
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4 min-w-0">
                <h1 className="text-xs lg:text-sm font-bold tracking-tight uppercase tracking-widest truncate">{headerTitle}</h1>
                <div className="hidden lg:block h-4 w-px bg-current opacity-20" />
                <span className="text-[9px] lg:text-[10px] font-medium uppercase tracking-widest opacity-70 truncate">{companyName || "Colora"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 lg:gap-6">
              {/* Tokens Minimalist - Standardized with Simulator */}
              <TokenBadge tokens={tokens} />
            </div>
          </header>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
          <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
