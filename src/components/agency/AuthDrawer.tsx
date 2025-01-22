import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { X } from "lucide-react";

interface AuthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDrawer({ open, onOpenChange }: AuthDrawerProps) {
  const [isLogin, setIsLogin] = useState(true);

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

            <form className="space-y-4 flex-1">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  className="w-full"
                />
              </div>
              {!isLogin && (
                <div>
                  <Input
                    type="password"
                    placeholder="Confirmez le mot de passe"
                    className="w-full"
                  />
                </div>
              )}
              <Button className="w-full">
                {isLogin ? "Se connecter" : "S'inscrire"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                onClick={() => setIsLogin(!isLogin)}
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