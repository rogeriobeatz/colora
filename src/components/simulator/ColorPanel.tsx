import { useState, useMemo } from "react";
import { Search, Palette, Loader2, Check, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paint, Catalog } from "@/data/defaultColors";

interface ColorPanelProps {
  catalogs: Catalog[];
  selectedPaint: Paint | null;
  onSelectPaint: (paint: Paint) => void;
  onApplyColor: () => void;
  canApply: boolean;
  isPainting: boolean;
  selectedWallLabel?: string;
  primaryColor?: string;
}

const ColorPanel = ({
  catalogs,
  selectedPaint,
  onSelectPaint,
  onApplyColor,
  canApply,
  isPainting,
  selectedWallLabel,
  primaryColor,
}: ColorPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCatalogId, setActiveCatalogId] = useState<string | null>(null);

  const activeCatalogs = catalogs.filter((c) => c.active);
  const currentCatalog = activeCatalogs.find((c) => c.id === activeCatalogId) || activeCatalogs[0];
  
  const filteredPaints = useMemo(() => {
    if (!currentCatalog) return [];
    return currentCatalog.paints.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.hex.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentCatalog, searchTerm]);

  const categories = useMemo(() => {
    return [...new Set(filteredPaints.map((p) => p.category))];
  }, [filteredPaints]);

  const handleSelectPaint = (paint: Paint) => {
    onSelectPaint(paint);
  };

  return (
    <div 
      className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden"
      style={{ borderTop: `3px solid ${primaryColor}` }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Palette className="w-5 h-5" style={{ color: primaryColor }} />
          Catálogo de Cores
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Selecione uma cor para aplicar na superfície
        </p>
      </div>

      {/* Catalog Tabs */}
      {activeCatalogs.length > 1 && (
        <div className="p-3 border-b border-border bg-muted/20">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {activeCatalogs.map((cat) => (
              <button
                key={cat.id}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  currentCatalog?.id === cat.id
                    ? "text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={{ 
                  backgroundColor: currentCatalog?.id === cat.id ? primaryColor : undefined 
                }}
                onClick={() => setActiveCatalogId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cor, código ou hex..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 text-sm bg-muted/30"
          />
        </div>
      </div>

      {/* Cores */}
      <ScrollArea className="h-[400px]">
        <div className="p-3 space-y-5">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold mb-2.5 px-1">
                {cat}
                <span className="ml-1 text-muted-foreground/60">
                  ({filteredPaints.filter(p => p.category === cat).length})
                </span>
              </p>
              <div className="grid grid-cols-5 gap-2">
                {filteredPaints
                  .filter((p) => p.category === cat)
                  .map((paint) => {
                    const isSelected = selectedPaint?.id === paint.id;
                    const isLight = isLightColor(paint.hex);
                    
                    return (
                      <button
                        key={paint.id}
                        className={`group relative w-full aspect-square rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${
                          isSelected
                            ? "border-foreground scale-110 shadow-lg z-10 ring-2 ring-offset-2"
                            : "border-border hover:border-muted-foreground"
                        }`}
                        style={{ 
                          backgroundColor: paint.hex,
                          borderColor: isSelected ? paint.hex : undefined,
                          outline: isSelected ? `2px solid ${primaryColor}` : undefined,
                          outlineOffset: isSelected ? "2px" : undefined,
                        }}
                        onClick={() => handleSelectPaint(paint)}
                        title={`${paint.name} - ${paint.hex}`}
                      >
                        {isSelected && (
                          <div className={`absolute inset-0 flex items-center justify-center ${
                            isLight ? 'text-black' : 'text-white'
                          }`}>
                            <Check className="w-4 h-4 font-bold" />
                          </div>
                        )}
                        {/* Hover tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          {paint.name}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
          
          {filteredPaints.length === 0 && (
            <div className="py-8 text-center">
              <Palette className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma cor encontrada</p>
              <p className="text-xs text-muted-foreground/60">Tente buscar por outro termo</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Selected Paint Preview & Apply */}
      {selectedPaint && (
        <div className="p-4 border-t border-border bg-muted/20 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-xl border-2 border-white shadow-md flex-shrink-0"
              style={{ backgroundColor: selectedPaint.hex }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{selectedPaint.name}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {selectedPaint.code} · {selectedPaint.hex}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {selectedPaint.category}
              </p>
            </div>
          </div>
          
          {selectedWallLabel && (
            <div className="flex items-center gap-2 text-xs bg-card p-2 rounded-lg border border-border mb-4">
              <span className="text-muted-foreground">Aplicar em:</span>
              <span className="font-bold text-foreground">{selectedWallLabel}</span>
            </div>
          )}

          <Button
            className="w-full h-12 font-bold text-sm shadow-sm gap-2"
            disabled={!canApply || isPainting}
            onClick={onApplyColor}
            style={{ 
              backgroundColor: canApply && !isPainting ? primaryColor : undefined,
              opacity: canApply ? 1 : 0.5
            }}
          >
            {isPainting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Aplicar Cor
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

// Helper para determinar se uma cor é clara
function isLightColor(hex: string): boolean {
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 150;
}

export default ColorPanel;