import { useRef, useState } from "react";
import { Plus, ImageIcon, Trash2 } from "lucide-react";
import { Room } from "./types";
import { cn } from "@/lib/utils";

interface RoomGalleryProps {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (id: string) => void;
  onAddRoom: (file: File) => void;
  onUploadClick: () => void;
  onDeleteRoom: (id: string) => void;
  variant?: "default" | "filmstrip";
}

const RoomGallery = ({ 
  rooms, 
  activeRoomId, 
  onSelectRoom, 
  onAddRoom, 
  onUploadClick, 
  onDeleteRoom,
  variant = "default"
}: RoomGalleryProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddRoom(file);
      e.target.value = "";
    }
  };

  const isFilmstrip = variant === "filmstrip";

  return (
    <div className={cn(
      "flex gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-none",
      isFilmstrip ? "items-center" : ""
    )}>
      {rooms.map((room) => (
        <button
          key={room.id}
          className={cn(
            "relative flex-shrink-0 rounded-xl border overflow-hidden group transition-all duration-300",
            isFilmstrip ? "w-20 h-14" : "w-[120px] h-[80px]",
            activeRoomId === room.id 
              ? "border-primary ring-2 ring-primary/20 ring-offset-2 scale-105 shadow-md" 
              : "border-border hover:border-primary/40"
          )}
          onClick={() => onSelectRoom(room.id)}
          onMouseEnter={() => setHoveredRoomId(room.id)}
          onMouseLeave={() => setHoveredRoomId(null)}
        >
          <img
            src={room.imageUrl}
            alt={room.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
          
          {/* Status Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDeleteRoom(room.id);
            }}
            className={cn(
              "absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center transition-all shadow-lg scale-75 group-hover:scale-100",
              hoveredRoomId === room.id ? "opacity-100" : "opacity-0"
            )}
            title="Excluir ambiente"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          {/* Room Name - Only in non-filmstrip or on hover */}
          {!isFilmstrip && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
              <p className="text-[9px] font-bold text-white truncate">
                {room.isAnalyzing ? "Analisando..." : room.name}
              </p>
            </div>
          )}
        </button>
      ))}

      {/* Add Room Button (Only in non-filmstrip, as filmstrip has its own button in Simulator.tsx) */}
      {!isFilmstrip && (
        <button
          onClick={onUploadClick}
          className="flex-shrink-0 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all duration-200 flex flex-col items-center justify-center gap-1 bg-slate-50 hover:bg-white w-[120px] h-[80px]"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Adicionar</span>
        </button>
      )}

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
