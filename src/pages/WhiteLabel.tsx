import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import Simulator from "./Simulator";
import { Palette, Loader2 } from "lucide-react";
import StoreFooter from "@/components/StoreFooter";
import { cn } from "@/lib/utils";

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

  const headerStyle = company.headerStyle ?? "glass";
  const headerContent = company.headerContent ?? "logo+name";
  const isPrimaryHeader = headerStyle === "primary";

  const showLogo = headerContent === "logo+name" || headerContent === "logo";
  const showName = headerContent === "logo+name" || headerContent === "name";

  const barClass = cn(
    "border-b border-border",
    headerStyle === "glass" && "bg-background/80 backdrop-blur-lg",
    (headerStyle === "white" || headerStyle === "white-accent") && "bg-white",
    isPrimaryHeader && "bg-transparent",
  );

  const barStyle = isPrimaryHeader ? { backgroundColor: company.primaryColor } : undefined;
  const titleClass = isPrimaryHeader ? "text-white" : "text-foreground";

  return (
    <div className="min-h-screen flex flex-col">
      {headerStyle === "white-accent" && (
        <div
          className="h-1.5"
          style={{ background: `linear-gradient(90deg, ${company.primaryColor}, ${company.secondaryColor})` }}
        />
      )}

      <div className={cn("py-3 px-4 flex items-center gap-3", barClass)} style={barStyle}>
        {showLogo && (
          <>
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="h-8 w-auto object-contain" />
            ) : (
              <div
                className="w-8 h-8 rounded flex items-center justify-center"
                style={{ backgroundColor: isPrimaryHeader ? "rgba(255,255,255,0.18)" : company.primaryColor }}
              >
                <Palette className="w-4 h-4 text-white" />
              </div>
            )}
          </>
        )}

        {showName && <span className={cn("font-display font-bold truncate", titleClass)}>{company.name}</span>}
      </div>

      <div className="flex-1">
        <Simulator companySlug={slug} />
      </div>

      <StoreFooter company={company} />
    </div>
  );
};

export default WhiteLabel;