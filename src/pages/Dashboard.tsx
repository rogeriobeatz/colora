import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import UnifiedHeader from "@/components/shared/UnifiedHeader";
import MobileMenu from "@/components/MobileMenu";

// Components
import { OverviewTab } from "./Dashboard/components/OverviewTab";
import { CatalogsTab } from "./Dashboard/components/CatalogsTab";
import { BrandingTab } from "./Dashboard/components/BrandingTab";
import { ProfileTab } from "./Dashboard/components/ProfileTab";

// Hooks
import { useDashboardState } from "./Dashboard/hooks/useDashboardState";
import { useTokenManagement } from "./Dashboard/hooks/useTokenManagement";
import { useCatalogManagement } from "./Dashboard/hooks/useCatalogManagement";
import { useAccessibleStyles } from "@/hooks/useAccessibleStyles";

const Dashboard = () => {
  // Hooks principais
  const dashboardState = useDashboardState();
  const tokenManagement = useTokenManagement();
  const catalogManagement = useCatalogManagement();
  const accessibleStyles = useAccessibleStyles();

  // Refs
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Funções de logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de arquivo
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 2MB.");
      return;
    }

    if (!file.type.match(/image\/(png|jpeg|svg\+xml)/)) {
      toast.error("Formato inválido. Use PNG, JPG ou SVG.");
      return;
    }

    // Mostrar guidelines se não tiver logo
    if (!dashboardState.company?.logo) {
      dashboardState.setPendingLogoFile(file);
      dashboardState.setLogoGuidelinesOpen(true);
      return;
    }

    // Upload direto se já tiver logo
    await uploadLogo(file);
  };

  const uploadLogo = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', dashboardState.user?.id || '');

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Falha no upload');

      const data = await response.json();
      dashboardState.updateCompanyLocal({ logo: data.url });
      toast.success("Logo atualizado!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload do logo");
    }
  };

  // Loading state
  if (dashboardState.isInitialLoading || !dashboardState.user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Unificado */}
      <UnifiedHeader
        variant="dashboard"
        onMenuClick={() => dashboardState.setMobileMenuOpen(true)}
        onLogout={dashboardState.handleSignOut}
        tokens={dashboardState.company?.tokens || 0}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="gap-2 rounded-lg">
              <TrendingUp className="w-4 h-4" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="catalogs" className="gap-2 rounded-lg">
              <Layers className="w-4 h-4" /> Catálogos
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2 rounded-lg">
              <Settings className="w-4 h-4" /> Identidade Visual
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 rounded-lg">
              <User className="w-4 h-4" /> Meus Dados
            </TabsTrigger>
          </TabsList>

          {/* ── ABA: VISÃO GERAL ──────────────────────────────────────────── */}
          <TabsContent value="overview" className="animate-fade-in">
            <OverviewTab
              company={dashboardState.company}
              sessions={dashboardState.sessions}
              sessionsLoading={dashboardState.sessionsLoading}
              handleOpenProject={dashboardState.handleOpenProject}
              handleNewProject={dashboardState.handleNewProject}
              handleDeleteSession={dashboardState.handleDeleteSession}
            />
          </TabsContent>

          {/* ── ABA: CATÁLOGOS ──────────────────────────────────────────── */}
          <TabsContent value="catalogs" className="animate-fade-in">
            <CatalogsTab
              company={dashboardState.company}
              selectedCatalogId={catalogManagement.selectedCatalogId}
              setSelectedCatalogId={catalogManagement.setSelectedCatalogId}
              searchTerm={catalogManagement.searchTerm}
              setSearchTerm={catalogManagement.setSearchTerm}
              newCatalogName={catalogManagement.newCatalogName}
              setNewCatalogName={catalogManagement.setNewCatalogName}
              editingCatalogId={catalogManagement.editingCatalogId}
              editingCatalogName={catalogManagement.editingCatalogName}
              paintDialogOpen={catalogManagement.paintDialogOpen}
              editingPaint={catalogManagement.editingPaint}
              isSavingPaint={catalogManagement.isSavingPaint}
              fileInputRef={catalogManagement.fileInputRef}
              activeCatalog={catalogManagement.activeCatalog}
              filteredPaints={catalogManagement.filteredPaints}
              categories={catalogManagement.categories}
              
              // Handlers
              handleAddCatalog={catalogManagement.handleAddCatalog}
              handleDeleteCatalog={catalogManagement.handleDeleteCatalog}
              handleEditCatalog={catalogManagement.handleEditCatalog}
              handleSaveCatalog={catalogManagement.handleSaveCatalog}
              handleImportCSV={catalogManagement.handleImportCSV}
              handleExportCSV={catalogManagement.handleExportCSV}
              handleAddPaint={catalogManagement.handleAddPaint}
              handleEditPaint={catalogManagement.handleEditPaint}
              handleSavePaint={catalogManagement.handleSavePaint}
              handleDeletePaint={catalogManagement.handleDeletePaint}
              setEditingCatalogId={catalogManagement.setEditingCatalogId}
              setEditingCatalogName={catalogManagement.setEditingCatalogName}
              setPaintDialogOpen={catalogManagement.setPaintDialogOpen}
            />
          </TabsContent>

          {/* ── ABA: IDENTIDADE VISUAL ────────────────────────────────────── */}
          <TabsContent value="branding" className="animate-fade-in">
            <BrandingTab
              company={dashboardState.company}
              isSaving={dashboardState.isSaving}
              logoGuidelinesOpen={dashboardState.logoGuidelinesOpen}
              pendingLogoFile={dashboardState.pendingLogoFile}
              logoInputRef={logoInputRef}
              
              // Handlers
              handleSaveBranding={dashboardState.handleSaveBranding}
              handleLogoUpload={handleLogoUpload}
              updateCompanyLocal={dashboardState.updateCompanyLocal}
              setLogoGuidelinesOpen={dashboardState.setLogoGuidelinesOpen}
              setPendingLogoFile={dashboardState.setPendingLogoFile}
              uploadLogo={uploadLogo}
            />
          </TabsContent>

          {/* ── ABA: MEUS DADOS ────────────────────────────────────── */}
          <TabsContent value="profile" className="animate-fade-in">
            <ProfileTab
              user={dashboardState.user}
              company={dashboardState.company}
              displayData={dashboardState.displayData}
              tokenHistory={tokenManagement.tokenHistory}
              tokenHistoryLoading={tokenManagement.tokenHistoryLoading}
              isCheckoutLoading={tokenManagement.isCheckoutLoading}
              
              // Estados de perfil
              isEditingProfile={dashboardState.isEditingProfile}
              profileData={dashboardState.profileData}
              isSavingProfile={dashboardState.isSavingProfile}
              
              // Token management
              getTokenStatus={tokenManagement.getTokenStatus}
              formatTokenAmount={tokenManagement.formatTokenAmount}
              handleCheckout={tokenManagement.handleCheckout}
              handleManageSubscription={tokenManagement.handleManageSubscription}
              checkSubscription={dashboardState.checkSubscription}
              refreshData={dashboardState.refreshData}
              
              // Handlers de perfil
              handleEditProfile={dashboardState.handleEditProfile}
              handleSaveProfile={dashboardState.handleSaveProfile}
              handleCancelEditProfile={dashboardState.handleCancelEditProfile}
              setProfileData={dashboardState.setProfileData}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        open={dashboardState.mobileMenuOpen}
        onOpenChange={dashboardState.setMobileMenuOpen}
        onLogout={dashboardState.handleSignOut}
      />
    </div>
  );
};

// Import needed icons
import { TrendingUp, Layers, Settings, User } from "lucide-react";

export default Dashboard;
