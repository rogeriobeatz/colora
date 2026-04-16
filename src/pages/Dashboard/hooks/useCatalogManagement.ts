import { useState, useRef } from "react";
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";
import { Paint } from "@/data/defaultColors";

export const useCatalogManagement = () => {
  const { company, addCatalog, updateCatalog, deleteCatalog, importPaintsCSV, exportPaintsCSV, updateCompanyLocal } = useStore();
  
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCatalogName, setNewCatalogName] = useState("");
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [editingCatalogName, setEditingCatalogName] = useState("");
  
  // Estados de cores
  const [paintDialogOpen, setPaintDialogOpen] = useState(false);
  const [editingPaint, setEditingPaint] = useState<Paint | null>(null);
  const [isSavingPaint, setIsSavingPaint] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Catálogo ativo
  const activeCatalog = company?.catalogs.find(
    (c) => c.id === (selectedCatalogId || company?.catalogs[0]?.id)
  ) || company?.catalogs[0];

  // Cores filtradas
  const filteredPaints = activeCatalog?.paints.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Categorias
  const categories = activeCatalog ? [...new Set(activeCatalog.paints.map((p) => p.category))] : [];

  // Handlers
  const handleAddCatalog = async () => {
    if (!newCatalogName.trim()) {
      toast.error("Digite um nome para o catálogo");
      return;
    }

    try {
      await addCatalog({
        name: newCatalogName.trim(),
        active: true,
      });
      setNewCatalogName("");
      toast.success("Catálogo adicionado!");
    } catch (error) {
      console.error("Erro ao adicionar catálogo:", error);
      toast.error("Erro ao adicionar catálogo");
    }
  };

  const handleDeleteCatalog = async (catalogId: string) => {
    if (!company) return;

    const catalog = company.catalogs.find(c => c.id === catalogId);
    if (!catalog) return;

    if (catalog.paints.length > 0) {
      toast.error("Não é possível excluir um catálogo com cores. Exclua as cores primeiro.");
      return;
    }

    try {
      await deleteCatalog(catalogId);
      toast.success("Catálogo excluído!");
    } catch (error) {
      console.error("Erro ao excluir catálogo:", error);
      toast.error("Erro ao excluir catálogo");
    }
  };

  const handleEditCatalog = (catalogId: string) => {
    const catalog = company?.catalogs.find(c => c.id === catalogId);
    if (!catalog) return;

    setEditingCatalogId(catalogId);
    setEditingCatalogName(catalog.name || "");
  };

  const handleSaveCatalog = async () => {
    if (!editingCatalogId || !editingCatalogName.trim()) return;

    try {
      await updateCatalog(editingCatalogId, {
        name: editingCatalogName.trim()
      });
      setEditingCatalogId(null);
      setEditingCatalogName("");
      toast.success("Catálogo atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar catálogo:", error);
      toast.error("Erro ao atualizar catálogo");
    }
  };

  const handleToggleCatalog = async (catalogId: string, active: boolean) => {
    console.log('handleToggleCatalog called:', catalogId, active);
    try {
      await updateCatalog(catalogId, { active });
      toast.success(active ? "Catálogo ativado!" : "Catálogo desativado!");
    } catch (error) {
      console.error("Erro ao alternar catálogo:", error);
      toast.error("Erro ao alternar catálogo");
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const csvText = await file.text();
      const catalogId = selectedCatalogId || company?.catalogs[0]?.id;
      if (!catalogId) return;
      importPaintsCSV(catalogId, csvText);
      toast.success("Cores importadas com sucesso!");
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao importar cores");
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportPaintsCSV(selectedCatalogId || company?.catalogs[0]?.id);
      toast.success("Cores exportadas!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar cores");
    }
  };

  const handleAddPaint = () => {
    setEditingPaint(null);
    setPaintDialogOpen(true);
  };

  const handleEditPaint = (paint: Paint) => {
    setEditingPaint(paint);
    setPaintDialogOpen(true);
  };

  const handleSavePaint = async (paint: Partial<Paint>) => {
    if (!company) return;

    const catalogId = selectedCatalogId || company.catalogs[0]?.id;
    if (!catalogId) return;

    try {
      setIsSavingPaint(true);

      if (editingPaint) {
        // Atualizar tinta existente
        const updatedCatalogs = company.catalogs.map((cat) =>
          cat.id === catalogId
            ? {
                ...cat,
                paints: cat.paints.map((p) =>
                  p.id === editingPaint.id ? { ...p, ...paint } : p
                )
              }
            : cat
        );

        // Atualizar estado local
        await updateCompanyLocal({ catalogs: updatedCatalogs });
      } else {
        // Adicionar nova tinta
        const newPaint = {
          id: Math.random().toString(36).substring(2, 10),
          name: paint.name!,
          code: paint.code!,
          hex: paint.hex!,
          rgb: paint.rgb!,
          cmyk: paint.cmyk!,
          category: paint.category!
        };

        // Atualizar estado local
        const updatedCatalogs = company.catalogs.map((cat) =>
          cat.id === catalogId
            ? { ...cat, paints: [...cat.paints, newPaint] }
            : cat
        );

        await updateCompanyLocal({ catalogs: updatedCatalogs });
      }
    } catch (error) {
      console.error("Erro na operação de tinta:", error);
    }

    setIsSavingPaint(false);
    setPaintDialogOpen(false);
    toast.success(editingPaint ? "Cor atualizada!" : "Cor adicionada!");
  };

  const handleDeletePaint = async (paintId: string) => {
    const catalogId = selectedCatalogId || company?.catalogs[0]?.id;
    if (!catalogId || !company) return;

    // Atualiza estado local
    const updatedCatalogs = company.catalogs.map((cat) =>
      cat.id === catalogId ? { ...cat, paints: cat.paints.filter((p) => p.id !== paintId) } : cat
    );

    await updateCompanyLocal({ catalogs: updatedCatalogs });
    toast.success("Cor excluída!");
  };

  return {
    // Estado
    selectedCatalogId,
    setSelectedCatalogId,
    searchTerm,
    setSearchTerm,
    newCatalogName,
    setNewCatalogName,
    editingCatalogId,
    setEditingCatalogId,
    editingCatalogName,
    setEditingCatalogName,
    paintDialogOpen,
    setPaintDialogOpen,
    editingPaint,
    setEditingPaint,
    isSavingPaint,
    fileInputRef,
    
    // Dados derivados
    activeCatalog,
    filteredPaints,
    categories,
    
    // Handlers
    handleAddCatalog,
    handleDeleteCatalog,
    handleEditCatalog,
    handleSaveCatalog,
    handleToggleCatalog,
    handleImportCSV,
    handleExportCSV,
    handleAddPaint,
    handleEditPaint,
    handleSavePaint,
    handleDeletePaint
  };
};
