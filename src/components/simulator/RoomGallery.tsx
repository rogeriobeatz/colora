import { useRef } from "react";
import { Plus, ImageIcon } from "lucide-react";
import { Room } from "./types";

interface RoomGalleryProps {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (id: string) => void;
  onAddRoom: (file: File) => void;
}

const RoomGallery = ({ rooms, activeRoomId, onSelectRoom, onAddRoom }: RoomGalleryProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddRoom(file);
      e.target.value = "";
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1">
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onSelectRoom(room.id)}
          className={`flex-shrink-0 group relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
            activeRoomId === room.id
              ? "border-primary shadow-soft ring-2 ring-primary/20"
              : "border-border hover:border-primary/40"
          }`}
          style={{ width: 120, height: 80 }}
        >
          <img
            src={room.imageUrl}
            alt={room.name}
            className="w-full h-full object-cover"
          />
          {/* Status badge */}
          <div className="absolute top-1.5 right-1.5">
            {room.isAnalyzing && (
              <span className="flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
              </span>
            )}
            {room.isAnalyzed && !room.isAnalyzing && (
              <span className="inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            )}
          </div>
          {/* Overlay with name */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-1.5">
            <p className="text-[10px] font-medium text-primary-foreground truncate">{room.name}</p>
          </div>
          {/* Simulation count */}
          {room.simulations.length > 0 && (
            <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {room.simulations.length}
            </div>
          )}
        </button>
      ))}

      {/* Add Room Card */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex-shrink-0 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all duration-200 flex flex-col items-center justify-center gap-1 bg-muted/30 hover:bg-muted/60"
        style={{ width: 120, height: 80 }}
      >
        <Plus className="w-5 h-5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-medium">Novo Ambiente</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default RoomGallery;
