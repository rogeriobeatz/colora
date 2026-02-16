import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Paint } from "@/data/defaultColors";
import { Room, DetectedWall, WallSimulation } from "./types";

const genId = () => Math.random().toString(36).substring(2, 10);

// Simulated AI wall detection - generates plausible wall regions
function simulateWallDetection(): DetectedWall[] {
  return [
    {
      id: genId(),
      label: "Parede Esquerda",
      polygon: [
        { x: 0, y: 15 },
        { x: 30, y: 12 },
        { x: 30, y: 85 },
        { x: 0, y: 90 },
      ],
    },
    {
      id: genId(),
      label: "Parede Central",
      polygon: [
        { x: 30, y: 12 },
        { x: 75, y: 10 },
        { x: 75, y: 82 },
        { x: 30, y: 85 },
      ],
    },
    {
      id: genId(),
      label: "Parede Direita",
      polygon: [
        { x: 75, y: 10 },
        { x: 100, y: 18 },
        { x: 100, y: 88 },
        { x: 75, y: 82 },
      ],
    },
    {
      id: genId(),
      label: "Teto",
      polygon: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 18 },
        { x: 75, y: 10 },
        { x: 30, y: 12 },
        { x: 0, y: 15 },
      ],
    },
  ];
}

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
    reader.onload = (ev) => {
      const imageUrl = ev.target?.result as string;
      const id = genId();
      const name = `Ambiente ${roomCounter++}`;
      const newRoom: Room = {
        id,
        name,
        imageUrl,
        walls: [],
        isAnalyzing: true,
        isAnalyzed: false,
        simulations: [],
      };
      setRooms((prev) => [...prev, newRoom]);
      setActiveRoomId(id);
      setSelectedWallId(null);

      // Simulate AI room analysis
      setTimeout(() => {
        const detectedWalls = simulateWallDetection();
        setRooms((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, walls: detectedWalls, isAnalyzing: false, isAnalyzed: true }
              : r
          )
        );
        toast.success(`${detectedWalls.length} superfícies detectadas!`, {
          description: "Selecione uma parede e escolha uma cor para pintar.",
        });
      }, 2500);
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

  const applyColor = useCallback(() => {
    if (!activeRoom || !selectedWallId || !selectedPaint) return;

    const wall = activeRoom.walls.find((w) => w.id === selectedWallId);
    if (!wall) return;

    setIsPainting(true);

    // Simulate AI painting
    setTimeout(() => {
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
                simulations: [
                  ...r.simulations.filter((s) => s.wallId !== selectedWallId),
                  simulation,
                ],
              }
            : r
        )
      );

      setIsPainting(false);
      toast.success(`${selectedPaint.name} aplicada!`, {
        description: `${wall.label} pintada com sucesso.`,
      });
    }, 1800);
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
  };
}
