import { WallSimulation } from "./types";
import { X } from "lucide-react";

interface SimulationCardsProps {
  simulations: WallSimulation[];
  onRemove: (id: string) => void;
}

const SimulationCards = ({ simulations, onRemove }: SimulationCardsProps) => {
  if (simulations.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">Cores Aplicadas</h3>
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 sm:grid sm:grid-cols-3 md:grid-cols-4">
        {simulations.map((sim) => (
          <div
            key={sim.id}
            className="bg-card rounded-lg sm:rounded-xl border border-border overflow-hidden group relative flex-shrink-0 w-[120px] sm:w-auto"
          >
            <div className="h-8 sm:h-10 w-full" style={{ backgroundColor: sim.paint.hex }} />
            <div className="p-2 sm:p-2.5">
              <p className="text-[10px] sm:text-xs font-semibold text-foreground truncate">{sim.paint.name}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                {sim.wallLabel} · {sim.paint.hex}
              </p>
            </div>
            <button
              onClick={() => onRemove(sim.id)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-foreground/60 text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimulationCards;
