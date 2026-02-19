import { Company } from "@/data/defaultColors";
import { MapPin, Phone, Globe } from "lucide-react";

function normalizeWebsite(url: string) {
  const v = (url || "").trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

const StoreFooter = ({ company }: { company: Company }) => {
  const phone = (company.phone || "").trim();
  const website = (company.website || "").trim();
  const address = (company.address || "").trim();

  const hasAny = !!(phone || website || address);

  if (!hasAny) {
    return (
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {company.name}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-5 md:grid-cols-[1fr_1fr] items-start">
          <div className="min-w-0">
            <p className="text-sm font-display font-bold text-foreground">{company.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              © {new Date().getFullYear()} · Simulação de cores
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {address && (
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-foreground/90 leading-relaxed break-words">{address}</p>
              </div>
            )}

            {phone && (
              <div className="flex items-start gap-2 min-w-0">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-foreground/90 leading-relaxed break-words">{phone}</p>
              </div>
            )}

            {website && (
              <div className="flex items-start gap-2 min-w-0">
                <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <a
                  href={normalizeWebsite(website)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline break-words"
                >
                  {website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;