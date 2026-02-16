import { Link } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Palette, Loader2 } from "lucide-react";

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
    toast.success("PDF gerado com sucesso! (Funcionalidade demo)");
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <p className="text-muted-foreground mb-4 font-medium">Carregando configurações da loja...</p>
          <Button asChild variant="outline">
            <Link to="/dashboard">Voltar ao Painel</Link>
          </Button>
        </div>
      </div>
    );
  }

  const selectedWall = activeRoom?.walls.find((w) => w.id === selectedWallId);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Top Accent Bar */}
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
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          {/* Main Area */}
          <div className="space-y-6">
            {/* Upload or Image Viewer */}
            {!activeRoom ? (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <h1 className="text-2xl font-display font-bold text-foreground mb-2">Comece sua simulação</h1>
                  <p className="text-muted-foreground">Envie uma foto do seu ambiente para começar a testar novas cores.</p>
                </div>
                <UploadArea onUpload={(file) => addRoom(file)} />
              </div>
            ) : (
              <div className="animate-fade-in">
                <ImageViewer
                  room={activeRoom}
                  selectedWallId={selectedWallId}
                  onSelectWall={selectWall}
                  onRetryAnalysis={retryAnalysis}
                  primaryColor={company.primaryColor}
                />
              </div>
            )}

            {/* Room Gallery */}
            {rooms.length > 0 && (
              <div className="bg-card p-4 rounded-2xl border border-border shadow-soft">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Seus Ambientes</p>
                <RoomGallery
                  rooms={rooms}
                  activeRoomId={activeRoomId}
                  onSelectRoom={selectRoom}
                  onAddRoom={addRoom}
                />
              </div>
            )}

            {/* Simulation Cards for active room */}
            {activeRoom && activeRoom.simulations.length > 0 && (
              <div className="animate-fade-in">
                <SimulationCards
                  simulations={activeRoom.simulations}
                  onRemove={removeSimulation}
                />
              </div>
            )}
          </div>

          {/* Color Panel */}
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

      {/* Painting Overlay */}
      {isPainting && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-card rounded-3xl p-10 text-center shadow-elevated animate-scale-in border border-border max-w-sm w-full mx-4">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: selectedPaint?.hex || company.primaryColor }}
              />
              <div
                className="relative w-20 h-20 rounded-full border-4 border-white shadow-elevated flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: selectedPaint?.hex || company.primaryColor }}
              >
                <Palette className="w-8 h-8 text-white/80" />
              </div>
            </div>
            <h2 className="font-display font-bold text-xl text-foreground mb-2">Pintando com IA</h2>
            <p className="text-sm text-muted-foreground">
              Aplicando a cor <span className="font-bold text-foreground">{selectedPaint?.name}</span> na <span className="font-bold text-foreground">{selectedWall?.label}</span>.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" style={{ color: company.primaryColor }} />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aguarde um momento...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulator;