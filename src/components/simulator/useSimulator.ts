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
        originalImageUrl: imageBase64, // Guardamos a original aqui
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

        const detectedWalls: DetectedWall[] = (data.walls || []).map((w: any) => ({
          id: w.id || genId(),
          label: w.label,
          polygon: w.polygon,
        }));

        setRooms((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, walls: detectedWalls, isAnalyzing: false, isAnalyzed: true } : r
          )
        );
        toast.success(`${detectedWalls.length} superfícies detectadas!`);
      } catch (err: any) {
        setRooms((prev) => prev.map((r) => r.id === id ? { ...r, isAnalyzing: false } : r));
        toast.error("Erro na análise");
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
      toast.success("Cor aplicada!");
    } catch (err: any) {
      toast.error("Erro ao pintar");
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
        // Se removeu a última simulação, volta para a imagem original
        return { 
          ...r, 
          simulations: newSims,
          imageUrl: newSims.length === 0 ? (r as any).originalImageUrl : r.imageUrl 
        };
      })
    );
  }, [activeRoom]);

  return {
    rooms, activeRoom, activeRoomId, selectedWallId, selectedPaint, isPainting,
    totalSimulations: rooms.reduce((acc, r) => acc + r.simulations.length, 0),
    addRoom, selectRoom: setActiveRoomId, selectWall: setSelectedWallId,
    setSelectedPaint, applyColor, removeSimulation, retryAnalysis: () => {}
  };
}