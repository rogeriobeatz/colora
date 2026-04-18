import { useState, useMemo } from "react";
import { Search, Palette, Loader2, Check, Sparkles, ChevronUp, ChevronDown, Box } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paint, Catalog } from "@/data/defaultColors";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ColorPanelProps {
  catalogs: Catalog[];
  selectedPaint: Paint | null;
  onSelectPaint: (paint: Paint) => void;
  onApplyColor: (provider?: 'kie' | 'replicate', event?: React.MouseEvent<HTMLButtonElement>) => void;
  canApply: boolean;
  isPainting: boolean;
  selectedWallLabel?: string;
  primaryColor?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const PaintSample = ({ paint, isSelected, onClick }: { paint: Paint, isSelected: boolean, onClick: () => void }) => {
  const isLight = isLightColor(paint.hex);
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 border-2 text-left group",
        isSelected 
          ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm" 
          : "border-transparent bg-slate-50 hover:bg-white hover:border-slate-200"
      )}
    >
      <div 
        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full shrink-0 shadow-inner flex items-center justify-center border border-black/5"
        style={{ backgroundColor: paint.hex }}
      >
        {isSelected && (
          <Check className={cn("w-4 h-4 stroke-[3]", isLight ? "text-black/70" : "text-white/70")} />
        )}
      </div>
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className={cn(
          "text-xs sm:text-sm font-bold leading-tight truncate",
          isSelected ? "text-primary" : "text-foreground"
        )}>
          {paint.name}
        </span>
        <span className="text-[9px] sm:text-[11px] text-muted-foreground font-bold leading-none opacity-50 uppercase tracking-tighter">
          {paint.code}
        </span>
      </div>
    </button>
  );
};

const ColorPanel = ({
  catalogs,
  selectedPaint,
  onSelectPaint,
  onApplyColor,
  canApply,
  isPainting,
  selectedWallLabel,
  primaryColor,
  isExpanded: isExpandedProp,
  onToggleExpand,
}: ColorPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCatalogId, setActiveCatalogId] = useState<string | null>(null);
  const [isExpandedLocal, setIsExpandedLocal] = useState(true);
  const isMobile = useIsMobile();

  const isExpanded = isExpandedProp !== undefined ? isExpandedProp : isExpandedLocal;
  
  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setIsExpandedLocal(!isExpandedLocal);
    }
  };

  const activeCatalogs = useMemo(() => catalogs.filter((c) => c.active), [catalogs]);
  const currentCatalog = useMemo(() => 
    activeCatalogs.find((c) => c.id === activeCatalogId) || activeCatalogs[0],
    [activeCatalogs, activeCatalogId]
  );

  const filteredPaints = useMemo(() => {
    if (!currentCatalog) return [];
    const term = searchTerm.toLowerCase();
    return currentCatalog.paints.filter(
      (p) => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term) || p.hex.toLowerCase().includes(term)
    );
  }, [currentCatalog, searchTerm]);

  const categories = useMemo(() => [...new Set(filteredPaints.map((p) => p.category))], [filteredPaints]);

  const catalogSelector = (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {activeCatalogs.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setActiveCatalogId(cat.id)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
            currentCatalog?.id === cat.id 
              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
              : "bg-white text-muted-foreground border-border hover:bg-slate-50"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );

  const colorsContent = (
    <div className="p-4 sm:p-6 space-y-8 pb-24">
      {categories.map(cat => (
        <div key={cat} className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] px-1">{cat}</p>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {filteredPaints.filter(p => p.category === cat).map(paint => (
              <PaintSample 
                key={paint.id} 
                paint={paint} 
                isSelected={selectedPaint?.id === paint.id} 
                onClick={() => onSelectPaint(paint)} 
              />
            ))}
          </div>
        </div>
      ))}
      {filteredPaints.length === 0 && (
        <div className="py-20 text-center opacity-20 flex flex-col items-center">
          <Palette className="w-12 h-12 mb-3" />
          <p className="text-[11px] font-black uppercase tracking-[0.3em]">Nenhuma cor encontrada</p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className={cn(
        "fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border shadow-[0_-8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 ease-in-out pb-safe",
        isExpanded ? "h-[75vh]" : "h-20"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between border-b border-border/40 shrink-0 bg-white" onClick={handleToggle}>
            <div className="flex items-center gap-3">
              {!selectedWallLabel ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20">1</div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Passo 1</p>
                    <p className="text-xs font-bold text-foreground truncate">Selecione uma parede</p>
                  </div>
                </div>
              ) : !selectedPaint ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20 animate-pulse">2</div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Passo 2</p>
                    <p className="text-xs font-bold text-foreground truncate">Escolha a cor para {selectedWallLabel}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 animate-in slide-in-from-left duration-300">
                  <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md shrink-0 flex items-center justify-center" style={{ backgroundColor: selectedPaint.hex }}>
                     <Check className={cn("w-4 h-4", isLightColor(selectedPaint.hex) ? "text-black/40" : "text-white/50")} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-foreground truncate uppercase tracking-tight">{selectedPaint.name}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Box className="w-3 h-3 text-primary" /> {selectedWallLabel}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2.5">
              {selectedPaint && selectedWallLabel && (
                <Button 
                  size="sm" 
                  className="h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg animate-in zoom-in duration-300 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!canApply || isPainting}
                  onClick={(e) => { e.stopPropagation(); onApplyColor(); }}
                >
                  {isPainting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pintar Agora"}
                </Button>
              )}
              {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground/40" /> : <ChevronUp className="w-5 h-5 text-muted-foreground/40" />}
            </div>
          </div>

          <div className={cn("flex-1 flex flex-col overflow-hidden transition-opacity duration-300", isExpanded ? "opacity-100" : "opacity-0 pointer-events-none")}>
            <div className="p-3 border-b border-border/40 bg-slate-50/50 space-y-3">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-1">Selecione o Catálogo</p>
               {catalogSelector}
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                  <Input 
                    placeholder="Buscar por nome ou código..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="h-10 pl-10 rounded-xl border-border/60 text-xs bg-white shadow-inner"
                  />
               </div>
            </div>
            <ScrollArea className="flex-1 bg-white">
              {colorsContent}
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-soft flex flex-col h-[750px] overflow-hidden transition-all duration-500">
      <div className="p-6 border-b border-border/40 bg-slate-50/30 shrink-0">
        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-2">
          <Palette className="w-4 h-4" /> Seletor de Cores
        </div>
        <h3 className="text-xl font-black text-foreground leading-tight tracking-tight">Catálogo de Tintas</h3>
      </div>

      <div className="p-4 border-b border-border/40 bg-white shrink-0">
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3 px-1">Selecione o Catálogo</p>
        {catalogSelector}
      </div>

      <div className="p-5 border-b border-border/40 shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
          <Input
            placeholder="Buscar por nome, código ou hex..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pl-11 rounded-xl bg-slate-50/50 border-border/60 focus:ring-primary/5 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 bg-white">
        {colorsContent}
      </ScrollArea>

      <div className="p-5 border-t border-border/40 bg-white shrink-0 space-y-4">
        {selectedPaint ? (
          <>
            <div className="flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="w-12 h-12 rounded-xl border-2 border-white shadow-md shrink-0" style={{ backgroundColor: selectedPaint.hex }} />
              <div className="min-w-0">
                <p className="text-xs font-black text-foreground truncate uppercase">{selectedPaint.name}</p>
                <p className="text-[10px] text-muted-foreground font-bold">{selectedPaint.code} · {selectedPaint.hex.toUpperCase()}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {selectedWallLabel && (
                <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-slate-50 p-2 rounded-lg border border-border/40">
                  <Box className="w-3 h-3" /> Aplicar em: <span className="font-black text-primary">{selectedWallLabel}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1 h-12 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!canApply || isPainting}
                  onClick={(e) => onApplyColor('kie', e)}
                >
                  {isPainting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> KIE.ai
                    </>
                  )}
                </Button>
                <Button
                  className="flex-1 h-12 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                  disabled={!canApply || isPainting}
                  onClick={(e) => onApplyColor('replicate', e)}
                >
                  {isPainting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Replicate ⚡
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center text-center opacity-30">
             <Palette className="w-8 h-8 mb-2" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aguardando seleção</p>
          </div>
        )}
      </div>
    </div>
  );
};

function isLightColor(hex: string): boolean {
  const cleanHex = hex.replace('#', '');
  let r, g, b;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 150;
}

export default ColorPanel;
