import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Paint } from "@/data/defaultColors";
import { supabase } from "@/integrations/supabase/client";
import { Room, DetectedWall, WallSimulation } from "./types";

const genId = () => Math.random().toString(36).substring(2, 10);
let roomCounter = 1;

export function useSimulator() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedPaint, setSelectedPaint] = useState<Paint | null>(null);
  const [isPainting, setIsPainting] = useState(false);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;

  const addRoom = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imageBase64 = ev.target?.result as string;
      const id = genId();
      const newRoom: Room = {
        id,
        name: `Ambiente ${roomCounter++}`,
        imageUrl: imageBase64,
        originalImageUrl: imageBase64,
        walls: [],
        isAnalyzing: true,
        isAnalyzed: false,
        simulations: [],
      };
      setRooms((prev) => [...prev, newRoom]);
      setActiveRoomId(id);
      setSelectedWallId(null);

      try {
        console.log("[useSimulator] Iniciando análise da imagem...");
        
        const { data, error } = await supabase.functions.invoke("analyze-room", {
          body: { imageBase64 },
        });

        if (error) {
          console.error("[useSimulator] Erro na Edge Function:", error);
          throw error;
        }

        console.log("[useSimulator] Resposta da análise:", data);

        if (data.error) {
          throw new Error(data.error);
        }

        // Processar superfícies detectadas - novo formato
        const detectedWalls: DetectedWall[] = (data.superficies || []).map((s: any, idx: number) => ({
          id: s.id || `superficie_${idx}_${Date.now()}`,
          label: s.nome || s.label || "Superfície",
          tipo: s.tipo || s.type || "parede",
          polygon: (s.poligono || s.polygon || []).map((p: any) => ({
            x: Number(p.x) || 0,
            y: Number(p.y) || 0,
          })),
        }));

        // Se não detectou nada pelo novo formato, tentar formato antigo
        if (detectedWalls.length === 0 && data.walls) {
          detectedWalls.push(...data.walls.map((w: any, idx: number) => ({
            id: w.id || `wall_${idx}_${Date.now()}`,
            label: w.label || `Parede ${idx + 1}`,
            tipo: "parede" as const,
            polygon: (w.polygon || []).map((p: any) => ({
              x: Number(p.x) || 0,
              y: Number(p.y) || 0,
            })),
          })));
        }

        setRooms((prev) =>
          prev.map((r) =>
            r.id === id 
              ? { 
                  ...r, 
                  walls: detectedWalls, 
                  isAnalyzing: false, 
                  isAnalyzed: true 
                } 
              : r
          )
        );

        if (detectedWalls.length > 0) {
          toast.success(`${detectedWalls.length} superfícies detectadas!`, {
            description: "Selecione uma superfície para pintar",
          });
          // Selecionar automaticamente a primeira parede
          setSelectedWallId(detectedWalls[0].id);
        } else {
          toast.warning("Nenhuma superfície detectada", {
            description: "Tente usar uma foto mais clara do ambiente",
          });
        }
      } catch (err: any) {
        console.error("[useSimulator] Erro na análise:", err);
        setRooms((prev) => prev.map((r) => r.id === id ? { ...r, isAnalyzing: false, isAnalyzed: false } : r));
        
        const errorMessage = err.message || "Não foi possível analisar a imagem";
        toast.error("Erro na análise", { description: errorMessage });
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const applyColor = useCallback(async () => {
    if (!activeRoom || !selectedWallId || !selectedPaint) {
      toast.error("Selecione uma superfície e uma cor");
      return;
    }

    const wall = activeRoom.walls.find((w) => w.id === selectedWallId);
    if (!wall) {
      toast.error("Superfície não encontrada");
      return;
    }

    setIsPainting(true);

    try {
      console.log("[useSimulator] Pintando superfície:", wall.label, "com cor:", selectedPaint.hex);

      const { data, error } = await supabase.functions.invoke("paint-wall", {
        body: {
          imageBase64: activeRoom.imageUrl,
          paintColor: selectedPaint.hex,
          paintName: selectedPaint.name,
          wallLabel: wall.label,
          surfaceType: wall.tipo,
        },
      });

      if (error) {
        console.error("[useSimulator] Erro na pintura:", error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.imageUrl) {
        throw new Error("URL da imagem não retornada");
      }

      const simulation: WallSimulation = {
        id: genId(),
        wallId: selectedWallId,
        wallLabel: wall.label,
        paint: selectedPaint,
        isPainting: false,
      };

      setRooms((prev) =>
        prev.map((r) =>
          r.id === activeRoom.id
            ? {
                ...r,
                imageUrl: data.imageUrl,
                simulations: [...r.simulations.filter((s) => s.wallId !== selectedWallId), simulation],
              }
            : r
        )
      );

      toast.success("Cor aplicada com sucesso!", {
        description: `${selectedPaint.name} na ${wall.label}`,
      });
    } catch (err: any) {
      console.error("[useSimulator] Erro ao pintar:", err);
      toast.error("Erro ao aplicar cor", { 
        description: err.message || "Tente novamente" 
      });
    } finally {
      setIsPainting(false);
    }
  }, [activeRoom, selectedWallId, selectedPaint]);

  const removeSimulation = useCallback((simId: string) => {
    if (!activeRoom) return;
    
    const sim = activeRoom.simulations.find(s => s.id === simId);
    if (!sim) return;
    
    // Verificar se é a última simulação da sala
    const remainingSims = activeRoom.simulations.filter(s => s.id !== simId);
    
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoom.id) return r;
        return { 
          ...r, 
          simulations: remainingSims,
          imageUrl: remainingSims.length === 0 ? r.originalImageUrl : r.imageUrl 
        };
      })
    );
  }, [activeRoom]);

  const retryAnalysis = useCallback(() => {
    if (!activeRoom) return;
    
    // Converter dataURL para File e re-adicionar
    const file = dataURLtoFile(activeRoom.originalImageUrl, `room_${Date.now()}.jpg`);
    setRooms(prev => prev.filter(r => r.id !== activeRoom.id));
    addRoom(file);
  }, [activeRoom, addRoom]);

  const clearRoom = useCallback((roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
    if (activeRoomId === roomId) {
      setActiveRoomId(rooms.length > 1 ? rooms[0].id : null);
      setSelectedWallId(null);
    }
  }, [activeRoomId, rooms]);

  return {
    rooms,
    activeRoom,
    activeRoomId,
    selectedWallId,
    selectedPaint,
    isPainting,
    totalSimulations: rooms.reduce((acc, r) => acc + r.simulations.length, 0),
    addRoom,
    selectRoom: setActiveRoomId,
    selectWall: setSelectedWallId,
    setSelectedPaint,
    applyColor,
    removeSimulation,
    retryAnalysis,
    clearRoom,
  };
}

// Helper para converter base64 para File
function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}