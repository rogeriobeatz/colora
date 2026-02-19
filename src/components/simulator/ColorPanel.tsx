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
        p.hex.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [currentCatalog, searchTerm]);

  const categories = useMemo(() => {
    return [...new Set(filteredPaints.map((p) => p.category))];
  }, [filteredPaints]);

  const handleSelectPaint = (paint: Paint) => {
    onSelectPaint(paint);
  };

  const brandPrimary = primaryColor;

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
        <p className="text-xs text-muted-foreground mt-1">Selecione uma cor para aplicar na superfície</p>
      </div>

      {/* Catalog Tabs */}
      {activeCatalogs.length > 1 && (
        <div className="p-3 border-b border-border bg-muted/20">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {activeCatalogs.map((cat) => (
              <button
                key={cat.id}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  currentCatalog?.id === cat.id ? "text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={{
                  backgroundColor: currentCatalog?.id === cat.id ? primaryColor : undefined,
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
                <span className="ml-1 text-muted-foreground/60">({filteredPaints.filter((p) => p.category === cat).length})</span>
              </p>
              <div className="grid grid-cols-5 gap-2">
                {filteredPaints
                  .filter((p) => p.category === cat)
                  .map((paint) => {
                    const isSelected = selectedPaint?.id === paint.id;
                    const isLight = isLightColor(paint.hex);

                    // 1) Destaque sempre alinhado com a identidade da loja: usa primaryColor (se existir)
                    const selectedBorderColor = brandPrimary || paint.hex;

                    // 2) Se o primaryColor tiver pouco contraste com a cor do swatch, adiciona um “anel auxiliar”
                    // (preto/branco) para manter a seleção visível e acessível.
                    const ratio = brandPrimary ? contrastRatio(brandPrimary, paint.hex) : 999;
                    const needsAssistRing = isSelected && brandPrimary ? ratio < 2.2 : false;
                    const assistRingColor = isLight ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.92)";

                    const selectionShadow = isSelected
                      ? needsAssistRing
                        ? `0 0 0 2px ${assistRingColor}, 0 0 0 5px ${selectedBorderColor}`
                        : `0 0 0 5px ${selectedBorderColor}`
                      : undefined;

                    return (
                      <button
                        key={paint.id}
                        className={`group relative w-full aspect-square rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${
                          isSelected ? "scale-110 shadow-lg z-10" : "border-border hover:border-muted-foreground"
                        }`}
                        style={{
                          backgroundColor: paint.hex,
                          borderColor: isSelected ? selectedBorderColor : undefined,
                          boxShadow: selectionShadow,
                        }}
                        onClick={() => handleSelectPaint(paint)}
                        title={`${paint.name} - ${paint.hex}`}
                      >
                        {isSelected && (
                          <div className={`absolute inset-0 flex items-center justify-center ${isLight ? "text-black" : "text-white"}`}>
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
            <div className="w-14 h-14 rounded-xl border-2 border-white shadow-md flex-shrink-0" style={{ backgroundColor: selectedPaint.hex }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{selectedPaint.name}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {selectedPaint.code} · {selectedPaint.hex}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{selectedPaint.category}</p>
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
              opacity: canApply ? 1 : 0.5,
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
  const c = normalizeHex(hex);
  const rgb = parseInt(c.substring(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 150;
}

function normalizeHex(hex: string): string {
  const h = (hex || "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(h)) return h;
  if (/^#[0-9A-Fa-f]{3}$/.test(h)) {
    const r = h[1];
    const g = h[2];
    const b = h[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#000000";
}

function hexToRgb01(hex: string) {
  const h = normalizeHex(hex).substring(1);
  const num = parseInt(h, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

// WCAG relative luminance
function relLuminance(hex: string) {
  const { r, g, b } = hexToRgb01(hex);
  const t = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * t(r) + 0.7152 * t(g) + 0.0722 * t(b);
}

// WCAG contrast ratio
function contrastRatio(hexA: string, hexB: string) {
  const L1 = relLuminance(hexA);
  const L2 = relLuminance(hexB);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export default ColorPanel;