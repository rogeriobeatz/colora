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
  LayoutGrid,
  Image
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
  logoInputRef: React.RefObject<HTMLInputElement>;
  handleAddCatalog: () => void;
  handleDeleteCatalog: (id: string) => void;
  handleEditCatalog: (id: string) => void;
  handleToggleCatalog: (id: string, active: boolean) => void;
  handleImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportCSV: () => void;
  handleAddPaint: () => void;
  handleEditPaint: (paint: Paint) => void;
  handleDeletePaint: (paintId: string) => void;
  handleUploadLogo: (e: React.ChangeEvent<HTMLInputElement>, catalogId: string) => void;
  paintDialogOpen: boolean;
  setPaintDialogOpen: (open: boolean) => void;
  editingPaint: Paint | null;
  handleSavePaint: (paint: Partial<Paint>) => void;
  isSavingPaint: boolean;
}

const PaintCard = ({ paint, onEdit, onDelete, disabled }: { paint: Paint, onEdit: (p: Paint) => void, onDelete: (id: string) => void, disabled?: boolean }) => {
  return (
    <div className={cn(
      "relative group bg-white rounded-xl border border-border/30 overflow-hidden transition-all duration-200",
      disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
    )}>
      {/* Preview da Cor */}
      <div className="h-24 w-full relative" style={{ backgroundColor: paint.hex }}>
        {/* Gradiente Sutil */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
        
        {/* Badge de Acabamento */}
        <div className="absolute top-2 right-2">
          <span className="text-[9px] px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-slate-700 font-bold uppercase tracking-wider shadow-sm border border-white/20">
            {paint.finish || 'Fosco'}
          </span>
        </div>

        {/* Ações Visíveis */}
        {!disabled && (
          <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="h-7 w-7 rounded-lg bg-white/90 backdrop-blur-sm border border-white/20 shadow-sm flex items-center justify-center hover:bg-primary hover:text-white transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(paint);
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button 
              className="h-7 w-7 rounded-lg bg-white/90 backdrop-blur-sm border border-white/20 shadow-sm flex items-center justify-center hover:bg-destructive hover:text-white transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(paint.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="p-3 space-y-2">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground leading-tight">{paint.name}</h4>
          <div className="flex items-center justify-between">
            <code className="text-xs font-mono text-muted-foreground bg-slate-50 px-2 py-1 rounded">{paint.hex}</code>
            {paint.category && (
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{paint.category}</span>
            )}
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
  logoInputRef,
  handleAddCatalog,
  handleDeleteCatalog,
  handleEditCatalog,
  handleToggleCatalog,
  handleImportCSV,
  handleExportCSV,
  handleAddPaint,
  handleEditPaint,
  handleDeletePaint,
  handleUploadLogo,
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
        <div className="space-y-8">
          {/* Seção de Catálogos */}
          <div className="bg-white rounded-2xl border border-border/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Seus Catálogos</h3>
              <Badge variant="secondary" className="text-xs">
                {company?.catalogs?.length || 0} coleções
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...(company?.catalogs || [])]
                .sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1))
                .map((catalog: any) => (
                <div key={catalog.id} className={cn(
                  "relative group border rounded-xl p-4 transition-all cursor-pointer",
                  selectedCatalogId === catalog.id
                    ? "border-primary/30 bg-primary/5 shadow-lg"
                    : "border-border/30 hover:border-primary/20 hover:shadow-md",
                  !catalog.active && "opacity-60 grayscale"
                )}>
                  <div onClick={() => setSelectedCatalogId(catalog.id)}>
                    {/* Header do Catálogo */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Logo ou Icone */}
                        {catalog.logo_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border/20 flex items-center justify-center bg-white">
                            <img 
                              src={catalog.logo_url} 
                              alt={catalog.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-muted-foreground">
                              <Box className="w-5 h-5" />
                            </div>
                          </div>
                        ) : (
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                            selectedCatalogId === catalog.id ? "bg-primary text-primary-foreground" : "bg-slate-100 text-muted-foreground"
                          )}>
                            <Box className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h4 className={cn(
                            "font-bold text-sm",
                            selectedCatalogId === catalog.id ? "text-primary" : "text-foreground"
                          )}>
                            {catalog.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {catalog.paints?.length || 0} cores
                          </p>
                        </div>
                      </div>
                      
                      {/* Switch */}
                      <Switch
                        checked={catalog.active}
                        onCheckedChange={(checked) => {
                          handleToggleCatalog(catalog.id, checked);
                        }}
                        className="scale-90"
                      />
                    </div>
                    
                    {/* Ações */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <input 
                        type="file" 
                        ref={(el) => {
                          if (logoInputRef.current) {
                            logoInputRef.current.setAttribute('data-catalog-id', catalog.id);
                          }
                        }}
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => {
                          e.stopPropagation();
                          handleUploadLogo(e, catalog.id);
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          const fileInput = document.querySelector(`input[data-catalog-id="${catalog.id}"]`) as HTMLInputElement;
                          fileInput?.click();
                        }}
                        disabled={catalog.id === '00000000-0000-0000-0000-000000000001'}
                      >
                        <Image className="w-3 h-3 mr-1" /> Logo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCatalog(catalog.id);
                        }}
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs hover:border-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCatalog(catalog.id);
                        }}
                        disabled={catalog.id === '00000000-0000-0000-0000-000000000001'}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção de Cores */}
          <div className="space-y-8">
            {activeCatalog ? (
              <>
                {/* Header do Catálogo Ativo */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{activeCatalog.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {activeCatalog.paints?.length || 0} cores disponíveis
                        </p>
                      </div>
                    </div>
                    
                    {/* Ações Principais */}
                    <div className="flex flex-wrap items-center gap-3">
                      <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={!activeCatalog.active}
                        className="h-10 px-4 rounded-xl font-medium"
                      >
                        <FileUp className="w-4 h-4 mr-2" /> Importar CSV
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleExportCSV} 
                        disabled={!activeCatalog.active}
                        className="h-10 px-4 rounded-xl font-medium"
                      >
                        <FileDown className="w-4 h-4 mr-2" /> Exportar
                      </Button>
                      <Button 
                        onClick={handleAddPaint} 
                        disabled={!activeCatalog.active}
                        className="h-10 px-4 rounded-xl font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Nova Cor
                      </Button>
                    </div>
                  </div>
                  
                  {/* Instruções de Importação */}
                  <div className="mt-4 p-3 bg-white/50 rounded-lg border border-white/20">
                    <p className="text-xs text-muted-foreground">
                      <strong>Formato CSV:</strong> nome,hex,acabamento,categoria (ex: "Branco Gelo,#FFFFFF,Fosco,Parede")
                    </p>
                  </div>
                </div>

                {/* Barra de Pesquisa */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar cores por nome, código hexadecimal ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 pl-12 pr-4 rounded-xl bg-white border-border/30 focus:ring-primary/10 focus:border-primary/30 text-sm"
                  />
                </div>

                {/* Grid de Cores */}
                <div className="space-y-8">
                  {filteredPaints.length > 0 ? (
                    <>
                      {/* Filtros por Categoria */}
                      {categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {categories.map((cat) => {
                            const catPaints = filteredPaints.filter((p) => p.category === cat);
                            if (catPaints.length === 0) return null;
                            return (
                              <Badge 
                                key={cat} 
                                variant="outline" 
                                className="text-xs px-3 py-1 rounded-full"
                              >
                                {cat} ({catPaints.length})
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Grid de Cores */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {filteredPaints.map((paint) => (
                          <PaintCard 
                            key={paint.id} 
                            paint={paint} 
                            onEdit={handleEditPaint} 
                            onDelete={handleDeletePaint} 
                            disabled={!activeCatalog.active} 
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-16 text-center border-2 border-dashed border-border/30 rounded-2xl bg-slate-50/30">
                      <div className="space-y-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                          <Search className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-foreground">Nenhuma cor encontrada</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {searchTerm ? 'Tente uma outra busca' : 'Adicione cores ao catálogo para começar'}
                          </p>
                        </div>
                        {!searchTerm && (
                          <Button onClick={handleAddPaint} className="mt-2">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar Primeira Cor
                          </Button>
                        )}
                      </div>
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
