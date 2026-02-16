import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import Simulator from "./Simulator";
import { Palette, Loader2 } from "lucide-react";

const WhiteLabel = () => {
  const { slug } = useParams<{ slug: string }>();
  const { company, loading, fetchCompanyBySlug } = useStore();

  useEffect(() => {
    if (slug) fetchCompanyBySlug(slug);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-display font-bold mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground">O link pode estar incorreto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${company.primaryColor}, ${company.secondaryColor})` }} />
      <div className="bg-white border-b border-border py-3 px-4 flex items-center gap-3">
        {company.logo ? (
          <img src={company.logo} alt={company.name} className="h-8 w-auto object-contain" />
        ) : (
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Palette className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="font-display font-bold text-foreground">{company.name}</span>
      </div>
      <Simulator companySlug={slug} />
    </div>
  );
};

export default WhiteLabel;