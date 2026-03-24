import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Palette, Plus, Eye, EyeOff, Search, LogOut, Loader2, Settings,
  FileUp, FileDown, Trash2, Image as ImageIcon,
  Check, Upload, Pencil, X, FolderOpen, Clock, Play, Link as LinkIcon,
  TrendingUp, Layers, Sparkles, ExternalLink, Copy, Globe, Phone, MapPin, Coins, CreditCard, RefreshCw,
  User, FileText, Building2, Menu, Database, RefreshCw as Sync } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PaintDialog from "@/components/simulator/PaintDialog";
import { Paint, HeaderContentMode, HeaderStyleMode, FontSet } from "@/data/defaultColors";
import { ProjectListItem } from "@/components/simulator/ProjectDrawer";
import { useAccessibleStyles } from "@/hooks/useAccessibleStyles";
import MobileMenu from "@/components/MobileMenu";
import { useMobile, useOrientation } from "@/hooks/useMobile";
import { listSimulatorSessions, deleteSimulatorSession, checkSyncStatus, forceSyncFromSupabase, analyzeSupabaseTables } from "@/lib/simulator-db";
import UnifiedHeader from "@/components/shared/UnifiedHeader";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

// Função para calcular contraste entre duas cores
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Função para determinar se a cor é clara ou escura
function isLightColor(hexColor: string): boolean {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 186;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function hexToCmyk(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return "0, 0, 0, 100";
  const c = Math.round((1 - r - k) / (1 - k) * 100);
  const m = Math.round((1 - g - k) / (1 - k) * 100);
  const y = Math.round((1 - b - k) / (1 - k) * 100);
  return `${c}, ${m}, ${y}, ${Math.round(k * 100)}`;
}

// ─── component ───────────────────────────────────────────────────────────────

const Dashboard = () => {
  // Hooks principais - sempre no topo e em ordem consistente
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signOut, checkSubscription } = useAuth();
  const {
    company, updateCompany, updateCompanyLocal, addCatalog, updateCatalog, deleteCatalog,
    importPaintsCSV, exportPaintsCSV, refreshData,
    consumeToken, checkTokensAvailable, depositMonthlyTokens
  } = useStore();

  // Hook de estilos acessíveis - sempre depois dos hooks principais
  const accessibleStyles = useAccessibleStyles();

  // Hooks para detectar dispositivos móveis
  const { isMobile, isTablet, isDesktop, isSmallMobile } = useMobile();
  const orientation = useOrientation();

  // Estado para menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estado para diagnóstico
  const [syncStatus, setSyncStatus] = useState<{local: number;remote: number;} | null>(null);
  const [checkingSync, setCheckingSync] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Estados em ordem consistente
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCatalogName, setNewCatalogName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sessions, setSessions] = useState<ProjectListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [paintDialogOpen, setPaintDialogOpen] = useState(false);
  const [editingPaint, setEditingPaint] = useState<Paint | null>(null);
  const [isSavingPaint, setIsSavingPaint] = useState(false);
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [editingCatalogName, setEditingCatalogName] = useState("");
  const [logoGuidelinesOpen, setLogoGuidelinesOpen] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [tokenHistory, setTokenHistory] = useState<any[]>([]);
  const [tokenHistoryLoading, setTokenHistoryLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const [passwordSetupOpen, setPasswordSetupOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [skipPasswordSetup, setSkipPasswordSetup] = useState(false);

  // Obter dados do usuário do metadata como fallback
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

  // Estilos dinâmicos baseados nas cores da empresa
  const companyStyles = {
    primaryColor: company?.primaryColor || '#1a8a6a',
    secondaryColor: company?.secondaryColor || '#e87040',

    // Função para determinar se uma cor é clara ou escura
    isColorLight: (color: string) => {
      // Converter hex para RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      // Calcular luminosidade (fórmula W3C)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Retornar true se for clara (> 0.5)
      return luminance > 0.5;
    },

    getButtonStyle: (isPrimary = true, backgroundColor?: string) => {
      const color = backgroundColor || (isPrimary ? company?.primaryColor : company?.secondaryColor);
      const isLight = companyStyles.isColorLight(color);

      return {
        backgroundColor: color,
        color: isLight ? '#000000' : '#FFFFFF', // Preto se fundo claro, branco se fundo escuro
        border: 'none'
      };
    },
    getAccentStyle: () => ({
      backgroundColor: `${company?.secondaryColor}10`,
      borderColor: `${company?.secondaryColor}30`,
      color: company?.secondaryColor
    })
  };

  // Funções auxiliares para tokens
  const getTokenStatus = () => {
    if (!company) return { status: 'loading', color: 'gray', text: 'Carregando...' };

    if (company.tokens <= 0) {
      return { status: 'empty', color: 'red', text: 'Sem tokens' };
    }

    if (company.tokensExpiresAt) {
      const expiryDate = new Date(company.tokensExpiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 7) {
        return { status: 'expiring', color: 'orange', text: `Expira em ${daysLeft} dias` };
      }
    }

    return { status: 'available', color: 'green', text: 'Disponíveis' };
  };

  const formatTokenAmount = (amount: number) => {
    return amount.toLocaleString('pt-BR');
  };

  // Handle auto-login from Stripe recovery link
  useEffect(() => {
    const handleAutoLogin = async () => {
      const token = searchParams.get("token");
      const type = searchParams.get("type");

      if (token && type === "recovery") {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
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

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setSessionsLoading(true);
        const list = await listSimulatorSessions();
        console.log("[Dashboard] Projetos carregados:", list); // Debug

        // Melhorar o mapeamento com fallbacks robustos
        const mappedSessions = list.map(session => ({
          id: session.id || `session-${Math.random()}`,
          name: session.name || `Projeto ${new Date(session.createdAt || Date.now()).toLocaleDateString('pt-BR')}`,
          createdAt: session.createdAt || new Date().toISOString(),
          updatedAt: session.updatedAt || session.createdAt || new Date().toISOString()
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

  // Carregar histórico de tokens
  useEffect(() => {
    const loadTokenHistory = async () => {
      try {
        setTokenHistoryLoading(true);
        const { data, error } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setTokenHistory(data || []);
      } catch (error) {
        console.error("Erro ao carregar histórico de tokens:", error);
      } finally {
        setTokenHistoryLoading(false);
      }
    };

    if (user) {
      loadTokenHistory();
    }
  }, [user]);

  // Verificar status de assinatura e depositar tokens mensais
  useEffect(() => {
    const checkAndDepositTokens = async () => {
      if (!user || !company) return;

      try {
        const subscriptionStatus = await checkSubscription();
        console.log("[Dashboard] Status da assinatura:", subscriptionStatus);

        // Se tiver assinatura ativa, verificar se precisa depositar tokens mensais
        if (subscriptionStatus === 'active') {
          const deposited = await depositMonthlyTokens();
          if (deposited) {
            toast.success("Tokens mensais depositados!", {
              description: "200 tokens foram adicionados à sua conta."
            });
            await refreshData();
          }
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
  }, [user, company, checkSubscription, depositMonthlyTokens, refreshData]);

  // ─── handlers ───────────────────────────────────────────────────────────────

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
    if (!company?.logo) {
      setPendingLogoFile(file);
      setLogoGuidelinesOpen(true);
      return;
    }

    // Upload direto se já tiver logo
    await uploadLogo(file);
  };

  const uploadLogo = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id || '');

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Falha no upload');

      const data = await response.json();
      updateCompanyLocal({ logo: data.url });
      toast.success("Logo atualizado!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload do logo");
    }
  };

  const handleAddCatalog = async () => {
    if (!newCatalogName.trim()) {
      toast.error("Digite um nome para o catálogo");
      return;
    }

    try {
      await addCatalog({
        name: newCatalogName.trim(),
        active: true,
        paints: []
      });
      setNewCatalogName("");
      toast.success("Catálogo adicionado!");
    } catch (error) {
      console.error("Erro ao adicionar catálogo:", error);
      toast.error("Erro ao adicionar catálogo");
    }
  };

  const handleDeleteCatalog = async (catalogId: string) => {
    if (!company) return;

    const catalog = company.catalogs.find(c => c.id === catalogId);
    if (!catalog) return;

    if (catalog.paints.length > 0) {
      toast.error("Não é possível excluir um catálogo com cores. Exclua as cores primeiro.");
      return;
    }

    try {
      await deleteCatalog(catalogId);
      toast.success("Catálogo excluído!");
    } catch (error) {
      console.error("Erro ao excluir catálogo:", error);
      toast.error("Erro ao excluir catálogo");
    }
  };

  const handleEditCatalog = (catalogId: string) => {
    const catalog = company?.catalogs.find(c => c.id === catalogId);
    if (!catalog) return;

    setEditingCatalogId(catalogId);
    setEditingCatalogName(catalog.name || "");
  };

  const handleSaveCatalog = async () => {
    if (!editingCatalogId || !editingCatalogName.trim()) return;

    try {
      await updateCatalog(editingCatalogId, {
        name: editingCatalogName.trim()
      });
      setEditingCatalogId(null);
      setEditingCatalogName("");
      toast.success("Catálogo atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar catálogo:", error);
      toast.error("Erro ao atualizar catálogo");
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importPaintsCSV(file, selectedCatalogId || company.catalogs[0]?.id);
      toast.success("Cores importadas com sucesso!");
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao importar cores");
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportPaintsCSV(selectedCatalogId || company.catalogs[0]?.id);
      toast.success("Cores exportadas!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar cores");
    }
  };

  const handleAddPaint = () => {
    setEditingPaint(null);
    setPaintDialogOpen(true);
  };

  const handleEditPaint = (paint: Paint) => {
    setEditingPaint(paint);
    setPaintDialogOpen(true);
  };

  const handleSavePaint = async (paint: Partial<Paint>) => {
    if (!company) return;

    const catalogId = selectedCatalogId || company.catalogs[0]?.id;
    if (!catalogId) return;

    try {
      setIsSavingPaint(true);

      if (editingPaint) {
        // Atualizar tinta existente
        updateCompany({
          catalogs: company.catalogs.map((cat) =>
            cat.id === catalogId
              ? {
                  ...cat,
                  paints: cat.paints.map((p) =>
                    p.id === editingPaint.id ? { ...p, ...paint } : p
                  )
                }
              : cat
          )
        });

        // Atualizar no banco de dados
        const { error } = await supabase
          .from('paints')
          .update({
            name: paint.name,
            code: paint.code,
            hex: paint.hex,
            rgb: paint.rgb,
            cmyk: paint.cmyk,
            category: paint.category
          })
          .eq('id', editingPaint.id);

        if (error) {
          console.error("Erro ao atualizar tinta:", error);
        }
      } else {
        // Adicionar nova tinta
        const newPaint = {
          id: Math.random().toString(36).substring(2, 10),
          name: paint.name!,
          code: paint.code!,
          hex: paint.hex!,
          rgb: paint.rgb!,
          cmyk: paint.cmyk!,
          category: paint.category!
        };

        // Atualizar estado local
        updateCompany({
          catalogs: company.catalogs.map((cat) =>
            cat.id === catalogId
              ? { ...cat, paints: [...cat.paints, newPaint] }
              : cat
          )
        });

        // Inserir nova tinta
        const { error } = await supabase.
        from('paints').
        insert({
          catalog_id: catalogId,
          name: newPaint.name,
          code: newPaint.code,
          hex: newPaint.hex,
          rgb: newPaint.rgb,
          cmyk: newPaint.cmyk,
          category: newPaint.category
        });

        if (error) {
          console.error("Erro ao salvar tinta:", error);
        }
      }
    } catch (error) {
      console.error("Erro na operação de tinta:", error);
    }

    setIsSavingPaint(false);
    setPaintDialogOpen(false);
    toast.success(editingPaint ? "Cor atualizada!" : "Cor adicionada!");
  };

  const handleDeletePaint = async (paintId: string) => {
    const catalogId = selectedCatalogId || company.catalogs[0]?.id;
    if (!catalogId || !company) return;

    // Atualiza estado local
    updateCompany({
      catalogs: company.catalogs.map((cat) =>
      cat.id === catalogId ? { ...cat, paints: cat.paints.filter((p) => p.id !== paintId) } : cat
      )
    });

    // Remove do banco de dados
    try {
      const { error } = await supabase.
      from('paints').
      delete().
      eq('id', paintId);

      if (error) {
        console.error("Erro ao excluir tinta:", error);
      }
    } catch (error) {
      console.error("Erro na exclusão de tinta:", error);
    }

    toast.success("Cor excluída!");
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

  // Funções de diagnóstico
  const handleCheckSync = async () => {
    setCheckingSync(true);
    try {
      const status = await checkSyncStatus();
      setSyncStatus(status);

      if (status.local === status.remote) {
        toast.success("✅ Sincronização perfeita!", {
          description: `Local: ${status.local} | Remoto: ${status.remote}`
        });
      } else {
        toast.warning("⚠️ Dados dessincronizados!", {
          description: `Local: ${status.local} | Remoto: ${status.remote}`
        });
      }
    } catch (error) {
      toast.error("Erro ao verificar sincronização");
    } finally {
      setCheckingSync(false);
    }
  };

  const handleForceSync = async () => {
    try {
      await forceSyncFromSupabase();
    } catch (error) {
      toast.error("Erro ao forçar sincronização");
    }
  };

  const handleAnalyzeDatabase = async () => {
    try {
      const result = await analyzeSupabaseTables();

      if (result) {
        toast.success("✅ Análise concluída! Verifique o console.", {
          description: `Profiles: ${result.profiles} | Sessions: ${result.sessions}`
        });
      } else {
        toast.error("Erro na análise do banco");
      }
    } catch (error) {
      toast.error("Erro ao analisar banco de dados");
    }
  };

  // ─── derived ───────────────────────────────────────────────────────────────

  const activeCatalog =
  company.catalogs.find((c) => c.id === (selectedCatalogId || company.catalogs[0]?.id)) ||
  company.catalogs[0];

  const filteredPaints = activeCatalog?.paints.filter(
    (p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const categories = activeCatalog ? [...new Set(activeCatalog.paints.map((p) => p.category))] : [];
  const totalPaints = company.catalogs.reduce((s, c) => s + c.paints.length, 0);
  const activeCatalogs = company.catalogs.filter((c) => c.active).length;

  const headerStyle = company.headerStyle || "glass";
  const isGradientHeader = headerStyle === "gradient";
  const isCardHeader = headerStyle === "card";
  const isPrimaryHeader = headerStyle === "primary";
  const isColoredHeader = isGradientHeader || isPrimaryHeader;

  const getButtonStyle = (isPrimary = true) => {
    if (isColoredHeader) {
      return accessibleStyles.primary.primaryButton;
    }
    return companyStyles.getButtonStyle(isPrimary);
  };

  const getHeaderTextColor = () => {
    if (isColoredHeader) {
      return accessibleStyles.primary.primaryText.color;
    }
    return undefined;
  };

  const handleCheckout = async (mode: "subscription" | "recharge") => {
    setIsCheckoutLoading(true);
    try {
      // 🔍 DEBUG: Log dos dados sendo enviados
      console.log('[CHECKOUT] Iniciando checkout:', {
        mode,
        user: user?.email,
        company: company?.name
      });

      // ✅ Enviar dados completos do cliente
      const customerData = {
        email: user?.email,
        name: company?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0],
        company: company?.name,
        phone: company?.phone,
        document: '', // Pode ser preenchido depois
        documentType: 'cpf'
      };

      console.log('[CHECKOUT] Dados do cliente:', customerData);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          mode,
          customerData
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast.error("Erro ao abrir portal. Verifique se possui uma assinatura ativa.");
    }
  };

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header Unificado */}
      <UnifiedHeader
        variant="dashboard"
        onMenuClick={() => setMobileMenuOpen(true)}
        onLogout={handleSignOut}
        tokens={company?.tokens || 0}
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
          <TabsContent value="overview" className="animate-fade-in space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
              {
                label: "Tokens",
                value: formatTokenAmount(company.tokens),
                icon: Coins,
                color: getTokenStatus().color,
                sub: getTokenStatus().text
              },
              {
                label: "Projetos Salvos",
                value: sessionsLoading ? "..." : sessions.length,
                icon: FolderOpen,
                color: accessibleStyles.primary.primaryIcon.color,
                sub: "no seu dispositivo"
              },
              {
                label: "Catálogos Ativos",
                value: activeCatalogs,
                icon: Layers,
                color: accessibleStyles.secondary.secondaryIcon.color,
                sub: `de ${company.catalogs.length} total`
              },
              {
                label: "Total de Cores",
                value: totalPaints,
                icon: Palette,
                color: "#6366f1",
                sub: "em todos os catálogos"
              }
              ].map(({ label, value, icon: Icon, color, sub }) =>
              <div key={label} className="bg-card rounded-2xl border border-border p-5 shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
                </div>
              )}
            </div>

            {/* Botão Principal - Acesso Rápido ao Simulador */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-border p-6 shadow-soft">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5" /> Ferramenta Principal
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Acesse o simulador de pinturas para criar projetos incríveis
                  </p>
                </div>
                <Button
                  size="lg"
                  asChild
                  className="gap-2 h-12 px-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  style={accessibleStyles.elements.actionButton}>
                  
                  <Link to="/simulator" className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Abrir Simulador
                  </Link>
                </Button>
              </div>
            </div>

            {/* Seção de Tokens */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-border p-6 shadow-soft space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                  <Coins className="w-5 h-5" /> Meus Tokens
                </h3>
                <Badge
                  variant={company?.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                  style={company?.subscriptionStatus === 'active' ? accessibleStyles.primary.primaryBadge : accessibleStyles.elements.inactiveStatus}>
                  
                  {company?.subscriptionStatus === 'active' ? 'Assinatura Ativa' : 'Assinatura Inativa'}
                </Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <div className="text-2xl font-bold text-foreground">
                    {formatTokenAmount(company.tokens)}
                  </div>
                  <div className="text-sm text-muted-foreground">Tokens Disponíveis</div>
                </div>
                
                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <div className="text-2xl font-bold text-foreground">
                    {company.tokensExpiresAt ?
                    new Date(company.tokensExpiresAt).toLocaleDateString('pt-BR') :
                    'Sem validade'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Validade</div>
                </div>

                <div className="text-center p-4 bg-background/50 rounded-xl">
                  <div className="text-2xl font-bold text-foreground">
                    {company.lastTokenDeposit ?
                    new Date(company.lastTokenDeposit).toLocaleDateString('pt-BR') :
                    'N/A'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Último Depósito</div>
                </div>
              </div>

              {/* Ações de pagamento */}
              <div className="flex flex-wrap gap-3">
                {company?.subscriptionStatus !== 'active' ?
                <Button
                  onClick={() => handleCheckout("subscription")}
                  disabled={isCheckoutLoading}
                  className="gap-2"
                  style={accessibleStyles.elements.actionButton}>
                  
                    {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Assinar por R$ 59,90/mês
                  </Button> :

                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  className="gap-2"
                  style={accessibleStyles.elements.secondaryActionButton}>
                  
                    <Settings className="w-4 h-4" /> Gerenciar Assinatura
                  </Button>
                }

                <Button
                  variant="outline"
                  onClick={() => handleCheckout("recharge")}
                  disabled={isCheckoutLoading}
                  className="gap-2"
                  style={accessibleStyles.elements.secondaryActionButton}>
                  
                  {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                  Recarregar 100 tokens — R$ 29,90
                </Button>
              </div>
            </div>

            {/* Sessões recentes */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" /> Projetos Recentes
                </h3>
                <Button size="sm" variant="outline" onClick={handleNewProject} className="gap-1.5" style={companyStyles.getAccentStyle()}>
                    <Plus className="w-3.5 h-3.5" /> Novo
                  </Button>
              </div>

              {sessionsLoading ?
              <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div> :
              sessions.length === 0 ?
              <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
                  <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum projeto salvo ainda</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Inicie uma simulação e ela será salva automaticamente</p>
                </div> :

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {sessions.map((s) =>
                <div
                  key={s.id}
                  className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all">
                  
                    <button className="flex-1 text-left min-w-0" onClick={() => handleOpenProject(s.id)}>
                      <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(s.updatedAt)}</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenProject(s.id)} title="Abrir" style={accessibleStyles.primary.primaryIcon}>
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteSession(s.id)} title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
              )}
                </div>
              }
            </div>
          </TabsContent>

          {/* ── ABA: CATÁLOGOS ──────────────────────────────────────────── */}
          <TabsContent value="catalogs" className="animate-fade-in space-y-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Catálogos */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold text-foreground mb-1">Catálogos de Cores</h2>
                  <Button onClick={handleAddCatalog} className="gap-2" style={accessibleStyles.elements.actionButton}>
                    <Plus className="w-4 h-4" /> Novo Catálogo
                  </Button>
                </div>

                {/* Lista de catálogos */}
                <div className="space-y-3">
                  {company.catalogs.map((catalog) => (
                    <div
                      key={catalog.id}
                      className={`bg-card rounded-xl border p-4 transition-all ${
                        selectedCatalogId === catalog.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingCatalogId === catalog.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingCatalogName}
                                onChange={(e) => setEditingCatalogName(e.target.value)}
                                className="h-8"
                                placeholder="Nome do catálogo"
                              />
                              <Button size="sm" onClick={handleSaveCatalog}>
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingCatalogId(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setSelectedCatalogId(catalog.id)}
                                className="text-left flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground">{catalog.name}</h3>
                                  <Badge variant={catalog.active ? "default" : "secondary"}>
                                    {catalog.active ? "Ativo" : "Inativo"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {catalog.paints.length} cores
                                </p>
                              </button>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" onClick={() => handleEditCatalog(catalog.id)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteCatalog(catalog.id)}
                                  className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cores do catálogo selecionado */}
              <div className="lg:w-2/3 space-y-6">
                {activeCatalog && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-display font-bold text-foreground mb-1">
                          {activeCatalog.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {activeCatalog.paints.length} cores
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept=".csv"
                          onChange={handleImportCSV}
                        />
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                          <FileUp className="w-3 h-3 mr-1" /> Importar CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportCSV}>
                          <FileDown className="w-3 h-3 mr-1" /> Exportar CSV
                        </Button>
                        <Button onClick={handleAddPaint} style={accessibleStyles.elements.actionButton}>
                          <Plus className="w-4 h-4 mr-1" /> Adicionar Cor
                        </Button>
                      </div>
                    </div>

                    {/* Busca */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Lista de cores */}
                    <div className="space-y-4">
                      {categories.length > 0 ?
                      categories.map((cat) => {
                        const catPaints = filteredPaints.filter((p) => p.category === cat);
                        if (catPaints.length === 0) return null;
                        return (
                          <div key={cat} className="space-y-3">
                              <div className="flex items-center gap-3 sticky top-0 bg-card py-1 z-10">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{cat}</h3>
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-[10px] text-muted-foreground">{catPaints.length}</span>
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
                                {catPaints.map((paint) =>
                              <div
                                key={paint.id}
                                className="group bg-background rounded-xl border border-border overflow-hidden hover:shadow-md transition-all relative">
                                
                                  <div className="h-14 w-full" style={{ backgroundColor: paint.hex }} />
                                  <div className="p-2">
                                    <p className="text-[10px] font-bold text-foreground truncate leading-tight">{paint.name}</p>
                                    <p className="text-[9px] font-mono text-muted-foreground">{paint.hex.toUpperCase()}</p>
                                  </div>
                                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                  onClick={() => handleEditPaint(paint)}
                                  className="w-5 h-5 rounded bg-white/90 shadow flex items-center justify-center hover:bg-white">
                                  
                                      <Pencil className="w-2.5 h-2.5 text-gray-600" />
                                    </button>
                                    <button
                                  onClick={() => handleDeletePaint(paint.id)}
                                  className="w-5 h-5 rounded bg-white/90 shadow flex items-center justify-center hover:bg-red-50">
                                  
                                      <X className="w-2.5 h-2.5 text-red-500" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              </div>
                            </div>);

                      }) :

                      <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                          <Palette className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                          <p className="text-muted-foreground font-medium">Este catálogo está vazio.</p>
                          <p className="text-xs text-muted-foreground mt-1">Importe um CSV ou adicione cores manualmente.</p>
                          <Button className="mt-4 gap-2" onClick={handleAddPaint} style={accessibleStyles.elements.actionButton}>
                            <Plus className="w-4 h-4" /> Adicionar Primeira Cor
                          </Button>
                        </div>
                      }
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── ABA: IDENTIDADE VISUAL ────────────────────────────────────── */}
          <TabsContent value="branding" className="animate-fade-in">
            <div className="grid md:grid-cols-[1fr_340px] gap-8">

              {/* Formulário */}
              <div className="bg-card rounded-2xl border border-border p-8 shadow-soft space-y-8">
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground mb-1">Identidade da Marca</h2>
                  <p className="text-sm text-muted-foreground">Personalize como sua loja aparece para os clientes.</p>
                </div>

                <div className="space-y-6">
                  {/* Nome + Slug */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome da Loja</Label>
                      <Input value={company.name} onChange={(e) => updateCompanyLocal({ name: e.target.value })} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Slug (URL)</Label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 bg-muted/50 border border-border rounded-md text-xs text-muted-foreground shrink-0">
                          /empresa/
                        </div>
                        <Input
                          value={company.slug}
                          onChange={(e) => updateCompanyLocal({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                          className="h-11 font-mono text-sm"
                          placeholder="minha-loja" />
                        
                      </div>
                    </div>
                  </div>

                  {/* Cores */}
                  <div className="grid grid-cols-2 gap-4">
                    {[{
                      label: "Cor Primária",
                      key: "primaryColor" as const,
                      value: company.primaryColor,
                      desc: "Usada em botões, links e destaque"
                    }, {
                      label: "Cor Secundária",
                      key: "secondaryColor" as const,
                      value: company.secondaryColor,
                      desc: "Usada em detalhes e gradientes"
                    }].map(({ label, key, value, desc }) =>
                    <div key={key} className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
                        <div className="flex gap-2">
                          <div className="relative w-11 h-11 shrink-0">
                            <input
                            type="color"
                            value={value}
                            onChange={(e) => updateCompanyLocal({ [key]: e.target.value })}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          
                            <div className="w-full h-full rounded-lg border-2 border-border shadow-sm" style={{ backgroundColor: value }} />
                          </div>
                          <Input
                          value={value}
                          onChange={(e) => updateCompanyLocal({ [key]: e.target.value })}
                          className="h-11 font-mono text-sm uppercase" />
                        
                        </div>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                    )}
                  </div>

                  {/* Logo */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Logotipo</Label>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} />
                    <div
                      className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/40 transition-colors cursor-pointer group"
                      onClick={() => logoInputRef.current?.click()}>
                      
                      {company.logo ?
                      <div className="relative h-20 mx-auto" style={{ width: "auto", maxWidth: "200px" }}>
                          <img src={company.logo} alt="Preview" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <Upload className="w-5 h-5 text-white" />
                          </div>
                        </div> :

                      <>
                          <ImageIcon className="w-7 h-7 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Clique para fazer upload (PNG, SVG, JPG · máx 2MB)</p>
                        </>
                      }
                    </div>
                    {company.logo &&
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive w-full" onClick={() => updateCompanyLocal({ logo: undefined })}>
                        <X className="w-3.5 h-3.5 mr-1" /> Remover logo
                      </Button>
                    }
                  </div>

                  {/* Dados da Empresa */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Dados de Contato
                    </h3>
                    <p className="text-xs text-muted-foreground">Esses dados aparecem no rodapé do simulador público.</p>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telefone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={company.phone || ""}
                            onChange={(e) => updateCompanyLocal({ phone: e.target.value })}
                            placeholder="(11) 99999-9999"
                            className="h-11 pl-10" />
                          
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Website</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={company.website || ""}
                            onChange={(e) => updateCompanyLocal({ website: e.target.value })}
                            placeholder="www.sualoja.com.br"
                            className="h-11 pl-10" />
                          
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Endereço</Label>
                      <Input
                        value={company.address || ""}
                        onChange={(e) => updateCompanyLocal({ address: e.target.value })}
                        placeholder="Rua Example, 123 - Cidade/UF"
                        className="h-11" />
                      
                    </div>
                  </div>

                  {/* Estilo do Cabeçalho */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Estilo do Cabeçalho
                    </h3>
                    
                    {/* Modelo do cabeçalho */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estilo da Barra Superior</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {([
                        { value: "glass", label: "Vidro", desc: "Translúcido moderno" },
                        { value: "gradient", label: "Gradiente", desc: "Degrade vibrante" },
                        { value: "card", label: "Cartão", desc: "Elegante com linha" },
                        { value: "primary", label: "Sólido", desc: "Cor primária limpa" }] as
                        {value: HeaderStyleMode;label: string;desc: string;}[]).map((opt) =>
                        <button
                          key={opt.value}
                          onClick={() => updateCompanyLocal({ headerStyle: opt.value })}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                          company.headerStyle === opt.value ?
                          "border-primary bg-primary/5" :
                          "border-border hover:border-primary/30"
                          }`}>
                          <div className="font-medium text-sm text-foreground">{opt.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                        </button>
                        )}
                      </div>
                    </div>

                    {/* Conteúdo do cabeçalho */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conteúdo do Cabeçalho</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                        { value: "logo+name", label: "Logo + Nome", icon: "🔤" },
                        { value: "logo", label: "Só Logo", icon: "🖼️" },
                        { value: "name", label: "Só Nome", icon: "📝" }] as
                        {value: HeaderContentMode;label: string;icon: string;}[]).map((opt) =>
                        <button
                          key={opt.value}
                          onClick={() => updateCompanyLocal({ headerContent: opt.value })}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                          company.headerContent === opt.value ?
                          "border-primary bg-primary/5" :
                          "border-border hover:border-primary/30"}`
                          }>
                          
                            <span className="text-lg">{opt.icon}</span>
                            <p className="text-xs font-bold text-foreground mt-1">{opt.label}</p>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tipografia */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="text-lg">🔤</span> Tipografia
                    </h3>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conjunto de Fontes</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                        { value: "grotesk", label: "Grotesk", sample: "Space Grotesk", desc: "Moderna e técnica" },
                        { value: "rounded", label: "Arredondada", sample: "Montserrat", desc: "Amigável e suave" },
                        { value: "neo", label: "Neo-Grotesca", sample: "Roboto", desc: "Clássica e neutra" }] as
                        {value: FontSet;label: string;sample: string;desc: string;}[]).map((opt) =>
                        <button
                          key={opt.value}
                          onClick={() => updateCompanyLocal({ fontSet: opt.value })}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                          company.fontSet === opt.value ?
                          "border-primary bg-primary/5" :
                          "border-border hover:border-primary/30"}`
                          }>
                          
                            <p className="text-xs font-bold text-foreground">{opt.label}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{opt.desc}</p>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveBranding} disabled={isSaving} className="w-full h-11" style={accessibleStyles.elements.actionButton}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Salvar Alterações
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Prévia ao Vivo</h3>

                {/* Simulador mock */}
                <div className="bg-background rounded-2xl border border-border shadow-elevated overflow-hidden">
                  {/* Header preview */}
                  <div
                    className={`h-12 flex items-center gap-2 px-3 ${
                    headerStyle === "glass" ? "bg-background/80 backdrop-blur-lg" :
                    headerStyle === "gradient" ? "border-b border-transparent" :
                    headerStyle === "card" ? "bg-card border-b border-border shadow-lg" :
                    "bg-background/80 backdrop-blur-lg"}`
                    }
                    style={
                    headerStyle === "gradient" ? {
                      background: `linear-gradient(135deg, ${company.primaryColor} 0%, ${company.secondaryColor} 100%)`
                    } : headerStyle === "primary" ? {
                      backgroundColor: company.primaryColor,
                      opacity: 0.95
                    } : undefined
                    }>
                    
                    {/* Linha gradient para o estilo cartão */}
                    {headerStyle === "card" &&
                    <div
                      className="h-1 w-full"
                      style={{
                        background: `linear-gradient(90deg, ${company.primaryColor}, ${company.secondaryColor})`
                      }} />
                    }

                    {(company.headerContent === "logo+name" || company.headerContent === "logo") &&
                    <div
                      className="h-6 rounded flex items-center justify-center"
                      style={{
                        backgroundColor: company.logo ? "transparent" : headerStyle === "gradient" || headerStyle === "primary" ? "rgba(255,255,255,0.15)" : undefined,
                        width: company.logo ? "auto" : "1.5rem",
                        maxWidth: "80px",
                        border: headerStyle === "gradient" || headerStyle === "primary" ? "1px solid rgba(255,255,255,0.2)" : undefined,
                        opacity: headerStyle === "primary" ? 0.9 : undefined
                      }}>
                      
                        {company.logo ?
                      <img src={company.logo} alt="Logo" className="w-full h-full object-contain" /> :

                      <Palette className="w-3 h-3" style={{ color: headerStyle === "gradient" || headerStyle === "primary" ? "#FFFFFF" : company.primaryColor }} />
                      }
                      </div>
                    }
                    {(company.headerContent === "logo+name" || company.headerContent === "name") &&
                    <span className={`text-sm font-bold ${
                    headerStyle === "gradient" || headerStyle === "primary" ? "" : "text-foreground"}`
                    } style={
                    headerStyle === "gradient" || headerStyle === "primary" ? {
                      color: '#FFFFFF'
                    } : undefined
                    }>
                        {company.name}
                      </span>
                    }
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="aspect-video rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      <ImageIcon className="w-6 h-6 opacity-20" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                      <div className="h-2 w-1/2 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {company.catalogs[0]?.paints.slice(0, 8).map((p) =>
                      <div key={p.id} title={p.name} className="aspect-square rounded-md border border-border" style={{ backgroundColor: p.hex }} />
                      )}
                    </div>
                    <div className="h-8 rounded-lg w-full" style={{ backgroundColor: company.primaryColor }} />
                  </div>
                </div>

                {/* Link público */}
                <div className="bg-card rounded-2xl border border-border p-4 shadow-soft space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preview</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs font-mono text-foreground truncate">
                      {window.location.origin}/empresa/{company.slug || "–"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── ABA: MEUS DADOS ────────────────────────────────────── */}
          <TabsContent value="profile" className="animate-fade-in">
            <div className="grid md:grid-cols-[1fr_340px] gap-8">
              
              {/* Dados Pessoais */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Dados Pessoais
                  </h3>
                  
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-foreground">Nome Completo</Label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                        {displayData.name}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-foreground">E-mail</Label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                        {displayData.email}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-foreground">Telefone</Label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                        {displayData.phone}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-foreground">Tipo de Documento</Label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground capitalize">
                        {displayData.documentType.toUpperCase()}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-foreground">Documento</Label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                        {displayData.documentNumber}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dados da Empresa */}
                <div>
                  <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Dados da Empresa
                  </h3>
                  
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-foreground">Nome da Loja</Label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                        {displayData.companyName}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-foreground">Website</Label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                        {displayData.website ?
                        <a href={displayData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            {displayData.website}
                          </a> :
                        "Não informado"}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-foreground">Endereço</Label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                        {displayData.address}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar: Status da Assinatura */}
              <div className="space-y-6">
                {/* Status da Assinatura */}
                <div>
                  <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Assinatura
                  </h3>
                  
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-foreground">Status</Label>
                      <div className="mt-2">
                        <Badge
                          variant={company?.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                          className="w-full justify-center py-2"
                          style={company?.subscriptionStatus === 'active' ? accessibleStyles.primary.primaryBadge : accessibleStyles.elements.inactiveStatus}>
                          
                          {company?.subscriptionStatus === 'active' ? 'Assinatura Ativa' : 'Assinatura Inativa'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-foreground">Tokens Disponíveis</Label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-foreground">
                          {formatTokenAmount(company?.tokens || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getTokenStatus().text}
                        </div>
                      </div>
                    </div>
                    
                    {company?.tokensExpiresAt &&
                    <div>
                        <Label className="text-sm font-medium text-foreground">Validade dos Tokens</Label>
                        <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                          {new Date(company.tokensExpiresAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    }
                    
                    <div className="pt-2 space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={async () => {
                          await checkSubscription();
                          await refreshData();
                          toast.success("Status atualizado!");
                        }}
                        style={accessibleStyles.elements.secondaryActionButton}>
                        
                        <RefreshCw className="w-4 h-4" />
                        Atualizar Status
                      </Button>
                      
                      {company?.subscriptionStatus !== 'active' &&
                      <Button
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => window.location.href = '/checkout'}
                        style={accessibleStyles.elements.actionButton}>
                        
                          <CreditCard className="w-4 h-4" />
                          Assinar Agora
                        </Button>
                      }
                    </div>
                  </div>
                </div>

                {/* Histórico de Tokens */}
                <div>
                  <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Histórico de Tokens
                  </h3>
                  
                  <div className="bg-card border border-border rounded-xl p-6">
                    {tokenHistoryLoading ?
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div> :
                    tokenHistory.length > 0 ?
                    <div className="space-y-3">
                        {tokenHistory.map((item, index) =>
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {item.description}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(item.created_at)}
                              </div>
                            </div>
                            <Badge variant={item.amount > 0 ? 'default' : 'destructive'} style={item.amount > 0 ? accessibleStyles.primary.primaryBadge : undefined}>
                              {item.amount > 0 ? '+' : ''}{item.amount}
                            </Badge>
                          </div>
                      )}
                      </div> :

                    <div className="text-center py-4 text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma movimentação de tokens</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <PaintDialog
        open={paintDialogOpen}
        onOpenChange={setPaintDialogOpen}
        paint={editingPaint}
        onSave={handleSavePaint}
        isSaving={isSavingPaint}
      />

      {/* Logo Guidelines Dialog */}
      <Dialog open={logoGuidelinesOpen} onOpenChange={setLogoGuidelinesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Diretrizes de Logo</DialogTitle>
            <DialogDescription>
              Para garantir a melhor aparência do seu logo na plataforma, siga estas diretrizes:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Formato PNG ou SVG</p>
                  <p className="text-sm text-muted-foreground">Use vetoriais (SVG) ou PNG com fundo transparente</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Resolução mínima de 200x200px</p>
                  <p className="text-sm text-muted-foreground">Maior resolução garante melhor qualidade</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Design simples e limpo</p>
                  <p className="text-sm text-muted-foreground">Logos muito detalhados podem não ficar bem em pequenos tamanhos</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoGuidelinesOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (pendingLogoFile) {
                uploadLogo(pendingLogoFile);
                setPendingLogoFile(null);
              }
              setLogoGuidelinesOpen(false);
            }}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Menu */}
      <MobileMenu
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        onLogout={handleSignOut}
      />
    </div>
  );
};

export default Dashboard;
