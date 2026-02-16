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
        name: `Room ${roomCounter++}`,
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
        console.log("[useSimulator] Starting room analysis...");
        
        const { data, error } = await supabase.functions.invoke("analyze-room", {
          body: { imageBase64 },
        });

        if (error) {
          console.error("[useSimulator] Edge Function Error:", error);
          throw error;
        }

        console.log("[useSimulator] Analysis response:", data);

        if (data.error) {
          throw new Error(data.error);
        }

        // Process detected walls - new semantic format
        const detectedWalls: DetectedWall[] = (data.walls || []).map((w: any, idx: number) => ({
          id: w.id || `wall_${idx}_${Date.now()}`,
          label: w.label || w.nome || w.name || "Wall",
          description: w.description || w.descricao || "",
        }));

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
          toast.success(`${detectedWalls.length} walls identified!`, {
            description: "Select a wall to paint",
          });
          // Auto-select first wall
          setSelectedWallId(detectedWalls[0].id);
        } else {
          toast.warning("No walls detected", {
            description: "Try using a clearer room photo",
          });
        }
      } catch (err: any) {
        console.error("[useSimulator] Analysis error:", err);
        setRooms((prev) => prev.map((r) => r.id === id ? { ...r, isAnalyzing: false, isAnalyzed: false } : r));
        
        const errorMessage = err.message || "Could not analyze image";
        toast.error("Analysis error", { description: errorMessage });
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const applyColor = useCallback(async () => {
    if (!activeRoom || !selectedWallId || !selectedPaint) {
      toast.error("Select a wall and a color");
      return;
    }

    const wall = activeRoom.walls.find((w) => w.id === selectedWallId);
    if (!wall) {
      toast.error("Wall not found");
      return;
    }

    setIsPainting(true);

    try {
      console.log("[useSimulator] Painting wall:", wall.label, "with color:", selectedPaint.hex);

      const { data, error } = await supabase.functions.invoke("paint-wall", {
        body: {
          imageBase64: activeRoom.imageUrl,
          paintColor: selectedPaint.hex,
          paintName: selectedPaint.name,
          wallLabel: wall.label,
          surfaceType: "wall",
        },
      });

      if (error) {
        console.error("[useSimulator] Painting error:", error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.imageUrl) {
        throw new Error("Image URL not returned");
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

      toast.success("Color applied successfully!", {
        description: `${selectedPaint.name} on ${wall.label}`,
      });
    } catch (err: any) {
      console.error("[useSimulator] Paint error:", err);
      toast.error("Error applying color", { 
        description: err.message || "Please try again" 
      });
    } finally {
      setIsPainting(false);
    }
  }, [activeRoom, selectedWallId, selectedPaint]);

  const removeSimulation = useCallback((simId: string) => {
    if (!activeRoom) return;
    
    const sim = activeRoom.simulations.find(s => s.id === simId);
    if (!sim) return;
    
    // Check if it's the last simulation in the room
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
    
    // Convert dataURL to File and re-add
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

// Helper to convert base64 to File
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