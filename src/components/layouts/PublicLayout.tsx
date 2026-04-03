import { Link } from "react-router-dom";
import logoSvg from "@/assets/colora-logo.svg";

interface PublicLayoutProps {
  children: React.ReactNode;
  maxWidth?: string;
  showBackLink?: boolean;
  backLinkText?: string;
  backLinkTo?: string;
}

const PublicLayout = ({
  children,
  maxWidth = "max-w-4xl",
  showBackLink = true,
  backLinkText = "← Voltar para home",
  backLinkTo = "/",
}: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Shared Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoSvg} alt="Logotipo Colora" className="w-32" />
          </Link>
          {showBackLink && (
            <Link
              to={backLinkTo}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {backLinkText}
            </Link>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1">
        <div className={`container mx-auto ${maxWidth} py-12 px-4`}>
          {children}
        </div>
      </main>

      {/* Shared Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Colora. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
