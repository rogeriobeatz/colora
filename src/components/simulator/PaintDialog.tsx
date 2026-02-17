"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Paint } from "@/data/defaultColors";
import { Palette, Loader2 } from "lucide-react";

interface PaintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paint?: Paint | null;
  onSave: (paint: Omit<Paint, "id" | "rgb" | "cmyk">) => void;
  isSaving?: boolean;
}

const categories = [
  "Brancos e Neutros",
  "Cinzas",
  "Amarelos",
  "Laranjas",
  "Vermelhos",
  "Rosas",
  "Azuis",
  "Verdes",
  "Marrons",
  "Tons Escuros",
  "Roxos e Lilases",
  "Geral",
];

const PaintDialog = ({ open, onOpenChange, paint, onSave, isSaving }: PaintDialogProps) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [hex, setHex] = useState("#000000");
  const [category, setCategory] = useState("Geral");

  useEffect(() => {
    if (paint) {
      setName(paint.name);
      setCode(paint.code);
      setHex(paint.hex);
      setCategory(paint.category);
    } else {
      setName("");
      setCode("");
      setHex("#000000");
      setCategory("Geral");
    }
  }, [paint, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, code, hex, category });
  };

  const isEditing = !!paint;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            {isEditing ? "Editar Cor" : "Nova Cor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os detalhes da cor selecionada."
              : "Adicione uma nova cor ao catálogo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Cor</Label>
            <Input
              id="name"
              placeholder="Ex: Azul Céu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                placeholder="Ex: AZ-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hex">Cor (Hex)</Label>
            <div className="flex gap-2">
              <div className="relative w-14 h-10 shrink-0">
                <input
                  type="color"
                  id="hex"
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="w-full h-full rounded-lg border border-border"
                  style={{ backgroundColor: hex }}
                />
              </div>
              <Input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="font-mono uppercase"
                placeholder="#000000"
                required
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div
              className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
              style={{ backgroundColor: hex }}
            />
            <div>
              <p className="font-medium text-foreground">{name || "Nome da cor"}</p>
              <p className="text-xs text-muted-foreground">
                {code || "Código"} · {hex.toUpperCase()}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isEditing ? "Salvar Alterações" : "Adicionar Cor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaintDialog;