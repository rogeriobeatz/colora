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

      try {
        const { data, error } = await supabase.functions.invoke("analyze-room", {
          body: { imageBase64 },
        });
        
        if (error) throw error;

        // Garantir que os dados das paredes venham no formato correto
        const detectedWalls: DetectedWall[] = (data.walls || []).map((w: any, idx: number) => ({
          id: w.id || `wall_${idx}_${Date.now()}`,
          label: w.label || `Parede ${idx + 1}`,
          polygon: w.polygon || [],
        }));

        setRooms((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, walls: detectedWalls, isAnalyzing: false, isAnalyzed: true } : r
          )
        );
        
        if (detectedWalls.length > 0) {
          toast.success(`${detectedWalls.length} superfícies identificadas!`);
        } else {
          toast.error("Nenhuma parede identificada. Tente outra foto.");
        }
      } catch (err: any) {
        console.error("Erro na análise:", err);
        setRooms((prev) => prev.map((r) => r.id === id ? { ...r, isAnalyzing: false } : r));
        toast.error("Não foi possível analisar a imagem. Verifique sua conexão.");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const applyColor = useCallback(async () => {
    if (!activeRoom || !selectedWallId || !selectedPaint) return;
    const wall = activeRoom.walls.find((w) => w.id === selectedWallId);
    if (!wall) return;

    setIsPainting(true);
    try {
      const { data, error } = await supabase.functions.invoke("paint-wall", {
        body: {
          imageBase64: activeRoom.imageUrl,
          paintColor: selectedPaint.hex,
          paintName: selectedPaint.name,
          wallLabel: wall.label,
        },
      });
      
      if (error) throw error;

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
      toast.success("Cor aplicada com realismo!");
    } catch (err: any) {
      console.error("Erro ao pintar:", err);
      toast.error("Erro ao processar a pintura com IA.");
    } finally {
      setIsPainting(false);
    }
  }, [activeRoom, selectedWallId, selectedPaint]);

  const removeSimulation = useCallback((simId: string) => {
    if (!activeRoom) return;
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoom.id) return r;
        const newSims = r.simulations.filter((s) => s.id !== simId);
        return { 
          ...r, 
          simulations: newSims,
          imageUrl: newSims.length === 0 ? r.originalImageUrl : r.imageUrl 
        };
      })
    );
  }, [activeRoom]);

  const retryAnalysis = useCallback(() => {
    if (!activeRoom) return;
    // Simplesmente removemos e adicionamos novamente para disparar a análise
    const file = dataURLtoFile(activeRoom.originalImageUrl, "room.jpg");
    setRooms(prev => prev.filter(r => r.id !== activeRoom.id));
    addRoom(file);
  }, [activeRoom, addRoom]);

  return {
    rooms, activeRoom, activeRoomId, selectedWallId, selectedPaint, isPainting,
    totalSimulations: rooms.reduce((acc, r) => acc + r.simulations.length, 0),
    addRoom, selectRoom: setActiveRoomId, selectWall: setSelectedWallId,
    setSelectedPaint, applyColor, removeSimulation, retryAnalysis
  };
}

// Helper para converter base64 de volta para File se necessário
function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
}