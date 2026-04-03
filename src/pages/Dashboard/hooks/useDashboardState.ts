import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck"; // ✅ NOVO: Hook otimizado
import { listSimulatorSessions, deleteSimulatorSession, checkSyncStatus, forceSyncFromSupabase, analyzeSupabaseTables } from "@/lib/simulator-db";
import { ProjectListItem } from "@/components/simulator/ProjectDrawer";

export const useDashboardState = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const debouncedCheckSubscription = useSubscriptionCheck(); // ✅ NOVO: Usa hook otimizado
  const { company, updateCompany, updateCompanyLocal, addCatalog, updateCatalog, deleteCatalog, importPaintsCSV, exportPaintsCSV, refreshData, depositMonthlyTokens } = useStore();

  // Estados principais
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessions, setSessions] = useState<ProjectListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Estados de UI
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Estados de catálogos
  const [newCatalogName, setNewCatalogName] = useState("");
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [editingCatalogName, setEditingCatalogName] = useState("");

  // Estados de perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    documentType: "cpf",
    documentNumber: "",
    companyName: "",
    website: "",
    address: ""
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Estados de cores
  const [paintDialogOpen, setPaintDialogOpen] = useState(false);
  const [editingPaint, setEditingPaint] = useState<any>(null);
  const [isSavingPaint, setIsSavingPaint] = useState(false);

  // Estados de logo
  const [logoGuidelinesOpen, setLogoGuidelinesOpen] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);

  // Estados de tokens
  const [tokenHistory, setTokenHistory] = useState<any[]>([]);
  const [tokenHistoryLoading, setTokenHistoryLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Dados do usuário
  const userData = user?.user_metadata || {};
  const displayData = {
    name: company?.name || userData?.full_name || userData?.name || "Não informado",
    email: user?.email || "Não informado",
    phone: company?.phone || userData?.phone || "Não informado",
    documentType: userData?.document_type || "cpf",
    documentNumber: userData?.document_number || userData?.document || "Não informado",
    companyName: company?.name || userData?.company || "Não informado",
    website: company?.website || "Não informado",
    address: company?.address || userData?.company || "Não informado"
  };

  // Auto-login from Stripe recovery link
  useEffect(() => {
    const handleAutoLogin = async () => {
      const token = searchParams.get("token");
      const type = searchParams.get("type");

      if (token && type === "recovery") {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          if (!user && authLoading === false) {
            navigate("/login", { replace: true });
          }
        } catch (error) {
          console.error("Auto-login error:", error);
          navigate("/login", { replace: true });
        }
      }
    };

    if (authLoading === false) {
      handleAutoLogin();
    }
  }, [searchParams, authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  // Handle payment success/cancel from Stripe redirect
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    
    if (paymentStatus === "success" && sessionId) {
      toast.success("Pagamento processado com sucesso!", {
        description: "Seus tokens já foram creditados."
      });
      
      // Limpar URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("payment");
      newParams.delete("session_id");
      navigate({ search: newParams.toString() }, { replace: true });
      
      // Atualizar dados
      refreshData();
    } else if (paymentStatus === "cancel") {
      toast.info("Pagamento cancelado", {
        description: "Você pode tentar novamente quando quiser."
      });
      
      // Limpar URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("payment");
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate, refreshData]);

  // Carregar sessões
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setSessionsLoading(true);
        const list = await listSimulatorSessions();
        
        const mappedSessions = list.map(session => ({
          id: session.id || `session-${Math.random()}`,
          name: session.name || `Projeto ${new Date(session.createdAt || Date.now()).toLocaleDateString('pt-BR')}`,
          createdAt: session.createdAt || new Date().toISOString(),
          updatedAt: session.updatedAt || session.createdAt || new Date().toISOString(),
          rooms: (session.data as any)?.rooms || [] // ✅ ADICIONADO: Extrair rooms do campo data
        }));

        setSessions(mappedSessions);
      } catch (error) {
        console.error("Erro ao carregar sessões:", error);
        toast.error("Erro ao carregar projetos");
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    if (user) {
      loadSessions();
    }
  }, [user]);

  // Verificar status de assinatura e depositar tokens mensais
  useEffect(() => {
    const checkAndDepositTokens = async () => {
      if (!user || !company) return;

      try {
        const subscriptionStatus = await debouncedCheckSubscription();
        console.log("[Dashboard] Status da assinatura:", subscriptionStatus);

        if (subscriptionStatus && subscriptionStatus.subscriptionStatus === 'active') {
          await depositMonthlyTokens();
          await refreshData();
        }
      } catch (error) {
        console.error("Erro ao verificar assinatura:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (user && company) {
      checkAndDepositTokens();
    } else {
      setIsInitialLoading(false);
    }
  }, [user, company, debouncedCheckSubscription, depositMonthlyTokens, refreshData]);

  // Handlers
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sessão encerrada com sucesso!");
      navigate("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
      toast.error("Erro ao encerrar sessão");
    }
  };

  const handleOpenProject = (id: string) => {
    localStorage.setItem("colora_pending_session", id);
    navigate("/simulator");
  };

  const handleNewProject = () => {
    localStorage.setItem("colora_new_project", "true");
    navigate("/simulator");
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSimulatorSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Projeto excluído!");
  };

  // Handlers de perfil
  const handleEditProfile = () => {
    setProfileData({
      fullName: userData?.full_name || userData?.name || "",
      email: user?.email || "",
      phone: company?.phone || userData?.phone || "",
      documentType: userData?.document_type || "cpf",
      documentNumber: userData?.document_number || userData?.document || "",
      companyName: company?.name || userData?.company || "",
      website: company?.website || "",
      address: company?.address || userData?.company || ""
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);

      // Atualizar metadata do usuário
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.fullName,
          phone: profileData.phone,
          document_type: profileData.documentType,
          document_number: profileData.documentNumber,
          company: profileData.companyName
        }
      });

      if (userError) throw userError;

      // Atualizar dados da empresa
      await updateCompany({
        name: profileData.companyName,
        phone: profileData.phone,
        website: profileData.website,
        address: profileData.address
      });

      await refreshData();
      setIsEditingProfile(false);
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar dados. Tente novamente.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!company) return;

    try {
      setIsSaving(true);
      await updateCompany(company);
      toast.success("Identidade visual atualizada!");
    } catch (error) {
      console.error("Erro ao salvar identidade:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setProfileData({
      fullName: "",
      email: "",
      phone: "",
      documentType: "cpf",
      documentNumber: "",
      companyName: "",
      website: "",
      address: ""
    });
  };

  return {
    // Estado
    user,
    company,
    isInitialLoading,
    mobileMenuOpen,
    setMobileMenuOpen,
    sessions,
    sessionsLoading,
    selectedCatalogId,
    setSelectedCatalogId,
    searchTerm,
    setSearchTerm,
    isSaving,
    newCatalogName,
    setNewCatalogName,
    editingCatalogId,
    setEditingCatalogId,
    editingCatalogName,
    setEditingCatalogName,
    paintDialogOpen,
    setPaintDialogOpen,
    editingPaint,
    setEditingPaint,
    isSavingPaint,
    logoGuidelinesOpen,
    setLogoGuidelinesOpen,
    pendingLogoFile,
    setPendingLogoFile,
    tokenHistory,
    setTokenHistory,
    tokenHistoryLoading,
    isCheckoutLoading,
    setIsCheckoutLoading,
    displayData,
    updateCompanyLocal,
    debouncedCheckSubscription, // ✅ CORRIGIDO: Exportar a função correta
    refreshData,
    
    // Estados de perfil
    isEditingProfile,
    setIsEditingProfile,
    profileData,
    setProfileData,
    isSavingProfile,
    setIsSavingProfile,

    // Handlers
    handleSignOut,
    handleOpenProject,
    handleNewProject,
    handleDeleteSession,
    handleEditProfile,
    handleSaveProfile,
    handleCancelEditProfile,
    handleSaveBranding
  };
};
