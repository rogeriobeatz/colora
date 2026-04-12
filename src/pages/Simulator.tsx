import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";
import { 
  Palette, 
  Loader2, 
  ImagePlus, 
  Sparkles, 
  PencilLine, 
  LayoutPanelTop,
  History
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import UnifiedHeader from "@/components/shared/UnifiedHeader";
import UploadArea from "@/components/simulator/UploadArea";
import RoomGallery from "@/components/simulator/RoomGallery";
import ImageViewer from "@/components/simulator/ImageViewer";
import ColorPanel from "@/components/simulator/ColorPanel";
import SimulationCards from "@/components/simulator/SimulationCards";
import { useSimulator } from "@/components/simulator/useSimulator";
import ProjectNameDialog from "@/components/simulator/ProjectNameDialog";
import ProjectDrawer from "@/components/simulator/ProjectDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoreFooter from "@/components/StoreFooter";
import { ImageCropper } from "@/components/ImageCropper";
import { AspectMode } from "@/components/simulator/types";
import { cn } from "@/lib/utils";
import { ColoraSpinner } from "@/components/ui/colora-spinner";
import { TrialBanner } from "@/components/ui/trial-banner";

const Simulator = ({ companySlug }: { companySlug?: string }) => {
  const { company } = useStore();
  const navigate = useNavigate();

  const {
    session,
    loadingSession,
    rooms,
    activeRoom,
    activeRoomId,
    selectedWallId,
    selectedPaint,
    isPainting,
    hasUnsavedChanges,
    totalSimulations,
    addRoom,
    selectRoom,
    selectWall,
    setSelectedPaint,
    applyColor,
    selectSimulation,
    removeSimulation,
    retryAnalysis,
    manualSave,
    setSessionName,
    listSessions,
    loadSession,
    deleteSession,
    createNewSession,
    clearRoom,
  } = useSimulator();

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [pendingFirstUpload, setPendingFirstUpload] = useState(false);
  const [isColorPanelExpanded, setIsColorPanelExpanded] = useState(false);

  // Crop states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<AspectMode>("16-9");

  const selectedWall = useMemo(() => activeRoom?.walls.find((w) => w.id === selectedWallId), [activeRoom, selectedWallId]);

  useEffect(() => {
    if (!pendingFirstUpload) return;
    if (!activeRoom) return;
    setPendingFirstUpload(false);
  }, [pendingFirstUpload, activeRoom]);

  const handleGeneratePDF = () => {
    toast.success("Funcionalidade em desenvolvimento", {
      description: "O PDF será disponibilizado em breve",
    });
  };

  const handleSelectWall = (id: string) => {
    selectWall(id);
    // Wizard Mobile: Expande o painel automaticamente ao selecionar a parede
    if (window.innerWidth < 1024) {
      setIsColorPanelExpanded(true);
    }
  };

  const detectAspectRatio = (file: File): Promise<AspectMode> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const ratio = width / height;
        const TOLERANCE = 0.15;
        if (Math.abs(ratio - 1) < TOLERANCE) resolve('1-1');
        else if (ratio < 1 - TOLERANCE) resolve('2-3');
        else resolve('16-9');
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async (file: File) => {
    const detectedRatio = await detectAspectRatio(file);
    setDetectedAspectRatio(detectedRatio);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageToCrop(e.target?.result as string);
      setPendingFile(file);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedDataUrl: string, coordinates: { x: number; y: number; width: number; height: number }) => {
    setCropperOpen(false);
    setImageToCrop(null);
    if (pendingFile) {
      const response = await fetch(croppedDataUrl);
      const blob = await response.blob();
      const croppedFile = new File([blob], pendingFile.name, { type: pendingFile.type });
      await addRoom(croppedFile, coordinates, detectedAspectRatio);
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setImageToCrop(null);
  };

  const triggerUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleUpload(file);
    };
    input.click();
  };

  if (loadingSession || !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ColoraSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <UnifiedHeader
        variant="simulator"
        showBackButton={true}
        backTo={companySlug ? `/empresa/${companySlug}` : "/dashboard"}
        hasUnsavedChanges={hasUnsavedChanges}
        hasSimulations={totalSimulations > 0}
        tokens={company?.tokens ?? 0}
        projectName={session?.name}
        onRename={(newName) => setSessionName(newName)}
        onGeneratePDF={handleGeneratePDF}
        onSave={manualSave}
        onOpenProjects={() => setProjectsOpen(true)}
      />

      <TrialBanner variant="simulator" />
      <div className="container mx-auto px-4 py-8 max-w-6xl flex-1 pb-24 sm:pb-20 lg:pb-8">
        {!activeRoom ? (
          <div className="animate-in fade-in duration-700">
            <div className="text-center mb-8 max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary/10">
                <Palette className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Simulador de Ambientes</h1>
              <p className="text-muted-foreground text-lg">
                Envie uma foto, selecione a parede e aplique uma cor com realismo.
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <UploadArea onUpload={handleUpload} />
            </div>
            <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              {[
                { icon: ImagePlus, title: "1. Envie a Foto", desc: "Fotografe qualquer ambiente interno" },
                { icon: Palette, title: "2. Escolha a Cor", desc: "Selecione entre dezenas de cores" },
                { icon: Sparkles, title: "3. Veja o Resultado", desc: "IA aplica a cor com realismo" },
              ].map((step, i) => (
                <div key={i} className="text-center p-6 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-primary/10">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6 px-1">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm sm:text-lg font-bold truncate">{session?.name || ""}</p>
                  {hasUnsavedChanges && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none text-[10px] font-medium flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5" /> Pendente
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-7 sm:h-9 px-2 sm:px-3 text-xs flex-shrink-0 text-muted-foreground hover:text-primary"
                onClick={() => setProjectDialogOpen(true)}
              >
                <PencilLine className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Renomear</span>
              </Button>
            </div>

            <div className="grid lg:grid-cols-[1fr_360px] gap-3 sm:gap-8">
              <div className="space-y-3 sm:space-y-6">
                <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden p-1 sm:p-2">
                  <ImageViewer
                    room={activeRoom}
                    selectedWallId={selectedWallId}
                    onSelectWall={handleSelectWall}
                    onRetryAnalysis={() => retryAnalysis(activeRoom.id)}
                    onSelectSimulation={(simId) => selectSimulation(activeRoom.id, simId)}
                    primaryColor={company.primaryColor}
                  />
                </div>

                {rooms.length > 0 && (
                  <div className="bg-card p-3 sm:p-6 rounded-2xl border border-border shadow-sm">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
                      Ambientes ({rooms.length})
                    </p>
                    <RoomGallery rooms={rooms} activeRoomId={activeRoomId} onSelectRoom={selectRoom} onAddRoom={addRoom} onUploadClick={triggerUpload} onDeleteRoom={clearRoom} />
                  </div>
                )}

                {activeRoom.simulations.length > 0 && (
                  <SimulationCards simulations={activeRoom.simulations} onRemove={removeSimulation} />
                )}
              </div>

              {/* Desktop ColorPanel */}
              <div className="animate-in slide-in-from-right duration-500 hidden lg:block">
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

            {/* Mobile ColorPanel (Wizard Flow) */}
            <div className="lg:hidden mt-4">
              <ColorPanel
                catalogs={company.catalogs}
                selectedPaint={selectedPaint}
                onSelectPaint={setSelectedPaint}
                onApplyColor={applyColor}
                canApply={!!activeRoom?.isAnalyzed && !!selectedWallId && !!selectedPaint}
                isPainting={isPainting}
                selectedWallLabel={selectedWall?.label}
                primaryColor={company.primaryColor}
                isExpanded={isColorPanelExpanded}
                onToggleExpand={() => setIsColorPanelExpanded(!isColorPanelExpanded)}
              />
            </div>
          </div>
        )}
      </div>

      <StoreFooter company={company} />

      {isPainting && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-card rounded-3xl p-10 text-center shadow-2xl border border-border max-w-sm w-full mx-4 space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-primary" />
              <div className="relative w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-xl">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="font-bold text-xl text-foreground">Aplicando Cor</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nossa IA está pintando a <span className="font-bold text-foreground">{selectedWall?.label || "superfície"}</span>.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Processando...</span>
            </div>
          </div>
        </div>
      )}

      <ProjectNameDialog
        open={projectDialogOpen}
        defaultValue={session?.name ?? ""}
        onOpenChange={setProjectDialogOpen}
        onConfirm={(name) => {
          setSessionName(name);
          setProjectDialogOpen(false);
        }}
      />

      <ProjectDrawer
        open={projectsOpen}
        onOpenChange={setProjectsOpen}
        currentProjectId={session?.id ?? null}
        listProjects={listSessions}
        onLoad={loadSession}
        onDelete={deleteSession}
        onNew={() => {
          createNewSession();
          setProjectsOpen(false);
        }}
      />

      {cropperOpen && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          initialAspectRatio={detectedAspectRatio}
        />
      )}
    </div>
  );
};

export default Simulator;
