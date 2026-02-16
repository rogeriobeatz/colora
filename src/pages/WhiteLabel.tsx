import { useParams } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import Simulator from "./Simulator";
import { Palette, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const WhiteLabel = () => {
  const { slug } = useParams<{ slug: string }>();
  const { company, setCompany } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('company_slug', slug)
          .single();

        if (error || !data) {
          console.error("Error fetching company:", error);
          setError(true);
        } else {
          // Update store with fetched company data
          setCompany({
            id: data.id,
            name: data.company_name || "Minha Loja",
            slug: data.company_slug || slug,
            primaryColor: data.primary_color || "#1a8a6a",
            secondaryColor: data.secondary_color || "#e87040",
            logo: data.avatar_url || undefined,
            catalogs: company?.catalogs || [] // Keep existing catalogs if any, or we might need to fetch them too if we had a catalogs table
          });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !company || company.slug !== slug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Empresa não encontrada</h1>
          <p className="text-muted-foreground text-sm">Verifique o endereço e tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Custom branding bar */}
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(90deg, ${company.primaryColor}, ${company.secondaryColor})`,
        }}
      />
      <Simulator companySlug={slug} />
    </div>
  );
};

export default WhiteLabel;
