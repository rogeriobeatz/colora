import { useRef } from "react";
import { Upload } from "lucide-react";

interface UploadAreaProps {
  onUpload: (file: File) => void;
}

const UploadArea = ({ onUpload }: UploadAreaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div
      className="bg-card border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center py-20 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Upload className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-foreground font-medium mb-1">Envie a foto do ambiente</p>
      <p className="text-sm text-muted-foreground">JPG, PNG ou WEBP até 10MB</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default UploadArea;
