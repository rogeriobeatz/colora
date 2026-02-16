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
      <h3 className="text-sm font-semibold text-foreground mb-3">Cores Aplicadas</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {simulations.map((sim) => (
          <div
            key={sim.id}
            className="bg-card rounded-xl border border-border overflow-hidden group relative"
          >
            <div className="h-10 w-full" style={{ backgroundColor: sim.paint.hex }} />
            <div className="p-2.5">
              <p className="text-xs font-semibold text-foreground">{sim.paint.name}</p>
              <p className="text-[10px] text-muted-foreground">
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
