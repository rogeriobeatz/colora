import { Paint } from "@/data/defaultColors";

export interface DetectedWall {
  id: string;
  label: string; // PT (UI)
  englishLabel?: string; // EN (para IA)
  description?: string;
}

export interface WallSimulation {
  id: string;
  wallId: string;
  wallLabel: string;
  paint: Paint;
  imageUrl: string;
  createdAt: string;
  isPainting: boolean;
}

export interface Room {
  id: string;
  name: string;
  imageUrl: string; // imagem atualmente selecionada (principal)
  originalImageUrl: string;
  walls: DetectedWall[];
  isAnalyzing: boolean;
  isAnalyzed: boolean;
  simulations: WallSimulation[];
  activeSimulationId: string | null;
  cropCoordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SimulatorSessionData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  rooms: Room[];
  activeRoomId: string | null;
  selectedWallId: string | null;
}

export type SimulatorStep = "upload" | "analyzing" | "ready" | "painting";