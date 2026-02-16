import { useState } from "react";
import { Search, Palette, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const filteredPaints = currentCatalog?.paints.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  const categories = [...new Set(filteredPaints.map((p) => p.category))];

  return (
    <div className="bg-card rounded-2xl border border-border p-4 h-fit lg:sticky lg:top-20 shadow-soft">
      <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        Catálogo de Cores
      </h3>

      {/* Catalog Tabs */}
      {activeCatalogs.length > 1 && (
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {activeCatalogs.map((cat) => (
            <button
              key={cat.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                currentCatalog?.id === cat.id
                  ? "text-white shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              style={{ backgroundColor: currentCatalog?.id === cat.id ? (primaryColor || 'hsl(var(--primary))') : undefined }}
              onClick={() => setActiveCatalogId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar cor ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-10 text-sm bg-muted/30 border-none focus-visible:ring-1"
        />
      </div>

      <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold mb-2.5 px-1">
              {cat}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {filteredPaints
                .filter((p) => p.category === cat)
                .map((paint) => (
                  <button
                    key={paint.id}
                    className={`group relative w-full aspect-square rounded-lg border-2 transition-all ${
                      selectedPaint?.id === paint.id
                        ? "border-foreground scale-110 shadow-elevated z-10"
                        : "border-transparent hover:scale-105 hover:shadow-soft"
                    }`}
                    style={{ backgroundColor: paint.hex }}
                    onClick={() => onSelectPaint(paint)}
                    title={`${paint.name} (${paint.hex})`}
                  >
                    {selectedPaint?.id === paint.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                      </div>
                    )}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Paint Info */}
      {selectedPaint && (
        <div className="mt-6 p-4 rounded-2xl bg-muted/50 border border-border animate-fade-in">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl border border-white shadow-soft flex-shrink-0"
              style={{ backgroundColor: selectedPaint.hex }}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{selectedPaint.name}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {selectedPaint.code} · {selectedPaint.hex}
              </p>
            </div>
          </div>
          
          {selectedWallLabel && (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground bg-white/50 py-1 px-2 rounded-md w-fit">
              <span className="font-bold text-foreground">Aplicar em:</span>
              <span>{selectedWallLabel}</span>
            </div>
          )}

          <Button
            className="w-full mt-4 shadow-soft font-bold"
            size="default"
            disabled={!canApply || isPainting}
            onClick={onApplyColor}
            style={{ backgroundColor: canApply && !isPainting ? (primaryColor || 'hsl(var(--primary))') : undefined }}
          >
            {isPainting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Pintando...
              </>
            ) : (
              <>
                <Palette className="w-4 h-4 mr-2" /> Aplicar Cor
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ColorPanel;