// ... existing imports

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    company, updateCompany, addCatalog, updateCatalog, deleteCatalog,
    importPaintsCSV, exportPaintsCSV, refreshData
  } = useStore();

// ... existing state and effects

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      const { error } = await (supabase.from('profiles') as any).upsert({
        id: user.id,
        company_name: company.name,
        company_slug: company.slug,
        primary_color: company.primaryColor,
        secondary_color: company.secondaryColor,
        avatar_url: company.logo,

        company_phone: company.phone || null,
        company_website: company.website || null,
        company_address: company.address || null,
        header_content: company.headerContent || "logo+name",
        header_style: company.headerStyle || "glass",
        font_set: company.fontSet || "grotesk",

        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }); // Especifica a chave de conflito
      
      if (error) throw error;
      
      // Recarrega os dados do banco para garantir que o estado local esteja sincronizado
      await refreshData();
      
      toast.success("Identidade visual salva!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

// ... rest of the component