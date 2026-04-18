import { Paint } from "@/data/defaultColors";

export interface DetectedWall {
  id: string;
  label: string; // PT (UI)
  englishLabel?: string; // EN (para IA)
  description?: string;
}

export type AspectMode = "16-9" | "2-3" | "1-1";

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
  thumbnailUrl: string; // miniatura para exibição no dashboard
  currentBaseImage?: string; // base64 da última simulação aplicada (para acumular pinturas)
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
  aspectMode?: AspectMode; // ✅ NOVO: Aspect ratio selecionado pelo usuário
  lightingContext?: string; // ✅ NOVO: Contexto de iluminação detectado pela IA
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