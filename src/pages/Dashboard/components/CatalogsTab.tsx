import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileUp, FileDown, Pencil, X, Trash2, Palette, Search } from "lucide-react";
import PaintDialog from "@/components/simulator/PaintDialog";
import { Paint } from "@/data/defaultColors";
import { useAccessibleStyles } from "@/hooks/useAccessibleStyles";

interface CatalogsTabProps {
  company: any;
  selectedCatalogId: string | null;
  setSelectedCatalogId: (id: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  newCatalogName: string;
  setNewCatalogName: (name: string) => void;
  editingCatalogId: string | null;
  editingCatalogName: string;
  paintDialogOpen: boolean;
  editingPaint: Paint | null;
  isSavingPaint: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  activeCatalog: any;
  filteredPaints: Paint[];
  categories: string[];
  
  // Handlers
  handleAddCatalog: () => void;
  handleDeleteCatalog: (id: string) => void;
  handleEditCatalog: (id: string) => void;
  handleSaveCatalog: () => void;
  handleImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportCSV: () => void;
  handleAddPaint: () => void;
  handleEditPaint: (paint: Paint) => void;
  handleSavePaint: (paint: Partial<Paint>) => void;
  handleDeletePaint: (paintId: string) => void;
  setEditingCatalogId: (id: string | null) => void;
  setEditingCatalogName: (name: string) => void;
  setPaintDialogOpen: (open: boolean) => void;
}

export const CatalogsTab = ({
  company,
  selectedCatalogId,
  setSelectedCatalogId,
  searchTerm,
  setSearchTerm,
  newCatalogName,
  setNewCatalogName,
  editingCatalogId,
  editingCatalogName,
  paintDialogOpen,
  editingPaint,
  isSavingPaint,
  fileInputRef,
  activeCatalog,
  filteredPaints,
  categories,
  
  // Handlers
  handleAddCatalog,
  handleDeleteCatalog,
  handleEditCatalog,
  handleSaveCatalog,
  handleImportCSV,
  handleExportCSV,
  handleAddPaint,
  handleEditPaint,
  handleSavePaint,
  handleDeletePaint,
  setEditingCatalogId,
  setEditingCatalogName,
  setPaintDialogOpen
}: CatalogsTabProps) => {
  const accessibleStyles = useAccessibleStyles();

  return (
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
          {company?.catalogs?.map((catalog: any) => (
            <div
              key={catalog.id}
              className={`bg-card rounded-xl border p-4 transition-all ${
                selectedCatalogId === catalog.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
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
                        ✓
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCatalogId(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedCatalogId(catalog.id)}
                        className="text-left flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{catalog.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            catalog.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {catalog.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {catalog.paints?.length || 0} cores
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
                          className="text-destructive hover:text-destructive"
                        >
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
                  {activeCatalog.paints?.length || 0} cores
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
          </>
        )}
      </div>

      {/* Dialog de cores */}
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
