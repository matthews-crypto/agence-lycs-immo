
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { X } from "lucide-react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useAgencyAuthStore } from "@/stores/useAgencyAuthStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AuthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDrawer({ open, onOpenChange }: AuthDrawerProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { agency } = useAgencyContext();
  const { login, isLoading } = useAgencyAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agency?.slug) {
      toast.error("Une erreur est survenue");
      return;
    }

    const result = await login(email, password, agency.slug);
    if (result.error) {
      toast.error("Login ou mot de passe incorrect");
      return;
    }
    
    onOpenChange(false);
    navigate(`/${agency.slug}/agency/dashboard`);
    toast.success("Connexion réussie");
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${agency?.slug}/reset-password`,
      });

      if (error) {
        toast.error("Une erreur est survenue lors de l'envoi du mail");
        return;
      }

      setResetEmailSent(true);
      toast.success("Un email de réinitialisation vous a été envoyé");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Une erreur est survenue lors de l'envoi du mail");
    }
  };
  
  const resetForm = () => {
    setEmail("");
    setPassword("");
    setIsForgotPassword(false);
    setResetEmailSent(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed right-0 top-0 bottom-0 w-[400px] bg-white">
          <div className="h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light">
                {isForgotPassword ? "Mot de passe oublié" : "Connectez-vous"}
              </h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!isForgotPassword ? (
              <>
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
                  <Button 
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    style={{
                      backgroundColor: agency?.primary_color || '#000000',
                    }}
                  >
                    Se connecter
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Button 
                    variant="link" 
                    onClick={() => setIsForgotPassword(true)}
                    style={{
                      color: agency?.primary_color || '#000000',
                    }}
                  >
                    Mot de passe oublié ?
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-6 flex-1">
                {!resetEmailSent ? (
                  <>
                    <p className="text-gray-600 mb-4">
                      Veuillez entrer votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                    </p>
                    <div className="space-y-4">
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full"
                      />
                      <Button 
                        onClick={handleForgotPassword}
                        className="w-full"
                        style={{
                          backgroundColor: agency?.primary_color || '#000000',
                        }}
                      >
                        Envoyer le lien de réinitialisation
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-green-800 mb-2 font-medium">Email envoyé !</p>
                      <p className="text-green-700 text-sm">
                        Un lien de réinitialisation a été envoyé à {email}. Veuillez vérifier votre boîte de réception et suivre les instructions.
                      </p>
                    </div>
                    <Button 
                      onClick={() => setIsForgotPassword(false)}
                      style={{
                        backgroundColor: agency?.primary_color || '#000000',
                      }}
                    >
                      Retour à la connexion
                    </Button>
                  </div>
                )}
                
                {!resetEmailSent && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="link" 
                      onClick={() => setIsForgotPassword(false)}
                      style={{
                        color: agency?.primary_color || '#000000',
                      }}
                    >
                      Retour à la connexion
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
