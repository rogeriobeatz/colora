import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Palette, Plus, Eye, EyeOff, Search, LogOut, Loader2, Settings, LayoutDashboard, Store, User
} from "lucide-react";
import { Paint } from "@/data/defaultColors";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    company, updateCompany, addCatalog, updateCatalog,
    addPaint, updatePaint, initCompany,
  } = useStore();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCatalogName, setNewCatalogName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;

        if (data) {
          setUserProfile(data);
          // Inicializa a empresa no StoreContext se ainda não estiver lá
          if (!company || company.id !== user.id) {
            initCompany(data.company_name || (data.user_type === 'company' ? "Minha Loja" : "Meu Espaço"));
            updateCompany({ 
              id: user.id, 
              name: data.company_name, 
              slug: data.company_slug,
              primaryColor: data.primary_color,
              secondaryColor: data.secondary_color
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        toast.error("Não foi possível carregar seus dados.");
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
        <p className="text-sm text-muted-foreground animate-pulse">Preparando seu ambiente...</p>
      </div>
    );
  }

  if (!user) return null;

  const isCompany = userProfile?.user_type === 'company';

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada com sucesso");
    navigate("/");
  };

  const handleSaveProfile = async () => {
    if (!user || !company) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          company_name: company.name,
          company_slug: company.slug,
          primary_color: company.primaryColor,
          secondary_color: company.secondaryColor,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Configurações salvas!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const activeCatalog = company?.catalogs.find((c) => c.id === selectedCatalog) || company?.catalogs[0];
  const filteredPaints = activeCatalog?.paints.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const categories = [...new Set(activeCatalog?.paints.map((p) => p.category) || [])];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Palette className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground hidden sm:block">Colora</span>
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {isCompany ? <Store className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {isCompany ? "Loja" : "Cliente"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCompany && (
              <Button variant="outline" size="sm" asChild className="hidden md:flex">
                <Link to={`/empresa/${company?.slug}`} className="gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Ver Loja
                </Link>
              </Button>
            )}
            <Button size="sm" asChild className="shadow-soft">
              <Link to="/simulator" className="gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Abrir Simulador
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-10">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Olá, {userProfile?.company_name || "usuário"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {isCompany 
              ? "Gerencie seus catálogos de tintas e personalize a experiência dos seus clientes." 
              : "Explore cores, salve suas combinações e visualize seu ambiente renovado."}
          </p>
        </div>

        <Tabs defaultValue="catalogs" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="catalogs" className="gap-2 rounded-lg">
              <LayoutDashboard className="w-4 h-4" /> Cores e Catálogos
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 rounded-lg">
              <Settings className="w-4 h-4" /> Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalogs" className="animate-fade-in">
            <div className="grid lg:grid-cols-[280px_1fr] gap-8">
              {/* Catalog Sidebar */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Seus Catálogos</h3>
                {isCompany && (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nome do catálogo..."
                      value={newCatalogName}
                      onChange={(e) => setNewCatalogName(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => {
                      if (newCatalogName.trim()) {
                        addCatalog({ id: Math.random().toString(36).substring(2, 10), name: newCatalogName.trim(), active: true, paints: [] });
                        setNewCatalogName("");
                        toast.success("Catálogo criado!");
                      }
                    }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  {company?.catalogs.map((cat) => (
                    <button
                      key={cat.id}
                      className={`w-full p-4 rounded-xl border text-left transition-all group ${
                        (activeCatalog?.id === cat.id) 
                          ? "border-primary bg-primary/5 shadow-soft" 
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedCatalog(cat.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold text-sm ${activeCatalog?.id === cat.id ? "text-primary" : "text-foreground"}`}>
                          {cat.name}
                        </span>
                        {isCompany && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                updateCatalog(cat.id, { active: !cat.active }); 
                              }}
                              className="p-1 hover:bg-primary/10 rounded"
                            >
                              {cat.active ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {cat.paints.length} cores disponíveis
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paints Grid */}
              {activeCatalog && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, código ou categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                    {isCompany && (
                      <Button className="shadow-soft gap-2">
                        <Plus className="w-4 h-4" /> Adicionar Tinta
                      </Button>
                    )}
                  </div>

                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <div key={cat} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{cat}</h3>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                          {filteredPaints.filter(p => p.category === cat).map((paint) => (
                            <div key={paint.id} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-elevated transition-all duration-300">
                              <div className="h-20 w-full relative" style={{ backgroundColor: paint.hex }}>
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="p-3">
                                <p className="text-xs font-bold text-foreground truncate">{paint.name}</p>
                                <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{paint.code}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
                      <Palette className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                      <p className="text-muted-foreground font-medium">Nenhuma tinta encontrada neste catálogo.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="animate-fade-in">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card rounded-3xl border border-border p-8 shadow-soft space-y-6">
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground mb-1">
                    {isCompany ? "Identidade da Loja" : "Seu Perfil"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isCompany ? "Como sua loja aparece para os clientes." : "Suas informações básicas de acesso."}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {isCompany ? "Nome Comercial" : "Nome Completo"}
                    </Label>
                    <Input 
                      value={company?.name} 
                      onChange={(e) => updateCompany({ name: e.target.value })} 
                      className="h-11"
                    />
                  </div>
                  
                  {isCompany && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Link Personalizado (Slug)
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="px-3 h-11 rounded-lg bg-muted flex items-center text-xs font-medium text-muted-foreground border border-border">
                          colora.app/empresa/
                        </div>
                        <Input 
                          value={company?.slug} 
                          onChange={(e) => updateCompany({ slug: e.target.value })} 
                          className="h-11"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full md:w-auto shadow-soft">
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              </div>

              {isCompany && (
                <div className="bg-card rounded-3xl border border-border p-8 shadow-soft space-y-6">
                  <div>
                    <h2 className="text-xl font-display font-bold text-foreground mb-1">Cores da Marca</h2>
                    <p className="text-sm text-muted-foreground">Personalize o simulador com as cores da sua loja.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cor Primária</Label>
                      <div className="flex gap-2">
                        <div className="w-11 h-11 rounded-lg border border-border shrink-0" style={{ backgroundColor: company?.primaryColor }} />
                        <Input 
                          value={company?.primaryColor} 
                          onChange={(e) => updateCompany({ primaryColor: e.target.value })} 
                          className="h-11 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <div className="w-11 h-11 rounded-lg border border-border shrink-0" style={{ backgroundColor: company?.secondaryColor }} />
                        <Input 
                          value={company?.secondaryColor} 
                          onChange={(e) => updateCompany({ secondaryColor: e.target.value })} 
                          className="h-11 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      <strong>Dica:</strong> Estas cores serão aplicadas no cabeçalho e nos botões do seu link exclusivo de simulação.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;