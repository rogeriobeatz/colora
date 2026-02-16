import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Paint } from "@/data/defaultColors";
import {
  Palette, Upload, Image, ArrowLeft, Search, FileDown, Loader2, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Simulation {
  id: string;
  imageUrl: string;
  paint: Paint;
  element: string;
}

const ELEMENTS = ["Parede", "Teto", "Porta", "Moldura", "Rodapé"];

const Simulator = ({ companySlug }: { companySlug?: string }) => {
  const { company } = useStore();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState("Parede");
  const [selectedPaint, setSelectedPaint] = useState<Paint | null>(null);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sliderPos, setSliderPos] = useState(50);
  const [activeCatalogId, setActiveCatalogId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const activeCatalogs = company?.catalogs.filter((c) => c.active) || [];
  const currentCatalog = activeCatalogs.find((c) => c.id === activeCatalogId) || activeCatalogs[0];
  const filteredPaints = currentCatalog?.paints.filter(
    (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  const categories = [...new Set(filteredPaints.map((p) => p.category))];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleApplyColor = () => {
    if (!uploadedImage || !selectedPaint) return;
    setIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      setSimulations((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 10),
          imageUrl: uploadedImage,
          paint: selectedPaint,
          element: selectedElement,
        },
      ]);
      setIsProcessing(false);
      toast.success(`${selectedPaint.name} aplicada na ${selectedElement.toLowerCase()}!`);
    }, 2000);
  };

  const handleSlider = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  const handleGeneratePDF = () => {
    toast.success("PDF gerado com sucesso! (Funcionalidade demo)");
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Nenhuma empresa configurada</p>
          <Button asChild><Link to="/dashboard">Configurar Empresa</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to={companySlug ? `/empresa/${companySlug}` : "/dashboard"} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <span className="font-display font-semibold text-foreground text-sm">Simulador de Ambientes</span>
          </div>
          <div className="flex items-center gap-2">
            {simulations.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="gap-1.5">
                <FileDown className="w-3.5 h-3.5" /> Gerar PDF
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Area */}
          <div className="space-y-6">
            {/* Upload / Preview */}
            {!uploadedImage ? (
              <div
                className="bg-card border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center py-20 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium mb-1">Envie a foto do ambiente</p>
                <p className="text-sm text-muted-foreground">JPG, PNG ou WEBP até 10MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Before/After Slider */}
                <div
                  ref={sliderRef}
                  className="relative rounded-2xl overflow-hidden bg-card border border-border cursor-col-resize select-none"
                  onMouseMove={(e) => e.buttons === 1 && handleSlider(e)}
                  onTouchMove={handleSlider}
                  onClick={handleSlider}
                >
                  {/* "After" - with color overlay */}
                  <div className="relative">
                    <img src={uploadedImage} alt="Ambiente" className="w-full h-auto" />
                    {simulations.length > 0 && (
                      <div
                        className="absolute inset-0 mix-blend-multiply opacity-30"
                        style={{ backgroundColor: simulations[simulations.length - 1].paint.hex }}
                      />
                    )}
                  </div>
                  {/* "Before" - original clipped */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img src={uploadedImage} alt="Original" className="w-full h-auto" style={{ minWidth: sliderRef.current?.offsetWidth || "100%" }} />
                  </div>
                  {/* Slider line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-card z-10"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card shadow-elevated flex items-center justify-center">
                      <div className="flex gap-0.5">
                        <ChevronLeft className="w-3 h-3 text-foreground" />
                        <ChevronRight className="w-3 h-3 text-foreground" />
                      </div>
                    </div>
                  </div>
                  {/* Labels */}
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-foreground/70 text-primary-foreground text-xs font-medium">
                    Antes
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-foreground/70 text-primary-foreground text-xs font-medium">
                    Depois
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setUploadedImage(null); setSimulations([]); }}>
                    <X className="w-3.5 h-3.5 mr-1.5" /> Nova foto
                  </Button>
                </div>

                {/* Element Selection */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Elemento</p>
                  <div className="flex flex-wrap gap-2">
                    {ELEMENTS.map((el) => (
                      <button
                        key={el}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedElement === el
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                        onClick={() => setSelectedElement(el)}
                      >
                        {el}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Simulations Cards */}
            {simulations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Cores Aplicadas</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {simulations.map((sim) => (
                    <div key={sim.id} className="bg-card rounded-xl border border-border overflow-hidden">
                      <div className="h-10 w-full" style={{ backgroundColor: sim.paint.hex }} />
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-foreground">{sim.paint.name}</p>
                        <p className="text-[10px] text-muted-foreground">{sim.element} · {sim.paint.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Color Panel */}
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

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">{cat}</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {filteredPaints
                      .filter((p) => p.category === cat)
                      .map((paint) => (
                        <button
                          key={paint.id}
                          className={`group relative w-full aspect-square rounded-lg border-2 transition-all ${
                            selectedPaint?.id === paint.id ? "border-foreground scale-110 shadow-soft" : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: paint.hex }}
                          onClick={() => setSelectedPaint(paint)}
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
                  <div className="w-10 h-10 rounded-lg border border-border" style={{ backgroundColor: selectedPaint.hex }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedPaint.name}</p>
                    <p className="text-[10px] text-muted-foreground">{selectedPaint.code} · {selectedPaint.hex}</p>
                  </div>
                </div>
                <Button
                  className="w-full mt-3"
                  size="sm"
                  disabled={!uploadedImage || isProcessing}
                  onClick={handleApplyColor}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processando...
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
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card rounded-2xl p-8 text-center shadow-elevated">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="font-display font-semibold text-foreground">Aplicando cor com IA...</p>
            <p className="text-sm text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulator;
