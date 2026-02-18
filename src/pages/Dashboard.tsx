import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Palette, Plus, Eye, EyeOff, Search, LogOut, Loader2, Settings,
  LayoutDashboard, FileUp, FileDown, Trash2, Image as ImageIcon,
  Check, Upload, Pencil, X, FolderOpen, Clock, Play, Link as LinkIcon,
  TrendingUp, Layers, Sparkles, ExternalLink, Copy
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PaintDialog from "@/components/simulator/PaintDialog";
import { Paint } from "@/data/defaultColors";
import { SessionListItem } from "@/components/simulator/SessionDrawer";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
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
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    company, updateCompany, addCatalog, updateCatalog, deleteCatalog,
    importPaintsCSV, exportPaintsCSV, refreshData
  } = useStore();

  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCatalogName, setNewCatalogName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sessões recentes
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // CRUD cores
  const [paintDialogOpen, setPaintDialogOpen] = useState(false);
  const [editingPaint, setEditingPaint] = useState<Paint | null>(null);
  const [isSavingPaint, setIsSavingPaint] = useState(false);

  // Edição inline do nome do catálogo
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [editingCatalogName, setEditingCatalogName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    refreshData().then(() => setIsInitialLoading(false));
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        setSessionsLoading(true);
        const { listSimulatorSessions } = await import("@/lib/simulator-db");
        const list = await listSimulatorSessions();
        setSessions(list.map((r) => ({ id: r.id, name: r.name, updatedAt: r.updatedAt })));
      } finally {
        setSessionsLoading(false);
      }
    })();
  }, []);

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

  // ─── handlers ──────────────────────────────────────────────────────────────

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    navigate("/");
  };

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      const { error } = await (supabase.from('profiles') as any).upsert({
        id: user.id,
        company_name: company.name,
        company_slug: company.slug,
        primary_color: company.primaryColor,
        secondary_color: company.secondaryColor,
        avatar_url: company.logo,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Identidade visual salva!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo deve ter menos de 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { updateCompany({ logo: ev.target?.result as string }); toast.success("Logo carregado!"); };
    reader.readAsDataURL(file);
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

  const handleSavePaint = (paintData: Omit<Paint, "id" | "rgb" | "cmyk">) => {
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

    setIsSavingPaint(false);
    setPaintDialogOpen(false);
    toast.success(editingPaint ? "Cor atualizada!" : "Cor adicionada!");
  };

  const handleDeletePaint = (paintId: string) => {
    const catalogId = selectedCatalogId || company.catalogs[0]?.id;
    if (!catalogId || !company) return;
    updateCompany({
      catalogs: company.catalogs.map((cat) =>
        cat.id === catalogId ? { ...cat, paints: cat.paints.filter((p) => p.id !== paintId) } : cat
      ),
    });
    toast.success("Cor excluída!");
  };

  const handleOpenProject = (id: string) => {
    localStorage.setItem("colora_pending_session", id);
    navigate("/simulator");
  };

  const handleDeleteSession = async (id: string) => {
    const { deleteSimulatorSession } = await import("@/lib/simulator-db");
    await deleteSimulatorSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Projeto excluído!");
  };

  const copyPublicLink = () => {
    const link = `${window.location.origin}/empresa/${company.slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
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

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 max-w-7xl">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
              style={{ backgroundColor: company.logo ? "transparent" : company.primaryColor }}
            >
              {company.logo ? (
                <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Palette className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="leading-tight">
              <span className="font-display text-base font-bold text-foreground block">{company.name}</span>
              <span className="text-[10px] text-muted-foreground">Painel Administrativo</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 hidden sm:flex"
              onClick={copyPublicLink}
            >
              <LinkIcon className="w-3.5 h-3.5" /> Link Público
            </Button>
            <Button size="sm" asChild style={{ backgroundColor: company.primaryColor }}>
              <Link to="/simulator" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Simulador
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
              <LogOut className="w-4 h-4 text-muted-foreground" />
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
          </TabsList>

          {/* ── ABA: VISÃO GERAL ──────────────────────────────────────────── */}
          <TabsContent value="overview" className="animate-fade-in space-y-8">

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Projetos Salvos",
                  value: sessionsLoading ? "..." : sessions.length,
                  icon: FolderOpen,
                  color: company.primaryColor,
                  sub: "no seu dispositivo",
                },
                {
                  label: "Catálogos Ativos",
                  value: activeCatalogs,
                  icon: Layers,
                  color: company.secondaryColor,
                  sub: `de ${company.catalogs.length} total`,
                },
                {
                  label: "Total de Cores",
                  value: totalPaints,
                  icon: Palette,
                  color: "#6366f1",
                  sub: "em todos os catálogos",
                },
                {
                  label: "Link Público",
                  value: company.slug ? "Ativo" : "Inativo",
                  icon: LinkIcon,
                  color: "#10b981",
                  sub: `/empresa/${company.slug || "–"}`,
                },
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

            {/* Sessões recentes + Link público */}
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">

              {/* Sessões recentes */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" /> Projetos Recentes
                  </h3>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/simulator" className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Novo
                    </Link>
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
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenProject(s.id)} title="Abrir" style={{ color: company.primaryColor }}>
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

              {/* Painel lateral: link público + catálogos */}
              <div className="space-y-4">
                {/* Link público */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-soft space-y-3">
                  <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Simulador Público
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Compartilhe este link com seus clientes para que eles simulem cores com seu catálogo.
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                      /empresa/{company.slug || "–"}
                    </div>
                    <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={copyPublicLink}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                    <a href={`/empresa/${company.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir como cliente
                    </a>
                  </Button>
                </div>

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
                        <Badge variant={cat.active ? "default" : "secondary"} className="text-[10px]">
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
                          addCatalog({ id: Math.random().toString(36).substring(2, 10), name: newCatalogName.trim(), active: true, paints: [] });
                          setNewCatalogName("");
                          toast.success("Catálogo criado!");
                        }
                      }}
                    />
                    <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => {
                      if (newCatalogName.trim()) {
                        addCatalog({ id: Math.random().toString(36).substring(2, 10), name: newCatalogName.trim(), active: true, paints: [] });
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
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                      <FileUp className="w-3.5 h-3.5" /> Importar CSV
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
                      <FileDown className="w-3.5 h-3.5" /> Exportar
                    </Button>
                    <Button size="sm" className="gap-1.5" onClick={handleAddPaint} style={{ backgroundColor: company.primaryColor }}>
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
                      <Button className="mt-4 gap-2" onClick={handleAddPaint} style={{ backgroundColor: company.primaryColor }}>
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
                      <Input value={company.name} onChange={(e) => updateCompany({ name: e.target.value })} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Slug (URL)</Label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 bg-muted/50 border border-border rounded-md text-xs text-muted-foreground shrink-0">
                          /empresa/
                        </div>
                        <Input
                          value={company.slug}
                          onChange={(e) => updateCompany({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                          className="h-11 font-mono text-sm"
                          placeholder="minha-loja"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cores */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Cor Primária", key: "primaryColor" as const, value: company.primaryColor },
                      { label: "Cor Secundária", key: "secondaryColor" as const, value: company.secondaryColor },
                    ].map(({ label, key, value }) => (
                      <div key={key} className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
                        <div className="flex gap-2">
                          <div className="relative w-11 h-11 shrink-0">
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => updateCompany({ [key]: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-full h-full rounded-lg border-2 border-border shadow-sm" style={{ backgroundColor: value }} />
                          </div>
                          <Input
                            value={value}
                            onChange={(e) => updateCompany({ [key]: e.target.value })}
                            className="h-11 font-mono text-sm uppercase"
                          />
                        </div>
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
                        <div className="relative w-20 h-20 mx-auto">
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
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive w-full" onClick={() => updateCompany({ logo: undefined })}>
                        <X className="w-3.5 h-3.5 mr-1" /> Remover logo
                      </Button>
                    )}
                  </div>

                  <Button onClick={handleSaveBranding} disabled={isSaving} className="w-full h-11" style={{ backgroundColor: company.primaryColor }}>
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
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${company.primaryColor}, ${company.secondaryColor})` }} />
                  <div className="p-3 border-b border-border flex items-center justify-between bg-card">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden" style={{ backgroundColor: company.logo ? "transparent" : company.primaryColor }}>
                        {company.logo ? <img src={company.logo} alt="Logo" className="w-full h-full object-contain" /> : <Palette className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs font-bold text-foreground">{company.name}</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500" title="Ativo" />
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
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">URL Pública</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs font-mono text-foreground truncate">
                      {window.location.origin}/empresa/{company.slug || "–"}
                    </div>
                    <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={copyPublicLink}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
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
    </div>
  );
};

export default Dashboard;
