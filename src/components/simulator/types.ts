import { Paint } from "@/data/defaultColors";

export interface DetectedWall {
  id: string;
  label: string;
  tipo: "parede" | "teto" | "piso" | "outro";
  polygon: { x: number; y: number }[];
}

export interface Room {
  id: string;
  name: string;
  imageUrl: string;
  originalImageUrl: string;
  walls: DetectedWall[];
  isAnalyzing: boolean;
  isAnalyzed: boolean;
  simulations: WallSimulation[];
}

export interface WallSimulation {
  id: string;
  wallId: string;
  wallLabel: string;
  paint: Paint;
  isPainting: boolean;
}

export type SimulatorStep = "upload" | "analyzing" | "ready" | "painting";