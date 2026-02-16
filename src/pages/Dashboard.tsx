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
  Palette, Building2, Plus, Trash2, Edit2, Download, Upload, Eye, EyeOff, Search, LogOut, Loader2
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

  const [companyName, setCompanyName] = useState("");
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

  // Load profile from Supabase if logged in
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          // If we have a profile, update the store
          // Note: In a real app, we'd sync the whole company object with Supabase
          // For now, we'll just ensure the company name and slug match
          if (!company || company.id !== user.id) {
            initCompany(data.company_name || "Minha Loja");
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
      toast.success("Dados salvos no servidor!");
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

  const handleExport = () => {
    if (!activeCatalog) return;
    const csv = exportPaintsCSV(activeCatalog.id);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeCatalog.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const handleImport = () => {
    if (!activeCatalog) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          importPaintsCSV(activeCatalog.id, ev.target?.result as string);
          toast.success("Tintas importadas!");
        };
        reader.readAsText(file);
      }
    };
    input.click();
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
            <span className="text-sm font-medium text-foreground">{company?.name || "Dashboard"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={company ? `/empresa/${company.slug}` : "#"} className="gap-1.5">
                <Eye className="w-3.5 h-3.5" /> White-label
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/simulator" className="gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Simulador
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs defaultValue="catalogs">
          <TabsList className="mb-6">
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="catalogs">Catálogos</TabsTrigger>
          </TabsList>

          {/* Company Tab */}
          <TabsContent value="company">
            <div className="bg-card rounded-xl border border-border p-6 max-w-lg">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">Dados da Empresa</h2>
              {company && (
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={company.name} onChange={(e) => updateCompany({ name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Slug (URL)</Label>
                    <Input value={company.slug} onChange={(e) => updateCompany({ slug: e.target.value })} />
                    <p className="text-xs text-muted-foreground mt-1">
                      Acesse em: /empresa/{company.slug}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cor Primária</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={company.primaryColor}
                          onChange={(e) => updateCompany({ primaryColor: e.target.value })}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                        />
                        <Input value={company.primaryColor} onChange={(e) => updateCompany({ primaryColor: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Cor Secundária</Label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={company.secondaryColor}
                          onChange={(e) => updateCompany({ secondaryColor: e.target.value })}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                        />
                        <Input value={company.secondaryColor} onChange={(e) => updateCompany({ secondaryColor: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Catalogs Tab */}
          <TabsContent value="catalogs">
            <div className="grid lg:grid-cols-[280px_1fr] gap-6">
              {/* Catalog Sidebar */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Novo catálogo..."
                    value={newCatalogName}
                    onChange={(e) => setNewCatalogName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCatalogName.trim()) {
                        addCatalog({ id: Math.random().toString(36).substring(2, 10), name: newCatalogName.trim(), active: true, paints: [] });
                        setNewCatalogName("");
                        toast.success("Catálogo criado!");
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      if (newCatalogName.trim()) {
                        addCatalog({ id: Math.random().toString(36).substring(2, 10), name: newCatalogName.trim(), active: true, paints: [] });
                        setNewCatalogName("");
                        toast.success("Catálogo criado!");
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); updateCatalog(cat.id, { active: !cat.active }); }}
                          className="p-1 rounded hover:bg-muted"
                        >
                          {cat.active ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCatalog(cat.id); toast.success("Catálogo removido!"); }}
                          className="p-1 rounded hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={cat.active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                        {cat.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{cat.paints.length} cores</span>
                    </div>
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
                        placeholder="Buscar tinta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleImport} className="gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> Importar
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Exportar
                      </Button>
                      <Dialog open={showPaintDialog} onOpenChange={setShowPaintDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1.5" onClick={() => {
                            setEditingPaint(null);
                            setPaintForm({ name: "", code: "", hex: "#000000", rgb: "", cmyk: "", category: "" });
                          }}>
                            <Plus className="w-3.5 h-3.5" /> Nova Tinta
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editingPaint ? "Editar Tinta" : "Nova Tinta"}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 mt-2">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Nome</Label>
                                <Input value={paintForm.name} onChange={(e) => setPaintForm({ ...paintForm, name: e.target.value })} />
                              </div>
                              <div>
                                <Label>Código</Label>
                                <Input value={paintForm.code} onChange={(e) => setPaintForm({ ...paintForm, code: e.target.value })} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>HEX</Label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={paintForm.hex}
                                    onChange={(e) => setPaintForm({ ...paintForm, hex: e.target.value })}
                                    className="w-10 h-10 rounded border border-border cursor-pointer"
                                  />
                                  <Input value={paintForm.hex} onChange={(e) => setPaintForm({ ...paintForm, hex: e.target.value })} />
                                </div>
                              </div>
                              <div>
                                <Label>Categoria</Label>
                                <Input value={paintForm.category} onChange={(e) => setPaintForm({ ...paintForm, category: e.target.value })} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>RGB</Label>
                                <Input value={paintForm.rgb} onChange={(e) => setPaintForm({ ...paintForm, rgb: e.target.value })} placeholder="255, 255, 255" />
                              </div>
                              <div>
                                <Label>CMYK</Label>
                                <Input value={paintForm.cmyk} onChange={(e) => setPaintForm({ ...paintForm, cmyk: e.target.value })} placeholder="0, 0, 0, 0" />
                              </div>
                            </div>
                            <Button onClick={handleSavePaint} className="w-full" disabled={!paintForm.name || !paintForm.hex}>
                              {editingPaint ? "Salvar" : "Adicionar"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Category groups */}
                  {categories.map((cat) => {
                    const catPaints = filteredPaints.filter((p) => p.category === cat);
                    if (catPaints.length === 0) return null;
                    return (
                      <div key={cat} className="mb-6">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{cat}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {catPaints.map((paint) => (
                            <div
                              key={paint.id}
                              className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-soft transition-all"
                            >
                              <div className="h-16 w-full" style={{ backgroundColor: paint.hex }} />
                              <div className="p-2.5">
                                <p className="text-xs font-semibold text-foreground truncate">{paint.name}</p>
                                <p className="text-[10px] text-muted-foreground">{paint.code} · {paint.hex}</p>
                                <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    className="p-1 rounded hover:bg-muted"
                                    onClick={() => {
                                      setEditingPaint(paint);
                                      setPaintForm(paint);
                                      setShowPaintDialog(true);
                                    }}
                                  >
                                    <Edit2 className="w-3 h-3 text-muted-foreground" />
                                  </button>
                                  <button
                                    className="p-1 rounded hover:bg-destructive/10"
                                    onClick={() => { deletePaint(activeCatalog.id, paint.id); toast.success("Tinta removida!"); }}
                                  >
                                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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