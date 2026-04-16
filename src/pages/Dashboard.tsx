import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import MobileMenu from "@/components/MobileMenu";

// Dashboard Layout Components
import DashboardLayout from "@/components/dashboard/DashboardLayout";

// Components
import { OverviewTab } from "./Dashboard/components/OverviewTab";
import { CatalogsTab } from "./Dashboard/components/CatalogsTab";
import { BrandingTab } from "./Dashboard/components/BrandingTab";
import { ProfileTab } from "./Dashboard/components/ProfileTab";
import { SettingsTab } from "./Dashboard/components/SettingsTab";

// Hooks
import { useDashboardState } from "./Dashboard/hooks/useDashboardState";
import { useTokenManagement } from "./Dashboard/hooks/useTokenManagement";
import { useCatalogManagement } from "./Dashboard/hooks/useCatalogManagement";
import { useAccessibleStyles } from "@/hooks/useAccessibleStyles";
import { ColoraSpinner } from "@/components/ui/colora-spinner";
import { TrialBanner } from "@/components/ui/trial-banner";

const Dashboard = () => {
  // Hooks principais
  const dashboardState = useDashboardState();
  const tokenManagement = useTokenManagement();
  const catalogManagement = useCatalogManagement();
  const accessibleStyles = useAccessibleStyles();
  const navigate = useNavigate();

  // Estado para aba ativa (substituindo o Tabs do Radix por controle via Sidebar)
  const [activeTab, setActiveTab] = useState("overview");

  // Refs
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Mapeamento de títulos para o Header
  const tabTitles: Record<string, string> = {
    overview: "Visão Geral",
    catalogs: "Catálogos & Tintas",
    branding: "Identidade Visual",
    profile: "Tokens & Faturamento",
    settings: "Configurações da Conta"
  };

  // Modificar handleOpenProject para navegar para o simulador
  const handleOpenProject = (sessionId: string) => {
    navigate(`/simulator?session=${sessionId}`);
  };

  const handleSaveSettings = async () => {
    try {
      await dashboardState.handleSaveBranding();
      toast.success("Configurações atualizadas!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

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
      const userId = dashboardState.user?.id;
      if (!userId) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `logos/${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      dashboardState.updateCompanyLocal({ logo: publicUrl });
      toast.success("Logo carregado com sucesso!");
      
      // Salva automaticamente após o upload do arquivo
      await dashboardState.handleSaveBranding();
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload do logo", { description: error.message });
    }
  };

  // Loading state
  if (dashboardState.isInitialLoading || !dashboardState.user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ColoraSpinner size="lg" />
      </div>
    );
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tokens={dashboardState.company?.tokens ?? 0}
      onLogout={dashboardState.handleSignOut}
      companyName={dashboardState.company?.name}
      logoUrl={dashboardState.company?.logo}
      headerTitle={tabTitles[activeTab] || "Dashboard"}
      recentProjects={dashboardState.sessions}
      onOpenProject={dashboardState.handleOpenProject}
    >

      {/* Trial Banner */}
      <TrialBanner variant="dashboard" className="mb-6" />

      {/* ── CONTEÚDO DINÂMICO BASEADO NA ABA ATIVA ────────────────────────── */}
      
      {activeTab === "overview" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <OverviewTab
            company={dashboardState.company}
            sessions={dashboardState.sessions}
            sessionsLoading={dashboardState.sessionsLoading}
            handleOpenProject={handleOpenProject}
            handleNewProject={dashboardState.handleNewProject}
            handleDeleteSession={dashboardState.handleDeleteSession}
          />
        </div>
      )}

      {activeTab === "catalogs" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            handleToggleCatalog={catalogManagement.handleToggleCatalog}
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
        </div>
      )}

      {activeTab === "branding" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        </div>
      )}

      {activeTab === "profile" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            checkSubscription={dashboardState.debouncedCheckSubscription}
            refreshData={dashboardState.refreshData}
            
            // Handlers de perfil
              handleEditProfile={dashboardState.handleEditProfile}
              handleSaveProfile={dashboardState.handleSaveProfile}
              handleCancelEditProfile={dashboardState.handleCancelEditProfile}
              setProfileData={dashboardState.setProfileData}
          />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SettingsTab
            company={dashboardState.company}
            user={dashboardState.user}
            updateCompanyLocal={dashboardState.updateCompanyLocal}
            handleSaveSettings={handleSaveSettings}
            isSaving={dashboardState.isSaving}
          />
        </div>
      )}

      {/* Mobile Menu Support */}
      <MobileMenu 
        isOpen={dashboardState.mobileMenuOpen}
        onClose={() => dashboardState.setMobileMenuOpen(false)}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
