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
}

const ColorPanel = ({
  catalogs,
  selectedPaint,
  onSelectPaint,
  onApplyColor,
  canApply,
  isPainting,
  selectedWallLabel,
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
    <div className="bg-card rounded-2xl border border-border p-4 h-fit lg:sticky lg:top-20">
      <h3 className="font-display font-semibold text-foreground mb-3">Catálogo de Cores</h3>

      {/* Catalog Tabs */}
      {activeCatalogs.length > 1 && (
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          {activeCatalogs.map((cat) => (
            <button
              key={cat.id}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                currentCatalog?.id === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
              onClick={() => setActiveCatalogId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar cor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              {cat}
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {filteredPaints
                .filter((p) => p.category === cat)
                .map((paint) => (
                  <button
                    key={paint.id}
                    className={`group relative w-full aspect-square rounded-lg border-2 transition-all ${
                      selectedPaint?.id === paint.id
                        ? "border-foreground scale-110 shadow-soft"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: paint.hex }}
                    onClick={() => onSelectPaint(paint)}
                    title={`${paint.name} (${paint.hex})`}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Paint Info */}
      {selectedPaint && (
        <div className="mt-4 p-3 rounded-xl bg-muted border border-border">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
              style={{ backgroundColor: selectedPaint.hex }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{selectedPaint.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {selectedPaint.code} · {selectedPaint.hex}
              </p>
            </div>
          </div>
          {selectedWallLabel && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Aplicar em: <span className="font-semibold text-foreground">{selectedWallLabel}</span>
            </p>
          )}
          <Button
            className="w-full mt-3"
            size="sm"
            disabled={!canApply || isPainting}
            onClick={onApplyColor}
          >
            {isPainting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Pintando...
              </>
            ) : (
              <>
                <Palette className="w-3.5 h-3.5 mr-1.5" /> Aplicar Cor
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ColorPanel;
