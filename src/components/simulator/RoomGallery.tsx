import { useRef, useState } from "react";
import { Plus, ImageIcon, Trash2 } from "lucide-react";
import { Room } from "./types";

interface RoomGalleryProps {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (id: string) => void;
  onAddRoom: (file: File) => void;
  onUploadClick: () => void; // Nova prop para ativar o crop
  onDeleteRoom: (id: string) => void; // Nova prop para excluir ambiente
}

const RoomGallery = ({ rooms, activeRoomId, onSelectRoom, onAddRoom, onUploadClick, onDeleteRoom }: RoomGalleryProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

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
          className={`relative flex-shrink-0 rounded-xl border-2 border-border overflow-hidden group transition-all duration-200 w-[100px] h-[68px] sm:w-[120px] sm:h-[80px] ${
            activeRoomId === room.id ? 'ring-2 ring-primary ring-offset-2' : 'hover:border-primary/50 hover:shadow-md'
          }`}
          onClick={() => onSelectRoom(room.id)}
          onMouseEnter={() => setHoveredRoomId(room.id)}
          onMouseLeave={() => setHoveredRoomId(null)}
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
          {/* Overlay with name and delete button */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-1.5">
            <p className="text-[10px] font-medium text-primary-foreground truncate pr-8">
              {room.isAnalyzing ? "Analisando..." : room.name}
            </p>
            {/* Delete button - positioned inside overlay */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDeleteRoom(room.id);
              }}
              className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center transition-opacity hover:bg-destructive ${
                hoveredRoomId === room.id ? 'opacity-100' : 'opacity-0'
              }`}
              title="Excluir ambiente"
            >
              <Trash2 className="w-3 h-3" />
            </button>
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
        onClick={onUploadClick}
        className="flex-shrink-0 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all duration-200 flex flex-col items-center justify-center gap-1 bg-muted/30 hover:bg-muted/60 w-[100px] h-[68px] sm:w-[120px] sm:h-[80px]"
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
