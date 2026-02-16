import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Palette, Plus, Eye, EyeOff, Search, LogOut, Loader2, Settings, LayoutDashboard, 
  Store, FileUp, FileDown, Trash2, Image as ImageIcon, Globe, Check
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  company_name: string | null;
  company_slug: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  updated_at: string | null;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    company, updateCompany, addCatalog, updateCatalog, deleteCatalog,
    importPaintsCSV, exportPaintsCSV, initCompany,
  } = useStore();

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCatalogName, setNewCatalogName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        // Tenta buscar o perfil
        const { data, error } = await (supabase.from('profiles') as any)
          .select('*')
          .eq('id', user.id)
          .single();
        
        // Se houver dados, inicializa com eles
        if (data) {
          const profile = data as Profile;
          setUserProfile(profile);
          initCompany(profile.company_name || "Minha Loja");
          updateCompany({ 
            id: user.id, 
            name: profile.company_name || "Minha Loja", 
            slug: profile.company_slug || "minha-loja",
            primaryColor: profile.primary_color || "#1a8a6a",
            secondaryColor: profile.secondary_color || "#e87040"
          });
        } else {
          // Se não houver perfil no banco, usa os metadados do cadastro
          const meta = user.user_metadata;
          const fallbackName = meta?.company_name || "Minha Loja";
          initCompany(fallbackName);
          updateCompany({
            id: user.id,
            name: fallbackName,
            slug: meta?.company_slug || "minha-loja",
            primaryColor: "#1a8a6a",
            secondaryColor: "#e87040"
          });
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        // Fallback em caso de erro de rede/banco
        initCompany("Minha Loja");
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (authLoading || isInitialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
          <Palette className="w-6 h-6 text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Carregando painel administrativo...</p>
      </div>
    );
  }

  // Se ainda não tiver empresa (estado do context), mostra um botão de inicialização manual
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

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      const { error } = await (supabase.from('profiles') as any)
        .upsert({
          id: user.id,
          company_name: company.name,
          company_slug: company.slug,
          primary_color: company.primaryColor,
          secondary_color: company.secondaryColor,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Identidade visual atualizada!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCatalogId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      importPaintsCSV(selectedCatalogId, text);
      toast.success("Tintas importadas com sucesso!");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportCSV = () => {
    if (!selectedCatalogId) return;
    const csv = exportPaintsCSV(selectedCatalogId);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `catalogo-${selectedCatalogId}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activeCatalog = company.catalogs.find((c) => c.id === (selectedCatalogId || company.catalogs[0].id)) || company.catalogs[0];
  
  const filteredPaints = activeCatalog.paints.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(activeCatalog.paints.map((p) => p.category))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: company.primaryColor }}>
              <Palette className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">{company.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="hidden md:flex">
              <Link to={`/empresa/${company.slug}`} target="_blank" className="gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Ver Simulador Público
              </Link>
            </Button>
            <Button size="sm" asChild style={{ backgroundColor: company.primaryColor }}>
              <Link to="/simulator" className="gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Abrir Simulador
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="catalogs" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="catalogs" className="gap-2 rounded-lg">
              <LayoutDashboard className="w-4 h-4" /> Catálogos de Cores
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2 rounded-lg">
              <Settings className="w-4 h-4" /> Identidade Visual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalogs" className="animate-fade-in space-y-6">
            <div className="grid lg:grid-cols-[300px_1fr] gap-8">
              {/* Sidebar: Catalogs List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Meus Catálogos</h3>
                </div>
                
                <div className="space-y-2">
                  {company.catalogs.map((cat, index) => (
                    <button
                      key={cat.id}
                      className={`w-full p-4 rounded-xl border text-left transition-all group relative ${
                        activeCatalog.id === cat.id 
                          ? "border-primary bg-primary/5 shadow-soft" 
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedCatalogId(cat.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold text-sm ${activeCatalog.id === cat.id ? "text-primary" : "text-foreground"}`}>
                          {cat.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateCatalog(cat.id, { active: !cat.active }); }}
                            className="p-1 hover:bg-primary/10 rounded"
                            title={cat.active ? "Visível no simulador" : "Oculto no simulador"}
                          >
                            {cat.active ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>
                          {index !== 0 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteCatalog(cat.id); }}
                              className="p-1 hover:bg-destructive/10 rounded text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {cat.paints.length} cores · {index === 0 ? "Catálogo Base" : "Personalizado"}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-border">
                  <Label className="text-xs font-bold text-muted-foreground mb-2 block">Novo Catálogo</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nome..." 
                      value={newCatalogName} 
                      onChange={(e) => setNewCatalogName(e.target.value)}
                      className="h-9 text-sm"
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

              {/* Main: Paints Management */}
              <div className="space-y-6">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-display font-bold text-foreground">{activeCatalog.name}</h2>
                      <p className="text-sm text-muted-foreground">Gerencie as cores disponíveis para seus clientes.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                        <FileUp className="w-3.5 h-3.5" /> Importar CSV
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
                        <FileDown className="w-3.5 h-3.5" /> Exportar
                      </Button>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                    </div>
                  </div>

                  <div className="relative mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou código da cor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>

                  <div className="space-y-8">
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <div key={cat} className="space-y-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{cat}</h3>
                            <div className="h-px flex-1 bg-border" />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredPaints.filter(p => p.category === cat).map((paint) => (
                              <div key={paint.id} className="group bg-background rounded-xl border border-border overflow-hidden hover:shadow-soft transition-all">
                                <div className="h-16 w-full" style={{ backgroundColor: paint.hex }} />
                                <div className="p-2.5">
                                  <p className="text-[11px] font-bold text-foreground truncate">{paint.name}</p>
                                  <p className="text-[9px] font-medium text-muted-foreground">{paint.code}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
                        <Palette className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                        <p className="text-muted-foreground font-medium">Este catálogo está vazio.</p>
                        <p className="text-xs text-muted-foreground mt-1">Importe um arquivo CSV para adicionar cores em massa.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="animate-fade-in">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Branding Settings */}
              <div className="bg-card rounded-3xl border border-border p-8 shadow-soft space-y-8">
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground mb-1">Identidade da Marca</h2>
                  <p className="text-sm text-muted-foreground">Personalize como sua loja aparece para os clientes.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome da Loja</Label>
                    <Input 
                      value={company.name} 
                      onChange={(e) => updateCompany({ name: e.target.value })} 
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link do Simulador</Label>
                    <div className="flex items-center gap-2">
                      <div className="px-3 h-12 rounded-lg bg-muted flex items-center text-xs font-medium text-muted-foreground border border-border">
                        colora.app/empresa/
                      </div>
                      <Input 
                        value={company.slug} 
                        onChange={(e) => updateCompany({ slug: e.target.value })} 
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cor Primária</Label>
                      <div className="flex gap-2">
                        <div className="w-12 h-12 rounded-lg border border-border shrink-0" style={{ backgroundColor: company.primaryColor }} />
                        <Input 
                          value={company.primaryColor} 
                          onChange={(e) => updateCompany({ primaryColor: e.target.value })} 
                          className="h-12 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <div className="w-12 h-12 rounded-lg border border-border shrink-0" style={{ backgroundColor: company.secondaryColor }} />
                        <Input 
                          value={company.secondaryColor} 
                          onChange={(e) => updateCompany({ secondaryColor: e.target.value })} 
                          className="h-12 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Logotipo</Label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                      <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Clique para fazer upload do logo (PNG ou SVG)</p>
                    </div>
                  </div>

                  <Button onClick={handleSaveBranding} disabled={isSaving} className="w-full h-12 shadow-soft" style={{ backgroundColor: company.primaryColor }}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Salvar Alterações
                  </Button>
                </div>
              </div>

              {/* Preview Card */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Prévia do White-label</h3>
                <div className="bg-background rounded-3xl border border-border shadow-elevated overflow-hidden">
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${company.primaryColor}, ${company.secondaryColor})` }} />
                  <div className="p-4 border-b border-border flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: company.primaryColor }}>
                        <Palette className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-bold">{company.name}</span>
                    </div>
                    <div className="w-20 h-6 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div className="h-10 rounded-lg" style={{ backgroundColor: company.primaryColor }} />
                      <div className="h-10 rounded-lg border border-border" />
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-xs text-primary font-medium leading-relaxed">
                    <strong>Dica:</strong> O link público permite que seus clientes usem o simulador sem precisar de login, vendo apenas as cores que você ativar.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;