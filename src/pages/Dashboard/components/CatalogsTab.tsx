import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  FileUp, 
  FileDown, 
  Pencil, 
  Trash2, 
  Palette, 
  Search,
  Layers,
  ChevronRight,
  CheckCircle2,
  Box,
  LayoutGrid
} from "lucide-react";
import PaintDialog from "@/components/simulator/PaintDialog";
import { Paint } from "@/data/defaultColors";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface CatalogsTabProps {
  company: any;
  selectedCatalogId: string | null;
  setSelectedCatalogId: (id: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  newCatalogName?: string;
  setNewCatalogName?: (name: string) => void;
  editingCatalogId?: string | null;
  editingCatalogName?: string;
  setEditingCatalogId?: (id: string | null) => void;
  setEditingCatalogName?: (name: string) => void;
  handleSaveCatalog?: () => void;
  activeCatalog: any;
  filteredPaints: Paint[];
  categories: string[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleAddCatalog: () => void;
  handleDeleteCatalog: (id: string) => void;
  handleEditCatalog: (id: string) => void;
  handleToggleCatalog: (id: string, active: boolean) => void;
  handleImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportCSV: () => void;
  handleAddPaint: () => void;
  handleEditPaint: (paint: Paint) => void;
  handleDeletePaint: (paintId: string) => void;
  paintDialogOpen: boolean;
  setPaintDialogOpen: (open: boolean) => void;
  editingPaint: Paint | null;
  handleSavePaint: (paint: Partial<Paint>) => void;
  isSavingPaint: boolean;
}

const PaintCard = ({ paint, onEdit, onDelete, disabled }: { paint: Paint, onEdit: (p: Paint) => void, onDelete: (id: string) => void, disabled?: boolean }) => {
  return (
    <div className="group relative">
      <div className={cn("bg-white rounded-xl border border-border/50 overflow-hidden transition-all duration-150 shadow-sm", disabled ? "opacity-50" : "hover:border-primary/40")}>
        <div className="h-20 w-full" style={{ backgroundColor: paint.hex }} />
        <div className="p-2.5">
          <p className="text-[10px] font-bold text-foreground truncate">{paint.name}</p>
          <p className="text-[9px] font-mono text-muted-foreground uppercase">{paint.hex}</p>
        </div>
      </div>

      <div className={cn("absolute -inset-4 z-50 transition-all duration-150 ease-out scale-95", disabled ? "opacity-0 pointer-events-none" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto")}>
        <div className="bg-card rounded-2xl shadow-2xl border border-primary/20 overflow-hidden w-[240px]">
          <div className="h-32 w-full relative" style={{ backgroundColor: paint.hex }}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex justify-between">
            <Button size="icon" variant="secondary" className="h-6 w-6 rounded-lg bg-white/90 backdrop-blur-sm border border-white/20 shadow-sm" onClick={() => onEdit(paint)} disabled={disabled}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button size="icon" variant="destructive" className="h-6 w-6 rounded-lg bg-white/90 backdrop-blur-sm border border-white/20 shadow-sm" onClick={() => onDelete(paint.id)} disabled={disabled}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="space-y-1 text-center bg-slate-50 p-2 rounded-xl border border-border/40">
            <span className="text-[8px] font-bold text-muted-foreground uppercase">RGB</span>
            <p className="text-[10px] font-mono font-black">{paint.rgb || '---'}</p>
          </div>
          <div className="flex gap-2 pt-2 border-t border-border/40">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px] font-bold rounded-lg" onClick={() => onEdit(paint)} disabled={disabled}>
              Editar
            </Button>
            <Button size="sm" variant="destructive" className="h-8 w-8 rounded-lg p-0" onClick={() => onDelete(paint.id)} disabled={disabled}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CatalogsTab = ({
  company,
  selectedCatalogId,
  setSelectedCatalogId,
  searchTerm,
  setSearchTerm,
  newCatalogName = "",
  setNewCatalogName = () => {},
  editingCatalogId = null,
  editingCatalogName = "",
  setEditingCatalogId = () => {},
  setEditingCatalogName = () => {},
  handleSaveCatalog = () => {},
  activeCatalog,
  filteredPaints,
  categories,
  fileInputRef,
  handleAddCatalog,
  handleDeleteCatalog,
  handleEditCatalog,
  handleToggleCatalog,
  handleImportCSV,
  handleExportCSV,
  handleAddPaint,
  handleEditPaint,
  handleDeletePaint,
  paintDialogOpen,
  setPaintDialogOpen,
  editingPaint,
  handleSavePaint,
  isSavingPaint
}: CatalogsTabProps) => {
  const [newCatalogDialogOpen, setNewCatalogDialogOpen] = useState(false);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* ── HEADER UNIVERSAL ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Layers className="w-3.5 h-3.5" /> Gestão de Produtos
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Catálogos de Cores</h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-lg">
            Organize suas coleções e mantenha seu inventário sempre atualizado.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button onClick={() => setNewCatalogDialogOpen(true)} className="h-11 px-6 rounded-xl font-bold text-sm shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Novo Catálogo
          </Button>
        </div>
      </div>

      {company?.catalogs?.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Sidebar de Catálogos */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Suas Coleções</h3>
            <div className="space-y-1">
              {company?.catalogs?.map((catalog: any) => (
                <div key={catalog.id} className="group relative">
                  <button
                    onClick={() => setSelectedCatalogId(catalog.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all border text-left",
                      selectedCatalogId === catalog.id
                        ? "bg-white border-primary/20 shadow-sm ring-1 ring-primary/10"
                        : "bg-transparent border-transparent hover:bg-slate-100/50"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors", selectedCatalogId === catalog.id ? "bg-primary text-primary-foreground" : "bg-slate-100 text-muted-foreground")}>
                      <Box className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{catalog.name}</span>
                        <span className="text-[9px] font-medium text-muted-foreground uppercase">{catalog.paints?.length || 0} Cores</span>
                      </div>
                    </div>
                    <Switch
                      checked={catalog.active}
                      onCheckedChange={(checked) => {
                        console.log('Switch clicked:', catalog.id, checked);
                        handleToggleCatalog(catalog.id, checked);
                      }}
                      className="scale-75"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Grid de Cores */}
          <div className="flex-1 w-full space-y-10">
            {activeCatalog ? (
              <>
                <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", !activeCatalog.active && "opacity-50")}>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={cn("w-5 h-5", activeCatalog.active ? "text-primary" : "text-muted-foreground")} />
                    <h3 className="text-lg font-bold text-foreground">{activeCatalog.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5" onClick={() => fileInputRef.current?.click()} disabled={!activeCatalog.active}>
                      <FileUp className="w-3.5 h-3.5 mr-1.5" /> Importar CSV
                    </Button>
                    <div className="h-4 w-px bg-border/60" />
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" onClick={handleExportCSV} disabled={!activeCatalog.active}>Exportar</Button>
                    <div className="h-4 w-px bg-border/60" />
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-primary" onClick={handleAddPaint} disabled={!activeCatalog.active}>Add Cor</Button>
                  </div>
                </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                <Input
                  placeholder="Pesquisar por nome ou hexadecimal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 pl-11 rounded-xl bg-white border-border/60 focus:ring-primary/5 text-sm"
                />
              </div>

              <div className="space-y-10">
                {categories.length > 0 ? (
                  categories.map((cat) => {
                    const catPaints = filteredPaints.filter((p) => p.category === cat);
                    if (catPaints.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{cat}</h3>
                          <div className="h-px flex-1 bg-border/40" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                          {catPaints.map((paint) => (
                            <PaintCard key={paint.id} paint={paint} onEdit={handleEditPaint} onDelete={handleDeletePaint} disabled={!activeCatalog.active} />
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-[2rem] bg-slate-50/50">
                    <p className="text-sm text-muted-foreground font-medium">Catálogo vazio.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
               <Layers className="w-10 h-10" />
               <p className="text-xs font-bold uppercase tracking-widest">Selecione uma coleção para gerenciar</p>
            </div>
          )}
        </div>
        </div>
      ) : (
        <div className="py-24 text-center border-2 border-dashed border-border/40 rounded-[2.5rem] bg-slate-50/50 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">Nenhum catálogo encontrado</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Crie seu primeiro catálogo para começar a cadastrar suas cores de tinta.
            </p>
          </div>
          <Button onClick={() => setNewCatalogDialogOpen(true)} className="rounded-xl font-bold">
            Criar Primeiro Catálogo
          </Button>
        </div>
      )}

      <PaintDialog open={paintDialogOpen} onOpenChange={setPaintDialogOpen} paint={editingPaint} onSave={handleSavePaint} isSaving={isSavingPaint} />

      {/* DIALOG: NOVO CATÁLOGO */}
      <Dialog open={newCatalogDialogOpen} onOpenChange={setNewCatalogDialogOpen}>
        <DialogContent className="rounded-[2rem] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Novo Catálogo</DialogTitle>
            <DialogDescription className="text-xs">Dê um nome para sua nova coleção de cores.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="catalogName" className="text-[10px] font-bold uppercase tracking-widest ml-1">Nome da Coleção</Label>
              <Input 
                id="catalogName"
                placeholder="Ex: Coleção Verão 2024"
                value={newCatalogName}
                onChange={(e) => setNewCatalogName(e.target.value)}
                className="h-12 rounded-xl"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-11" onClick={() => setNewCatalogDialogOpen(false)}>Cancelar</Button>
            <Button 
              className="rounded-xl h-11 px-8 font-bold" 
              onClick={() => {
                handleAddCatalog();
                setNewCatalogDialogOpen(false);
              }}
            >
              Criar Catálogo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: EDITAR CATÁLOGO */}
      <Dialog open={!!editingCatalogId} onOpenChange={(open) => !open && setEditingCatalogId(null)}>
        <DialogContent className="rounded-[2rem] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Editar Catálogo</DialogTitle>
            <DialogDescription className="text-xs">Altere o nome da sua coleção.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCatalogName" className="text-[10px] font-bold uppercase tracking-widest ml-1">Nome da Coleção</Label>
              <Input 
                id="editCatalogName"
                value={editingCatalogName}
                onChange={(e) => setEditingCatalogName(e.target.value)}
                className="h-12 rounded-xl"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-11" onClick={() => setEditingCatalogId(null)}>Cancelar</Button>
            <Button 
              className="rounded-xl h-11 px-8 font-bold" 
              onClick={() => {
                handleSaveCatalog();
                setEditingCatalogId(null);
              }}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
