"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Briefcase, Save } from "lucide-react";

interface ProjectNameDialogProps {
  open: boolean;
  defaultValue?: string;
  onConfirm: (name: string) => void;
  onOpenChange: (open: boolean) => void;
}

const ProjectNameDialog = ({ open, defaultValue, onConfirm, onOpenChange }: ProjectNameDialogProps) => {
  const [name, setName] = useState(defaultValue || "");

  useEffect(() => {
    if (open) setName(defaultValue || "");
  }, [open, defaultValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Nome do projeto
          </DialogTitle>
          <DialogDescription>
            Dê um nome para você encontrar depois (ex: “Cliente João · Obra Apto 32”).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="projectName">Nome</Label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cliente · Obra / Ambiente"
              className="h-11"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Depois
            </Button>
            <Button
              onClick={() => {
                const finalName = (name || "").trim();
                onConfirm(finalName || "Projeto sem nome");
              }}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar nome
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectNameDialog;