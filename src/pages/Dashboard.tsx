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
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Palette, Plus, Eye, EyeOff, Search, LogOut, Loader2, Settings,
  FileUp, FileDown, Trash2, Image as ImageIcon,
  Check, Upload, Pencil, X, FolderOpen, Clock, Play, Link as LinkIcon,
  TrendingUp, Layers, Sparkles, ExternalLink, Copy, Globe, Phone, MapPin, Coins, CreditCard, RefreshCw,
  User, FileText, Building2, Menu, Database, RefreshCw as Sync
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PaintDialog from "@/components/simulator/PaintDialog";
import { Paint, HeaderContentMode, HeaderStyleMode, FontSet } from "@/data/defaultColors";
import { ProjectListItem } from "@/components/simulator/ProjectDrawer";
import { useAccessibleStyles } from "@/hooks/useAccessibleStyles";
import MobileMenu from "@/components/MobileMenu";
import { useMobile, useOrientation } from "@/hooks/useMobile";
import { listSimulatorSessions, deleteSimulatorSession, checkSyncStatus, forceSyncFromSupabase, analyzeSupabaseTables } from "@/lib/simulator-db";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
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
  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);
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
  const [syncStatus, setSyncStatus] = useState<{local: number, remote: number} | null>(null);
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
    address: company?.address || userData?.company || "Não informado",
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
        border: 'none',
      };
    },
    getAccentStyle: () => ({
      backgroundColor: `${company?.secondaryColor}10`,
      borderColor: `${company?.secondaryColor}30`,
      color: company?.secondaryColor,
    }),
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
    const payment = searchParams.get("payment");
    const type = searchParams.get("type");
    const sessionId = searchParams.get("session_id");
    
    if (payment === "success") {
      toast.success(type === "subscription" 
        ? "Assinatura realizada com sucesso! Verificando seus tokens..." 
        : "Recarga de tokens realizada com sucesso! Verificando..."
      );
      
      // 🔧 CORREÇÃO: Forçar atualização completa após pagamento
      const forceUpdateAfterPayment = async () => {
        console.log('[DASHBOARD] Forçando atualização após pagamento:', { sessionId, type });
        
        // Esperar um pouco para webhook processar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Forçar refresh completo dos dados
        await refreshData();
        
        // Verificar se tokens foram aplicados
        if (company?.tokens > 0) {
          toast.success(`✅ Tokens creditados! Você agora tem ${company.tokens} tokens.`);
        } else {
          // 🔥 EMERGÊNCIA: Se webhook não funcionar, compensar manualmente
          toast.warning("⏳ Processando pagamento... Tentando compensação manual em 5 segundos.");
          setTimeout(async () => {
            await refreshData();
            if (company?.tokens > 0) {
              toast.success(`✅ Tokens creditados! Você agora tem ${company.tokens} tokens.`);
            } else {
              // 🚨 ÚLTIMO RECURSO: Mostrar mensagem de contato
              toast.error("❌ Pagamento confirmado mas tokens não processados automaticamente.", {
                description: "Por favor, contate o suporte imediatamente com seu email e comprovante de pagamento.",
                duration: 10000
              });
            }
          }, 5000);
        }
      };
      
      forceUpdateAfterPayment();
      
      // Remover parâmetros da URL para não processar novamente
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const needsPassword = !!user?.user_metadata?.needs_password;
    if (!authLoading && user && needsPassword && !skipPasswordSetup) {
      setPasswordSetupOpen(true);
    }
  }, [user, authLoading, skipPasswordSetup]);

  const validatePassword = (password: string) => {
    if (password.length < 6) return "A senha precisa ter no mínimo 6 caracteres.";
    if (!/[A-Z]/.test(password)) return "A senha precisa ter pelo menos 1 letra maiúscula.";
    if (!/[0-9]/.test(password)) return "A senha precisa ter pelo menos 1 número.";
    return "";
  };

  const passwordHasStarted = newPassword.length > 0 || confirmPassword.length > 0;
  const passwordRules = {
    minLength: newPassword.length >= 6,
    hasUpper: /[A-Z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const getRuleClass = (ok: boolean) => {
    if (!passwordHasStarted) return "text-muted-foreground";
    return ok ? "text-green-600" : "text-yellow-600";
  };

  const handleSetPassword = async () => {
    setPasswordError("");

    const validation = validatePassword(newPassword);
    if (validation) {
      setPasswordError(validation);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { needs_password: false },
      });

      if (error) throw error;

      toast.success("Senha criada com sucesso!");
      setPasswordSetupOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordError(error.message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSkipPasswordSetup = () => {
    // Mark that user has chosen to skip
    setSkipPasswordSetup(true);
    setPasswordSetupOpen(false);
    
    // Show a toast reminder
    toast.info("Você pode definir sua senha mais tarde nas configurações do perfil.", {
      description: "Acesse Configurações > Perfil para criar sua senha quando desejar."
    });
  };

  useEffect(() => {
    if (!user) return;
    refreshData().then(() => setIsInitialLoading(false));
  }, [user]); // ✅ Apenas user - evita loop infinito

  useEffect(() => {
    (async () => {
      try {
        setSessionsLoading(true);
        const list = await listSimulatorSessions();
        console.log("[Dashboard] Projetos carregados:", list); // Debug
        
        // Melhorar o mapeamento com fallbacks robustos
        setSessions(list.map((r) => {
          // Tentar extrair nome de múltiplas fontes
          let name = "Projeto sem nome";
          
          if (r.name && typeof r.name === 'string' && r.name.trim()) {
            name = r.name.trim();
          } else if (r.data && typeof r.data === 'object' && r.data !== null && 'name' in r.data) {
            name = String((r.data as any).name).trim();
          } else if (r.data && typeof r.data === 'object' && r.data !== null && 'data' in r.data && (r.data as any).data && 'name' in (r.data as any).data) {
            name = String((r.data as any).data.name).trim();
          }
          
          return { 
            id: r.id, 
            name: name || "Projeto sem nome", 
            updatedAt: r.updatedAt || r.createdAt || new Date().toISOString()
          };
        }));
      } finally {
        setSessionsLoading(false);
      }
    })();
  }, []);

  // Buscar histórico de tokens
  useEffect(() => {
    if (!user) return;
    
    const fetchTokenHistory = async () => {
      try {
        setTokenHistoryLoading(true);
        const { data } = await (supabase as any)
          .from('token_consumptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        setTokenHistory(data || []);
      } catch (error) {
        console.error("Erro ao buscar histórico de tokens:", error);
      } finally {
        setTokenHistoryLoading(false);
      }
    };

    fetchTokenHistory();
  }, [user]);

  if (authLoading || isInitialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
          <Palette className="w-6 h-6 text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  if (!user || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Não conseguimos carregar os dados da sua loja.</p>
          <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    navigate("/");
  };

  // Gerar slug único baseado no nome da empresa
  const generateUniqueSlug = async (baseName: string): Promise<string> => {
    const baseSlug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_slug', slug)
        .neq('id', user.id)
        .maybeSingle();
      
      if (!existing) return slug;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
      
      // Limitar tentativas para evitar loop infinito
      if (counter > 100) {
        throw new Error('Não foi possível gerar um slug único');
      }
    }
  };

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      let finalSlug = company.slug;
      
      // Se não tiver slug, gerar um automático
      if (!finalSlug) {
        finalSlug = await generateUniqueSlug(company.name);
      } else {
        // Verificar se o slug atual já existe em outra empresa
        const { data: existingSlug, error: slugCheckError } = await supabase
          .from('profiles')
          .select('id, company_slug')
          .eq('company_slug', finalSlug)
          .neq('id', user.id)
          .maybeSingle();
        
        // Se existir, gerar um novo baseado no nome
        if (existingSlug && !slugCheckError) {
          finalSlug = await generateUniqueSlug(company.name);
          toast.info(`URL "${company.slug}" já estava em uso. Usando "${finalSlug}"`);
        }
      }

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        company_name: company.name,
        company_slug: finalSlug, // Usar o slug final (gerado ou verificado)
        primary_color: company.primaryColor,
        secondary_color: company.secondaryColor,
        avatar_url: company.logo,

        company_phone: company.phone || null,
        company_website: company.website || null,
        company_address: company.address || null,
        header_content: company.headerContent || "logo+name",
        header_style: company.headerStyle || "glass",
        font_set: company.fontSet || "grotesk",

        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
      
      if (error) {
        console.error('Erro ao salvar perfil:', error);
        throw error;
      }
      
      // Atualizar o estado local com o slug usado
      if (finalSlug !== company.slug) {
        updateCompany({ slug: finalSlug });
      }
      
      toast.success("Identidade visual salva!");
    } catch (error: any) {
      console.error('Erro detalhado:', error);
      // Se for erro de duplicidade (409), não é crítico
      if (error.message?.includes('409') || error.message?.includes('duplicate')) {
        toast.success("Identidade visual já atualizada!");
      } else if (error.message?.includes('profiles_company_slug_key')) {
        toast.error("Este URL personalizado já está em uso. Tente outro.");
      } else {
        toast.error("Erro ao salvar: " + error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo deve ter menos de 2MB"); return; }
    
    // Verifica se o arquivo é PNG
    if (!file.type.includes('png')) {
      toast.error("Por favor, envie o logo em formato PNG para melhor qualidade");
    }
    
    setPendingLogoFile(file);
    setLogoGuidelinesOpen(true);
    e.target.value = "";
  };

  const handleLogoConfirm = () => {
    if (!pendingLogoFile) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateCompany({
        logo: ev.target?.result as string
      });
      toast.success("Logo atualizado com sucesso!");
    };
    reader.readAsDataURL(pendingLogoFile);
    
    setLogoGuidelinesOpen(false);
    setPendingLogoFile(null);
  };

  const handleLogoCancel = () => {
    setLogoGuidelinesOpen(false);
    setPendingLogoFile(null);
  };


  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCatalogId) return;
    const reader = new FileReader();
    reader.onload = (ev) => { importPaintsCSV(selectedCatalogId, ev.target?.result as string); toast.success("Tintas importadas!"); };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportCSV = () => {
    const id = selectedCatalogId || company.catalogs[0]?.id;
    if (!id) return;
    const csv = exportPaintsCSV(id);
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `catalogo-${id}.csv`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleAddPaint = () => { setEditingPaint(null); setPaintDialogOpen(true); };
  const handleEditPaint = (paint: Paint) => { setEditingPaint(paint); setPaintDialogOpen(true); };

  const handleSavePaint = async (paintData: Omit<Paint, "id" | "rgb" | "cmyk">) => {
    const catalogId = selectedCatalogId || company.catalogs[0]?.id;
    if (!catalogId || !company) return;
    setIsSavingPaint(true);

    const newPaint: Paint = {
      id: editingPaint?.id || Math.random().toString(36).substring(2, 10),
      name: paintData.name,
      code: paintData.code,
      hex: paintData.hex,
      rgb: hexToRgb(paintData.hex),
      cmyk: hexToCmyk(paintData.hex),
      category: paintData.category,
    };

    // Atualiza estado local
    updateCompany({
      catalogs: company.catalogs.map((cat) => {
        if (cat.id !== catalogId) return cat;
        return {
          ...cat,
          paints: editingPaint
            ? cat.paints.map((p) => p.id === editingPaint.id ? newPaint : p)
            : [...cat.paints, newPaint],
        };
      }),
    });

    // Salva no banco de dados
    try {
      if (editingPaint) {
        // Atualiza tinta existente
        const { error } = await supabase
          .from('paints')
          .update({
            name: newPaint.name,
            code: newPaint.code,
            hex: newPaint.hex,
            rgb: newPaint.rgb,
            cmyk: newPaint.cmyk,
            category: newPaint.category
          })
          .eq('id', editingPaint.id);

        if (error) {
          console.error("Erro ao atualizar tinta:", error);
        }
      } else {
        // Insere nova tinta
        const { error } = await supabase
          .from('paints')
          .insert({
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
      ),
    });

    // Remove do banco de dados
    try {
      const { error } = await supabase
        .from('paints')
        .delete()
        .eq('id', paintId);

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
  const isMinimalHeader = headerStyle === "minimal";
  const isPrimaryHeader = headerStyle === "primary";
  const isWhiteHeader = headerStyle === "white";
  const isWhiteAccentHeader = headerStyle === "white-accent";
  const isColoredHeader = isGradientHeader || isMinimalHeader || isPrimaryHeader;

  const getButtonStyle = (isPrimary = true) => {
      // Se estiver em modo gradiente, usar estilo primário acessível
      if (isGradientHeader) {
        return accessibleStyles.primary.primaryButton;
      }
      // Se estiver em modo criativo, usar contraste inteligente
      if (isMinimalHeader) {
        return accessibleStyles.primary.primaryButton;
      }
      // Caso contrário, usar lógica normal
      return companyStyles.getButtonStyle(isPrimary);
    };

  const getHeaderTextColor = () => {
    // Se estiver em modo gradiente ou criativo, usar texto acessível
    if (isGradientHeader || isMinimalHeader) {
      return accessibleStyles.primary.primaryText.color;
    }
    return undefined; // Usa cores padrão do Tailwind
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
        },
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
      {/* Header */}
      <header
        className={`sticky top-0 z-50 ${
          headerStyle === "glass"
            ? "bg-background/80 backdrop-blur-lg border-b border-border"
            : isColoredHeader
              ? "border-b border-transparent"
              : isCardHeader
                ? "bg-card border-b border-border shadow-xl"
                : (isWhiteHeader || isWhiteAccentHeader)
                  ? "bg-white border-b border-border"
                  : "bg-background/80 backdrop-blur-lg border-b border-border"
        }`}
        style={
          isGradientHeader ? { 
            background: `linear-gradient(135deg, ${company.primaryColor} 0%, ${company.secondaryColor} 100%)`
          } : (isMinimalHeader || isPrimaryHeader) ? {
            backgroundColor: company.primaryColor,
            opacity: isPrimaryHeader ? 1 : 0.95
          } : undefined
        }
      >
        {/* Linha gradient para o estilo cartão ou white-accent */}
        {(isCardHeader || isWhiteAccentHeader) && (
          <div 
            className="h-1 w-full"
            style={{ 
              background: `linear-gradient(90deg, ${company.primaryColor}, ${company.secondaryColor})`
            }}
          />
        )}

        <div className="container mx-auto flex items-center justify-between h-16 px-4 max-w-7xl">
          <div className="flex items-center gap-3 min-w-0">
            {(company.headerContent === "logo+name" || company.headerContent === "logo") && (
              <div
                className="h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
                style={{ 
                  backgroundColor: company.logo ? "transparent" : isColoredHeader ? "rgba(255,255,255,0.15)" : undefined,
                  width: company.logo ? "auto" : "2rem",
                  maxWidth: "120px",
                  border: isColoredHeader ? "1px solid rgba(255,255,255,0.2)" : undefined,
                }}
              >
                {company.logo ? (
                  <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Palette className="w-4 h-4" style={{ color: isColoredHeader ? "#FFFFFF" : company.primaryColor }} />
                )}
              </div>
            )}

            {(company.headerContent === "logo+name" || company.headerContent === "name" || !company.headerContent) && (
              <div className="leading-tight">
                <span 
                  className={`font-display text-base font-bold block`}
                  style={getHeaderTextColor() ? { color: getHeaderTextColor() } : {}}
                >
                  {company.name}
                </span>
                <span 
                  className={`text-[10px]`}
                  style={getHeaderTextColor() ? { color: getHeaderTextColor() + "80" } : {}}
                >
                  Painel Administrativo
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              asChild
              style={getButtonStyle()}
            >
              <Link to="/simulator" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Simulador
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title="Sair"
              style={getHeaderTextColor() ? { color: getHeaderTextColor() } : {}}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

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
                  sub: getTokenStatus().text,
                },
                {
                  label: "Projetos Salvos",
                  value: sessionsLoading ? "..." : sessions.length,
                  icon: FolderOpen,
                  color: accessibleStyles.primary.primaryIcon.color,
                  sub: "no seu dispositivo",
                },
                {
                  label: "Catálogos Ativos",
                  value: activeCatalogs,
                  icon: Layers,
                  color: accessibleStyles.secondary.secondaryIcon.color,
                  sub: `de ${company.catalogs.length} total`,
                },
                {
                  label: "Total de Cores",
                  value: totalPaints,
                  icon: Palette,
                  color: "#6366f1",
                  sub: "em todos os catálogos",
                },
                // {
                //   label: "Link Público",
                //   value: company.slug ? "Ativo" : "Inativo",
                //   icon: LinkIcon,
                //   color: "#10b981",
                //   sub: `/empresa/${company.slug || "–"}`,
                // },
              ].map(({ label, value, icon: Icon, color, sub }) => (
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
              ))}
            </div>

            {/* Seção de Tokens */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-border p-6 shadow-soft space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                  <Coins className="w-5 h-5" /> Meus Tokens
                </h3>
                <Badge 
                  variant={company?.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                  style={company?.subscriptionStatus === 'active' ? accessibleStyles.primary.primaryBadge : accessibleStyles.elements.inactiveStatus}
                >
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

              {/* Histórico recente */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Histórico Recente
                </h4>
                {tokenHistoryLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : tokenHistory.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nenhuma movimentação recente
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tokenHistory.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg bg-background/50">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            item.amount > 0 ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-foreground">{item.description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            item.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.amount > 0 ? '+' : ''}{item.amount}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ações de pagamento */}
              <div className="flex flex-wrap gap-3">
                {company?.subscriptionStatus !== 'active' ? (
                  <Button
                    onClick={() => handleCheckout("subscription")}
                    disabled={isCheckoutLoading}
                    className="gap-2"
                    style={accessibleStyles.elements.actionButton}
                  >
                    {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Assinar por R$ 59,90/mês
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    className="gap-2"
                    style={accessibleStyles.elements.secondaryActionButton}
                  >
                    <Settings className="w-4 h-4" /> Gerenciar Assinatura
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => handleCheckout("recharge")}
                  disabled={isCheckoutLoading}
                  className="gap-2"
                  style={accessibleStyles.elements.secondaryActionButton}
                >
                  {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                  Recarregar 100 tokens — R$ 29,90
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await checkSubscription();
                    await refreshData();
                    toast.success("Status atualizado!");
                  }}
                  className="gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                </Button>
              </div>

              {company?.subscriptionStatus !== 'active' && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-sm text-orange-800">
                    <strong>Atenção:</strong> Sua assinatura está inativa. 
                    Assine o plano Colora Pro por R$ 59,90/mês e receba 200 tokens mensais para simulações!
                  </p>
                </div>
              )}
            </div>

            {/* Sessões recentes + Link público */}
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
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

                {sessionsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
                    <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum projeto salvo ainda</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Inicie uma simulação e ela será salva automaticamente</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
                      >
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
                    ))}
                  </div>
                )}
              </div>

              {/* Diagnóstico de Sincronização */}
              {/* <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Diagnóstico de Sincronização
                  </h4>
                  {syncStatus && (
                    <Badge variant={syncStatus.local === syncStatus.remote ? "default" : "destructive"} className="text-xs">
                      Local: {syncStatus.local} | Remoto: {syncStatus.remote}
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckSync}
                    disabled={checkingSync}
                    className="gap-1.5"
                  >
                    {checkingSync ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    Verificar Sync
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleForceSync}
                    className="gap-1.5"
                  >
                    <Sync className="w-3.5 h-3.5" />
                    Forçar Sync
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAnalyzeDatabase}
                    className="gap-1.5"
                  >
                    <Database className="w-3.5 h-3.5" />
                    Analisar BD
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique sincronização, limpe cache ou analise todas as tabelas em busca de duplicatas e problemas
                </p>
              </div> */}

              {/* Painel lateral: catálogos */}
              <div className="space-y-4">
                {/* Resumo de catálogos */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-soft space-y-3">
                  <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Seus Catálogos
                  </h3>
                  <div className="space-y-2">
                    {company.catalogs.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{cat.name}</p>
                          <p className="text-[10px] text-muted-foreground">{cat.paints.length} cores</p>
                        </div>
                        <Badge 
                          variant={cat.active ? "default" : "secondary"} 
                          className="text-[10px]"
                          style={cat.active ? accessibleStyles.primary.primaryBadge : accessibleStyles.elements.inactiveStatus}
                        >
                          {cat.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── ABA: CATÁLOGOS ────────────────────────────────────────────── */}
          <TabsContent value="catalogs" className="animate-fade-in space-y-6">
            <div className="grid lg:grid-cols-[280px_1fr] gap-8">
              {/* Sidebar: lista de catálogos */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" /> Meus Catálogos
                </h3>

                <div className="space-y-2">
                  {company.catalogs.map((cat, index) => (
                    <div
                      key={cat.id}
                      className={`group w-full p-4 rounded-xl border text-left transition-all ${
                        activeCatalog?.id === cat.id
                          ? "border-primary bg-primary/5 shadow-soft"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      {editingCatalogId === cat.id ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            value={editingCatalogName}
                            onChange={(e) => setEditingCatalogName(e.target.value)}
                            className="h-7 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { updateCatalog(cat.id, { name: editingCatalogName }); setEditingCatalogId(null); }
                              if (e.key === "Escape") setEditingCatalogId(null);
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { updateCatalog(cat.id, { name: editingCatalogName }); setEditingCatalogId(null); }}>
                            <Check className="w-3.5 h-3.5 text-primary" />
                          </Button>
                        </div>
                      ) : (
                        <button className="w-full text-left" onClick={() => setSelectedCatalogId(cat.id)}>
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-sm truncate ${activeCatalog?.id === cat.id ? "text-primary" : "text-foreground"}`}>
                              {cat.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); updateCatalog(cat.id, { active: !cat.active }); }}
                                className={`p-1 rounded transition-colors ${cat.active ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground bg-muted"}`}
                                title={cat.active ? "Desativar" : "Ativar"}
                              >
                                {cat.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingCatalogId(cat.id); setEditingCatalogName(cat.name); }}
                                className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                                title="Renomear"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              {index !== 0 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteCatalog(cat.id); }}
                                  className="p-1 rounded text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] font-medium text-muted-foreground mt-1">
                            {cat.paints.length} cores · {cat.active ? "Ativo" : "Inativo"}
                          </p>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Novo catálogo */}
                <div className="pt-3 border-t border-border">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Novo Catálogo
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome..."
                      value={newCatalogName}
                      onChange={(e) => setNewCatalogName(e.target.value)}
                      className="h-9 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCatalogName.trim()) {
                          addCatalog({ name: newCatalogName.trim(), active: true });
                          setNewCatalogName("");
                          toast.success("Catálogo criado!");
                        }
                      }}
                    />
                    <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => {
                      if (newCatalogName.trim()) {
                        addCatalog({ name: newCatalogName.trim(), active: true });
                        setNewCatalogName("");
                        toast.success("Catálogo criado!");
                      }
                    }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main: gerenciamento de cores */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-6">
                {/* Header do catálogo ativo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-display font-bold text-foreground">{activeCatalog?.name || "Selecione um catálogo"}</h2>
                    <p className="text-sm text-muted-foreground">
                      {activeCatalog ? `${activeCatalog.paints.length} cores · ${categories.length} categorias` : "–"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()} style={accessibleStyles.elements.secondaryActionButton}>
                      <FileUp className="w-3.5 h-3.5" /> Importar CSV
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV} style={accessibleStyles.elements.secondaryActionButton}>
                      <FileDown className="w-3.5 h-3.5" /> Exportar
                    </Button>
                    <Button size="sm" className="gap-1.5" onClick={handleAddPaint} style={accessibleStyles.elements.actionButton}>
                      <Plus className="w-3.5 h-3.5" /> Nova Cor
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                  </div>
                </div>

                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Stats rápidas */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total", value: activeCatalog?.paints.length || 0 },
                    { label: "Filtradas", value: filteredPaints.length },
                    { label: "Categorias", value: categories.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold font-display text-foreground">{value}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Grid de cores por categoria */}
                <div className="space-y-8 max-h-[500px] overflow-y-auto pr-1">
                  {categories.length > 0 ? (
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
                            {catPaints.map((paint) => (
                              <div
                                key={paint.id}
                                className="group bg-background rounded-xl border border-border overflow-hidden hover:shadow-md transition-all relative"
                              >
                                <div className="h-14 w-full" style={{ backgroundColor: paint.hex }} />
                                <div className="p-2">
                                  <p className="text-[10px] font-bold text-foreground truncate leading-tight">{paint.name}</p>
                                  <p className="text-[9px] font-mono text-muted-foreground">{paint.hex.toUpperCase()}</p>
                                </div>
                                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditPaint(paint)}
                                    className="w-5 h-5 rounded bg-white/90 shadow flex items-center justify-center hover:bg-white"
                                  >
                                    <Pencil className="w-2.5 h-2.5 text-gray-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePaint(paint.id)}
                                    className="w-5 h-5 rounded bg-white/90 shadow flex items-center justify-center hover:bg-red-50"
                                  >
                                    <X className="w-2.5 h-2.5 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
                      <Palette className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                      <p className="text-muted-foreground font-medium">Este catálogo está vazio.</p>
                      <p className="text-xs text-muted-foreground mt-1">Importe um CSV ou adicione cores manualmente.</p>
                      <Button className="mt-4 gap-2" onClick={handleAddPaint} style={accessibleStyles.elements.actionButton}>
                        <Plus className="w-4 h-4" /> Adicionar Primeira Cor
                      </Button>
                    </div>
                  )}
                </div>
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
                          placeholder="minha-loja"
                        />
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
                    }].map(({ label, key, value, desc }) => (
                      <div key={key} className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
                        <div className="flex gap-2">
                          <div className="relative w-11 h-11 shrink-0">
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => updateCompanyLocal({ [key]: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-full h-full rounded-lg border-2 border-border shadow-sm" style={{ backgroundColor: value }} />
                          </div>
                          <Input
                            value={value}
                            onChange={(e) => updateCompanyLocal({ [key]: e.target.value })}
                            className="h-11 font-mono text-sm uppercase"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Logo */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Logotipo</Label>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} />
                    <div
                      className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/40 transition-colors cursor-pointer group"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {company.logo ? (
                        <div className="relative h-20 mx-auto" style={{ width: "auto", maxWidth: "200px" }}>
                          <img src={company.logo} alt="Preview" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <Upload className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-7 h-7 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Clique para fazer upload (PNG, SVG, JPG · máx 2MB)</p>
                        </>
                      )}
                    </div>
                    {company.logo && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive w-full" onClick={() => updateCompanyLocal({ logo: undefined })}>
                        <X className="w-3.5 h-3.5 mr-1" /> Remover logo
                      </Button>
                    )}
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
                            className="h-11 pl-10"
                          />
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
                            className="h-11 pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Endereço</Label>
                      <Input
                        value={company.address || ""}
                        onChange={(e) => updateCompanyLocal({ address: e.target.value })}
                        placeholder="Rua Example, 123 - Cidade/UF"
                        className="h-11"
                      />
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
                          { value: "glass", label: "Transparente", desc: "Fundo translúcido" },
                          { value: "gradient", label: "Gradiente", desc: "Degrade intenso" },
                          { value: "card", label: "Cartão", desc: "Com linha gradient" },
                          { value: "minimal", label: "Criativo", desc: "Divisor animado" },
                          { value: "primary", label: "Sólido", desc: "Cor primária sólida" },
                          { value: "white", label: "Branco", desc: "Fundo branco limpo" },
                          { value: "white-accent", label: "Branco Accent", desc: "Branco com linha colorida" },
                        ] as { value: HeaderStyleMode; label: string; desc: string }[]).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateCompanyLocal({ headerStyle: opt.value })}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              company.headerStyle === opt.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <p className="text-xs font-bold text-foreground">{opt.label}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Conteúdo do cabeçalho */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conteúdo do Cabeçalho</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { value: "logo+name", label: "Logo + Nome", icon: "🔤" },
                          { value: "logo", label: "Só Logo", icon: "🖼️" },
                          { value: "name", label: "Só Nome", icon: "📝" },
                        ] as { value: HeaderContentMode; label: string; icon: string }[]).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateCompanyLocal({ headerContent: opt.value })}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${
                              company.headerContent === opt.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <span className="text-lg">{opt.icon}</span>
                            <p className="text-xs font-bold text-foreground mt-1">{opt.label}</p>
                          </button>
                        ))}
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
                          { value: "neo", label: "Neo-Grotesca", sample: "Roboto", desc: "Clássica e neutra" },
                        ] as { value: FontSet; label: string; sample: string; desc: string }[]).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateCompanyLocal({ fontSet: opt.value })}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              company.fontSet === opt.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <p className="text-xs font-bold text-foreground">{opt.label}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
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
                      headerStyle === "minimal" ? "border-b border-transparent" :
                      "bg-background/80 backdrop-blur-lg"
                    }`}
                    style={
                      headerStyle === "gradient" ? { 
                        background: `linear-gradient(135deg, ${company.primaryColor} 0%, ${company.secondaryColor} 100%)`
                      } : headerStyle === "minimal" ? {
                        backgroundColor: company.primaryColor,
                        opacity: 0.95 // Leve transparência no fundo
                      } : undefined
                    }
                  >
                    {/* Linha gradient para o estilo cartão (sem transparência) */}
                    {headerStyle === "card" && (
                      <div 
                        className="h-1 w-full"
                        style={{ 
                          background: `linear-gradient(90deg, ${company.primaryColor}, ${company.secondaryColor})`
                        }}
                      />
                    )}

                    {(company.headerContent === "logo+name" || company.headerContent === "logo") && (
                      <div
                        className="h-6 rounded flex items-center justify-center"
                        style={{ 
                          backgroundColor: company.logo ? "transparent" : (headerStyle === "gradient" || headerStyle === "minimal") ? "rgba(255,255,255,0.15)" : undefined,
                          width: company.logo ? "auto" : "1.5rem",
                          maxWidth: "80px",
                          border: (headerStyle === "gradient" || headerStyle === "minimal") ? "1px solid rgba(255,255,255,0.2)" : undefined,
                          opacity: headerStyle === "minimal" ? 0.9 : undefined // Leve transparência adicional no logo
                        }}
                      >
                        {company.logo ? (
                          <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Palette className="w-3 h-3" style={{ color: (headerStyle === "gradient" || headerStyle === "minimal") ? "#FFFFFF" : company.primaryColor }} />
                        )}
                      </div>
                    )}
                    {(company.headerContent === "logo+name" || company.headerContent === "name") && (
                      <span className={`text-sm font-bold ${
                        headerStyle === "gradient" || headerStyle === "minimal" ? "" : "text-foreground"
                      }`} style={
                        (headerStyle === "gradient" || headerStyle === "minimal") ? { 
                          color: '#FFFFFF' // Sempre branco nestes estilos
                        } : undefined
                      }>
                        {company.name}
                      </span>
                    )}
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
                      {company.catalogs[0]?.paints.slice(0, 8).map((p) => (
                        <div key={p.id} title={p.name} className="aspect-square rounded-md border border-border" style={{ backgroundColor: p.hex }} />
                      ))}
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
                        {displayData.website ? (
                          <a href={displayData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            {displayData.website}
                          </a>
                        ) : "Não informado"}
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
                          style={company?.subscriptionStatus === 'active' ? accessibleStyles.primary.primaryBadge : accessibleStyles.elements.inactiveStatus}
                        >
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
                    
                    {company?.tokensExpiresAt && (
                      <div>
                        <Label className="text-sm font-medium text-foreground">Validade dos Tokens</Label>
                        <div className="mt-1 p-3 bg-muted/50 rounded-lg text-foreground">
                          {new Date(company.tokensExpiresAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    )}
                    
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
                        style={accessibleStyles.elements.secondaryActionButton}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Atualizar Status
                      </Button>
                      
                      {company?.subscriptionStatus !== 'active' && (
                        <Button
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => window.location.href = '/checkout'}
                          style={accessibleStyles.elements.actionButton}
                        >
                          <CreditCard className="w-4 h-4" />
                          Assinar Agora
                        </Button>
                      )}
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
                    {tokenHistoryLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : tokenHistory.length > 0 ? (
                      <div className="space-y-3">
                        {tokenHistory.map((item, index) => (
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
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma movimentação de tokens</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <PaintDialog
        open={paintDialogOpen}
        onOpenChange={setPaintDialogOpen}
        paint={editingPaint}
        onSave={handleSavePaint}
        isSaving={isSavingPaint}
      />

      {/* Modal obrigatório para criar senha no primeiro acesso */}
      <Dialog
        open={passwordSetupOpen}
        onOpenChange={(open) => {
          if (open) setPasswordSetupOpen(true);
        }}
      >
        <DialogContent
          onEscapeKeyDown={(e) => {
            e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle>🔐 Proteja sua conta</DialogTitle>
            <DialogDescription>
              Crie uma senha para acessar o painel ou defina depois nas configurações.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Por que criar uma senha?</p>
                  <p className="text-xs mt-1">Protege seu acesso e permite login tradicional além do auto-login.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="Digite sua nova senha"
                className={
                  passwordHasStarted
                    ? (passwordRules.minLength && passwordRules.hasUpper && passwordRules.hasNumber
                        ? "border-green-600 focus-visible:ring-green-600"
                        : "border-yellow-600 focus-visible:ring-yellow-600")
                    : undefined
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="Repita a senha"
                className={
                  passwordHasStarted
                    ? (passwordRules.matches
                        ? "border-green-600 focus-visible:ring-green-600"
                        : "border-yellow-600 focus-visible:ring-yellow-600")
                    : undefined
                }
              />
            </div>

            <div className="text-xs">
              <div className="text-muted-foreground mb-2">Requisitos de senha:</div>
              <div className={getRuleClass(passwordRules.minLength)}>- Mínimo de 6 caracteres</div>
              <div className={getRuleClass(passwordRules.hasUpper)}>- Pelo menos 1 letra maiúscula</div>
              <div className={getRuleClass(passwordRules.hasNumber)}>- Pelo menos 1 número</div>
              <div className={getRuleClass(passwordRules.matches)}>- As senhas precisam ser iguais</div>
            </div>

            {passwordError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
                {passwordError}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleSkipPasswordSetup}
              className="w-full sm:w-auto"
            >
              Definir depois
            </Button>
            <Button 
              onClick={handleSetPassword} 
              disabled={isSavingPassword || !passwordRules.minLength || !passwordRules.hasUpper || !passwordRules.hasNumber || !passwordRules.matches}
              className="w-full sm:w-auto"
            >
              {isSavingPassword ? "Salvando..." : "Criar senha agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de boas práticas para logo */}
      {logoGuidelinesOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl border border-border shadow-soft max-w-md w-full p-6 space-y-4">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground text-lg">Diretrizes para o Logotipo</h3>
              <p className="text-sm text-muted-foreground">
                Para garantir a melhor aparência no cabeçalho do seu site, siga estas recomendações:
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Formato PNG</p>
                  <p className="text-muted-foreground text-xs">Use PNG com fundo transparente para melhor qualidade</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Layout Horizontal</p>
                  <p className="text-muted-foreground text-xs">Logotipos mais largos do que altos funcionam melhor no cabeçalho</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Alta Resolução</p>
                  <p className="text-muted-foreground text-xs">Mínimo de 200px de altura para boa nitidez</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Cores Contrastantes</p>
                  <p className="text-muted-foreground text-xs">Evite cores muito claras que possam se perder no fundo</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleLogoCancel} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleLogoConfirm} className="flex-1">
                Entendido, Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
