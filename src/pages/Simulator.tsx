import { Link } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Nenhuma empresa configurada</p>
          <Button asChild>
            <Link to="/dashboard">Configurar Empresa</Link>
          </Button>
        </div>
      </div>
    );
  }

  const selectedWall = activeRoom?.walls.find((w) => w.id === selectedWallId);

  return (
    <div className="min-h-screen bg-background">
      <SimulatorHeader
        companySlug={companySlug}
        companyName={company.name}
        companyLogo={company.logo}
        hasSimulations={totalSimulations > 0}
        onGeneratePDF={handleGeneratePDF}
      />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Area */}
          <div className="space-y-5">
            {/* Upload or Image Viewer */}
            {!activeRoom ? (
              <UploadArea onUpload={(file) => addRoom(file)} />
            ) : (
              <ImageViewer
                room={activeRoom}
                selectedWallId={selectedWallId}
                onSelectWall={selectWall}
                onRetryAnalysis={retryAnalysis}
              />
            )}

            {/* Room Gallery */}
            {rooms.length > 0 && (
              <RoomGallery
                rooms={rooms}
                activeRoomId={activeRoomId}
                onSelectRoom={selectRoom}
                onAddRoom={addRoom}
              />
            )}

            {/* Simulation Cards for active room */}
            {activeRoom && (
              <SimulationCards
                simulations={activeRoom.simulations}
                onRemove={removeSimulation}
              />
            )}
          </div>

          {/* Color Panel */}
          <ColorPanel
            catalogs={company.catalogs}
            selectedPaint={selectedPaint}
            onSelectPaint={setSelectedPaint}
            onApplyColor={applyColor}
            canApply={!!activeRoom?.isAnalyzed && !!selectedWallId && !!selectedPaint}
            isPainting={isPainting}
            selectedWallLabel={selectedWall?.label}
          />
        </div>
      </div>

      {/* Painting Overlay */}
      {isPainting && (
        <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card rounded-2xl p-8 text-center shadow-elevated animate-scale-in">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{ backgroundColor: selectedPaint?.hex || "hsl(var(--primary))" }}
              />
              <div
                className="relative w-12 h-12 rounded-full border-2 border-card shadow-elevated"
                style={{ backgroundColor: selectedPaint?.hex || "hsl(var(--primary))" }}
              />
            </div>
            <p className="font-display font-semibold text-foreground">Pintando com IA...</p>
            <p className="text-sm text-muted-foreground mt-1">Aplicando {selectedPaint?.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulator;