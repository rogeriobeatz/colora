import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Palette, Building2, Plus, Trash2, Edit2, Download, Upload, Eye, EyeOff, Search, LogOut, Loader2, User
} from "lucide-react";
import { Catalog, Paint } from "@/data/defaultColors";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    company, setCompany, updateCompany, addCatalog, updateCatalog, deleteCatalog,
    addPaint, updatePaint, deletePaint, importPaintsCSV, exportPaintsCSV, initCompany,
  } = useStore();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPaint, setEditingPaint] = useState<Paint | null>(null);
  const [paintForm, setPaintForm] = useState({ name: "", code: "", hex: "#000000", rgb: "", cmyk: "", category: "" });
  const [newCatalogName, setNewCatalogName] = useState("");
  const [showPaintDialog, setShowPaintDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          setUserProfile(data);
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
      }
    };
    loadProfile();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isCompany = userProfile?.user_type === 'company';

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
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
      toast.success("Dados salvos!");
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

  const handleSavePaint = () => {
    if (!activeCatalog) return;
    if (editingPaint) {
      updatePaint(activeCatalog.id, editingPaint.id, paintForm);
      toast.success("Tinta atualizada!");
    } else {
      addPaint(activeCatalog.id, {
        id: Math.random().toString(36).substring(2, 10),
        ...paintForm,
      });
      toast.success("Tinta adicionada!");
    }
    setShowPaintDialog(false);
    setEditingPaint(null);
    setPaintForm({ name: "", code: "", hex: "#000000", rgb: "", cmyk: "", category: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <Palette className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Colora</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">
              {isCompany ? "Painel da Loja" : "Meu Espaço"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isCompany && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/empresa/${company?.slug}`} className="gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Ver Loja
                </Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link to="/simulator" className="gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Simulador
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">
            Olá, {userProfile?.company_name || "usuário"}!
          </h1>
          <p className="text-muted-foreground">
            {isCompany 
              ? "Gerencie seus catálogos de tintas e configurações da loja." 
              : "Explore cores e salve suas combinações favoritas."}
          </p>
        </div>

        <Tabs defaultValue="catalogs">
          <TabsList className="mb-6">
            <TabsTrigger value="catalogs">Cores e Catálogos</TabsTrigger>
            <TabsTrigger value="profile">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="catalogs">
            <div className="grid lg:grid-cols-[280px_1fr] gap-6">
              {/* Catalog Sidebar */}
              <div className="space-y-3">
                {isCompany && (
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      placeholder="Novo catálogo..."
                      value={newCatalogName}
                      onChange={(e) => setNewCatalogName(e.target.value)}
                    />
                    <Button size="icon" variant="outline" onClick={() => {
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
                
                {company?.catalogs.map((cat) => (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      (activeCatalog?.id === cat.id) ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                    }`}
                    onClick={() => setSelectedCatalog(cat.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">{cat.name}</span>
                      {isCompany && (
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); updateCatalog(cat.id, { active: !cat.active }); }}>
                            {cat.active ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{cat.paints.length} cores</span>
                  </div>
                ))}
              </div>

              {/* Paints Grid */}
              {activeCatalog && (
                <div>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar cor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {isCompany && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowPaintDialog(true)}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Nova Tinta
                        </Button>
                      </div>
                    )}
                  </div>

                  {categories.map((cat) => (
                    <div key={cat} className="mb-6">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{cat}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {filteredPaints.filter(p => p.category === cat).map((paint) => (
                          <div key={paint.id} className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-soft transition-all">
                            <div className="h-16 w-full" style={{ backgroundColor: paint.hex }} />
                            <div className="p-2.5">
                              <p className="text-xs font-semibold text-foreground truncate">{paint.name}</p>
                              <p className="text-[10px] text-muted-foreground">{paint.code}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="bg-card rounded-xl border border-border p-6 max-w-lg">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                {isCompany ? "Dados da Loja" : "Meu Perfil"}
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>{isCompany ? "Nome da Loja" : "Meu Nome"}</Label>
                  <Input value={company?.name} onChange={(e) => updateCompany({ name: e.target.value })} />
                </div>
                {isCompany && (
                  <div>
                    <Label>Slug da Loja (URL)</Label>
                    <Input value={company?.slug} onChange={(e) => updateCompany({ slug: e.target.value })} />
                  </div>
                )}
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;