import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Palette, Loader2, ImagePlus, Sparkles } from "lucide-react";

import SimulatorHeader from "@/components/simulator/SimulatorHeader";
import UploadArea from "@/components/simulator/UploadArea";
import RoomGallery from "@/components/simulator/RoomGallery";
import ImageViewer from "@/components/simulator/ImageViewer";
import ColorPanel from "@/components/simulator/ColorPanel";
import SimulationCards from "@/components/simulator/SimulationCards";
import { useSimulator } from "@/components/simulator/useSimulator";

const Simulator = ({ companySlug }: { companySlug?: string }) => {
  const { company } = useStore();
  const {
    rooms,
    activeRoom,
    activeRoomId,
    selectedWallId,
    selectedPaint,
    isPainting,
    totalSimulations,
    addRoom,
    selectRoom,
    selectWall,
    setSelectedPaint,
    applyColor,
    removeSimulation,
    retryAnalysis,
  } = useSimulator();

  const handleGeneratePDF = () => {
    toast.success("Funcionalidade em desenvolvimento", {
      description: "O PDF será disponibilizado em breve",
    });
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedWall = activeRoom?.walls.find((w) => w.id === selectedWallId);

  return (
    <div className="min-h-screen bg-background">
      {/* Barra de Destaque Superior */}
      <div 
        className="h-1.5 w-full sticky top-0 z-[60]" 
        style={{ background: `linear-gradient(90deg, ${company.primaryColor}, ${company.secondaryColor})` }} 
      />
      
      <SimulatorHeader
        company={company}
        companySlug={companySlug}
        hasSimulations={totalSimulations > 0}
        onGeneratePDF={handleGeneratePDF}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Estado inicial: sem ambiente */}
        {!activeRoom ? (
          <div className="animate-fade-in">
            <div className="text-center mb-8 max-w-xl mx-auto">
              <div 
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${company.primaryColor}15` }}
              >
                <Palette className="w-8 h-8" style={{ color: company.primaryColor }} />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-3">
                Simulador de Ambientes
              </h1>
              <p className="text-muted-foreground text-lg">
                Transforme qualquer ambiente com as cores da{' '}
                <span className="font-bold" style={{ color: company.primaryColor }}>
                  {company.name}
                </span>
                . 
                É rápido, fácil e o resultado é impressionante!
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <UploadArea onUpload={(file) => addRoom(file)} />
            </div>

            {/* Depoimentos / Como funciona */}
            <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              {[
                { 
                  icon: ImagePlus, 
                  title: "1. Envie a Foto", 
                  desc: "Fotografe qualquer ambiente interno" 
                },
                { 
                  icon: Palette, 
                  title: "2. Escolha a Cor", 
                  desc: "Selecione entre dezenas de cores" 
                },
                { 
                  icon: Sparkles, 
                  title: "3. See o Resultado", 
                  desc: "IA aplica a cor com realismo" 
                },
              ].map((step, i) => (
                <div 
                  key={i}
                  className="text-center p-6 rounded-2xl bg-card border border-border"
                >
                  <div 
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{ backgroundColor: `${company.primaryColor}15` }}
                  >
                    <step.icon className="w-6 h-6" style={{ color: company.primaryColor }} />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Estado: com ambiente carregado */
          <div className="animate-fade-in">
            <div className="grid lg:grid-cols-[1fr_360px] gap-8">
              {/* Área Principal - Imagem */}
              <div className="space-y-6">
                <ImageViewer
                  room={activeRoom}
                  selectedWallId={selectedWallId}
                  onSelectWall={selectWall}
                  onRetryAnalysis={retryAnalysis}
                  primaryColor={company.primaryColor}
                />

                {/* Galeria de Ambientes */}
                {rooms.length > 0 && (
                  <div className="bg-card p-4 rounded-2xl border border-border shadow-soft">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
                      Ambientes Carregados ({rooms.length})
                    </p>
                    <RoomGallery
                      rooms={rooms}
                      activeRoomId={activeRoomId}
                      onSelectRoom={selectRoom}
                      onAddRoom={addRoom}
                    />
                  </div>
                )}

                {/* Simulações Aplicadas */}
                {activeRoom && activeRoom.simulations.length > 0 && (
                  <SimulationCards
                    simulations={activeRoom.simulations}
                    onRemove={removeSimulation}
                  />
                )}
              </div>

              {/* Painel de Cores */}
              <div className="animate-slide-in-right">
                <ColorPanel
                  catalogs={company.catalogs}
                  selectedPaint={selectedPaint}
                  onSelectPaint={setSelectedPaint}
                  onApplyColor={applyColor}
                  canApply={!!activeRoom?.isAnalyzed && !!selectedWallId && !!selectedPaint}
                  isPainting={isPainting}
                  selectedWallLabel={selectedWall?.label}
                  primaryColor={company.primaryColor}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay de Pintura */}
      {isPainting && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center">
          <div className="bg-card rounded-3xl p-10 text-center shadow-elevated animate-scale-in border border-border max-w-sm w-full mx-4">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: selectedPaint?.hex || company.primaryColor }}
              />
              <div
                className="relative w-24 h-24 rounded-full border-4 border-white shadow-elevated flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: selectedPaint?.hex || company.primaryColor }}
              >
                <Sparkles className="w-10 h-10 text-white/90" />
              </div>
            </div>
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">
              Aplicando Cor com IA
            </h2>
            <p className="text-muted-foreground mb-2">
              Pintando a <span className="font-bold text-foreground">{selectedWall?.label || 'superfície'}</span> de{' '}
              <span className="font-bold" style={{ color: selectedPaint?.hex }}>
                {selectedPaint?.name}
              </span>
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <Loader2 
                className="w-5 h-5 animate-spin" 
                style={{ color: company.primaryColor }} 
              />
              <span className="text-sm font-medium text-muted-foreground">
                Processando...
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Isso pode levar alguns segundos
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulator;