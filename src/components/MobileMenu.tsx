import { useState } from "react";
import { Menu, X, Settings, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { company } = useStore();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    onClose();
  };

  const handleProfile = () => {
    navigate("/dashboard");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50 md:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {company?.logo ? (
              <img 
                src={company.logo} 
                alt={company.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {company?.name?.charAt(0) || 'C'}
                </span>
              </div>
            )}
            <span className="font-display font-semibold text-foreground">
              {company?.name || 'Colora'}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 pb-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={handleProfile}
          >
            <User className="h-4 w-4" />
            <span>Meu Perfil</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => {
              navigate("/simulator");
              onClose();
            }}
          >
            <Settings className="h-4 w-4" />
            <span>Simulador</span>
          </Button>

          <div className="border-t border-border pt-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
