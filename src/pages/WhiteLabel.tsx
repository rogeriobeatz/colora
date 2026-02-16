import { useParams } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import Simulator from "./Simulator";
import { Palette } from "lucide-react";

const WhiteLabel = () => {
  const { slug } = useParams<{ slug: string }>();
  const { company } = useStore();

  if (!company || company.slug !== slug) {
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
