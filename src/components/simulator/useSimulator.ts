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
      const name = `Ambiente ${roomCounter++}`;
      const newRoom: Room = {
        id,
        name,
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
        // Call the real AI analysis edge function
        const { data, error } = await supabase.functions.invoke("analyze-room", {
          body: { imageBase64 },
        });

        if (error) throw error;

        if (data?.error) {
          throw new Error(data.error);
        }

        const detectedWalls: DetectedWall[] = (data.walls || []).map((w: any) => ({
          id: w.id || genId(),
          label: w.label,
          polygon: w.polygon,
        }));

        setRooms((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, walls: detectedWalls, isAnalyzing: false, isAnalyzed: true }
              : r
          )
        );

        toast.success(`${detectedWalls.length} superfícies detectadas pela IA!`, {
          description: "Selecione uma parede e escolha uma cor para pintar.",
        });
      } catch (err: any) {
        console.error("Room analysis error:", err);
        setRooms((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, isAnalyzing: false, isAnalyzed: false } : r
          )
        );
        toast.error("Erro ao analisar o ambiente", {
          description: err.message || "Tente novamente.",
        });
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const selectRoom = useCallback((id: string) => {
    setActiveRoomId(id);
    setSelectedWallId(null);
  }, []);

  const selectWall = useCallback((wallId: string) => {
    setSelectedWallId(wallId);
  }, []);

  const applyColor = useCallback(async () => {
    if (!activeRoom || !selectedWallId || !selectedPaint) return;

    const wall = activeRoom.walls.find((w) => w.id === selectedWallId);
    if (!wall) return;

    setIsPainting(true);

    try {
      // Call the real AI painting edge function
      const { data, error } = await supabase.functions.invoke("paint-wall", {
        body: {
          imageBase64: activeRoom.imageUrl,
          paintColor: selectedPaint.hex,
          paintName: selectedPaint.name,
          wallLabel: wall.label,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const resultImageUrl = data.imageUrl;

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
                // Update the room image with the painted result
                imageUrl: resultImageUrl || r.imageUrl,
                simulations: [
                  ...r.simulations.filter((s) => s.wallId !== selectedWallId),
                  simulation,
                ],
              }
            : r
        )
      );

      toast.success(`${selectedPaint.name} aplicada com IA!`, {
        description: `${wall.label} pintada com sucesso.`,
      });
    } catch (err: any) {
      console.error("Paint wall error:", err);
      toast.error("Erro ao pintar a parede", {
        description: err.message || "Tente novamente.",
      });
    } finally {
      setIsPainting(false);
    }
  }, [activeRoom, selectedWallId, selectedPaint]);

  const removeSimulation = useCallback(
    (simId: string) => {
      if (!activeRoom) return;
      setRooms((prev) =>
        prev.map((r) =>
          r.id === activeRoom.id
            ? { ...r, simulations: r.simulations.filter((s) => s.id !== simId) }
            : r
        )
      );
    },
    [activeRoom]
  );

  const resetRoom = useCallback(() => {
    if (!activeRoom) return;
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeRoom.id
          ? { ...r, imageUrl: r.originalImageUrl, simulations: [] }
          : r
      )
    );
    toast.info("Ambiente restaurado ao original");
  }, [activeRoom]);

  const retryAnalysis = useCallback(() => {
    if (!activeRoom) return;
    // Re-trigger analysis by setting isAnalyzing
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeRoom.id ? { ...r, isAnalyzing: true, isAnalyzed: false, walls: [] } : r
      )
    );

    // Call analyze again
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("analyze-room", {
          body: { imageBase64: activeRoom.imageUrl },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const detectedWalls: DetectedWall[] = (data.walls || []).map((w: any) => ({
          id: w.id || genId(),
          label: w.label,
          polygon: w.polygon,
        }));

        setRooms((prev) =>
          prev.map((r) =>
            r.id === activeRoom.id
              ? { ...r, walls: detectedWalls, isAnalyzing: false, isAnalyzed: true }
              : r
          )
        );

        toast.success(`${detectedWalls.length} superfícies detectadas!`);
      } catch (err: any) {
        setRooms((prev) =>
          prev.map((r) =>
            r.id === activeRoom.id ? { ...r, isAnalyzing: false } : r
          )
        );
        toast.error("Erro ao re-analisar", { description: err.message });
      }
    })();
  }, [activeRoom]);

  const totalSimulations = rooms.reduce((acc, r) => acc + r.simulations.length, 0);

  return {
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
  };
}
