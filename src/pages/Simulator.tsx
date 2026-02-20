import { useEffect, useMemo, useState, useCallback } from "react";
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";
import { Palette, Loader2, ImagePlus, Sparkles, PencilLine } from "lucide-react";

import SimulatorHeader from "@/components/simulator/SimulatorHeader";
import UploadArea from "@/components/simulator/UploadArea";
import RoomGallery from "@/components/simulator/RoomGallery";
import ImageViewer from "@/components/simulator/ImageViewer";
import ColorPanel from "@/components/simulator/ColorPanel";
import SimulationCards from "@/components/simulator/SimulationCards";
import { useSimulator } from "@/components/simulator/useSimulator";
import ProjectNameDialog from "@/components/simulator/ProjectNameDialog";
import SessionDrawer from "@/components/simulator/SessionDrawer";
import { Button } from "@/components/ui/button";
import StoreFooter from "@/components/StoreFooter";
import { ImageCropper } from "@/components/ImageCropper";

const Simulator = ({ companySlug }: { companySlug?: string }) => {
  const { company } = useStore();

  const {
    session,
    loadingSession,
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
    selectSimulation,
    removeSimulation,
    retryAnalysis,
    manualSave,
    setSessionName,
    listSessions,
    loadSession,
    deleteSession,
    createNewSession,
  } = useSimulator();

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [pendingFirstUpload, setPendingFirstUpload] = useState(false);

  // Crop states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const selectedWall = useMemo(() => activeRoom?.walls.find((w) => w.id === selectedWallId), [activeRoom, selectedWallId]);

  useEffect(() => {
    // Se começou o primeiro upload e ainda está com nome padrão, abre o dialog enquanto analisa
    if (!pendingFirstUpload) return;
    if (!activeRoom) return;

    if (session?.name === "Projeto sem nome") {
      setProjectDialogOpen(true);
    }
    setPendingFirstUpload(false);
  }, [pendingFirstUpload, activeRoom, session?.name]);

  const handleGeneratePDF = () => {
    toast.success("Funcionalidade em desenvolvimento", {
      description: "O PDF será disponibilizado em breve",
    });
  };

  const handleUpload = async (file: File) => {
    // Abre o cropper antes de adicionar a sala
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
      setPendingFirstUpload(true);
      // Passa as coordenadas de crop para o addRoom
      await addRoom(pendingFile, coordinates);
      setPendingFile(null);
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setImageToCrop(null);
    setPendingFile(null);
  };

  if (loadingSession || !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SimulatorHeader
        company={company}
        companySlug={companySlug}
        hasSimulations={totalSimulations > 0}
        onGeneratePDF={handleGeneratePDF}
        onSave={manualSave}
        onOpenProjects={() => setProjectsOpen(true)}
        projectName={session?.name ?? null}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl flex-1">
        {!activeRoom ? (
          <div className="animate-fade-in">
            <div className="text-center mb-8 max-w-xl mx-auto">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${company.primaryColor}15` }}
              >
                <Palette className="w-8 h-8" style={{ color: company.primaryColor }} />
              </div>

              <h1 className="text-3xl font-display font-bold text-foreground mb-3">Simulador de Ambientes</h1>
              <p className="text-muted-foreground text-lg">
                Envie uma foto, selecione a parede e aplique uma cor com realismo.
              </p>

              <div className="mt-5 flex items-center justify-center gap-2">
                <Button variant="outline" onClick={() => setProjectsOpen(true)} className="gap-2">
                  Abrir projetos salvos
                </Button>
                <Button
                  onClick={() => createNewSession()}
                  className="gap-2"
                  style={{ backgroundColor: company.primaryColor }}
                >
                  Novo projeto
                </Button>
              </div>
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
          <div className="animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Projeto</p>
                <p className="text-lg font-display font-bold truncate">{session?.name || "Projeto sem nome"}</p>
              </div>

              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setProjectDialogOpen(true)}
                title="Renomear projeto"
              >
                <PencilLine className="w-4 h-4" />
                Renomear
              </Button>
            </div>

            <div className="grid lg:grid-cols-[1fr_360px] gap-8">
              <div className="space-y-6">
                <ImageViewer
                  room={activeRoom}
                  selectedWallId={selectedWallId}
                  onSelectWall={selectWall}
                  onRetryAnalysis={retryAnalysis}
                  onSelectSimulation={(simId) => selectSimulation(activeRoom.id, simId)}
                  primaryColor={company.primaryColor}
                />

                {rooms.length > 0 && (
                  <div className="bg-card p-4 rounded-2xl border border-border shadow-soft">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
                      Ambientes Carregados ({rooms.length})
                    </p>
                    <RoomGallery rooms={rooms} activeRoomId={activeRoomId} onSelectRoom={selectRoom} onAddRoom={addRoom} />
                  </div>
                )}

                {activeRoom.simulations.length > 0 && (
                  <SimulationCards simulations={activeRoom.simulations} onRemove={removeSimulation} />
                )}
              </div>

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

      <StoreFooter company={company} />

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
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">Aplicando Cor com IA</h2>
            <p className="text-muted-foreground mb-2">
              Pintando a <span className="font-bold text-foreground">{selectedWall?.label || "superfície"}</span> de{" "}
              <span className="font-bold" style={{ color: selectedPaint?.hex }}>
                {selectedPaint?.name}
              </span>
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: company.primaryColor }} />
              <span className="text-sm font-medium text-muted-foreground">Processando...</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Isso pode levar alguns segundos</p>
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

      <SessionDrawer
        open={projectsOpen}
        onOpenChange={setProjectsOpen}
        currentSessionId={session?.id ?? null}
        listSessions={listSessions}
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
        />
      )}
    </div>
  );
};

export default Simulator;