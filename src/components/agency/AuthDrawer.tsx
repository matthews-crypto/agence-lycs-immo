import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { X } from "lucide-react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useAgencyAuthStore } from "@/stores/useAgencyAuthStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDrawer({ open, onOpenChange }: AuthDrawerProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { agency } = useAgencyContext();
  const { login, isLoading, error } = useAgencyAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agency?.slug) {
      toast.error("Une erreur est survenue");
      return;
    }

    try {
      const result = await login(email, password, agency.slug);
      if (result.error) {
        toast.error("Login ou mot de passe incorrect");
        return;
      }
      onOpenChange(false);
      navigate(`/${agency.slug}/agency/dashboard`);
      toast.success("Connexion réussie");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login ou mot de passe incorrect");
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed right-0 top-0 bottom-0 w-[400px] bg-white">
          <div className="h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light">
                {isLogin ? "Connectez-vous" : "Créez un compte"}
              </h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>
              {!isLogin && (
                <div>
                  <Input
                    type="password"
                    placeholder="Confirmez le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
              <Button 
                type="submit"
                className="w-full"
                disabled={isLoading}
                style={{
                  backgroundColor: agency?.primary_color || '#000000',
                }}
              >
                {isLogin ? "Se connecter" : "S'inscrire"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                onClick={() => setIsLogin(!isLogin)}
                style={{
                  color: agency?.primary_color || '#000000',
                }}
              >
                {isLogin 
                  ? "Pas encore de compte ? Inscrivez-vous" 
                  : "Déjà un compte ? Connectez-vous"}
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}