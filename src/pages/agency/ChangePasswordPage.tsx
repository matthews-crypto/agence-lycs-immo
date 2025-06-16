import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyAuthStore } from "@/stores/useAgencyAuthStore";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { agency } = useAgencyContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userRole, user } = useAgencyAuthStore();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Vérifier si l'utilisateur est connecté et doit changer son mot de passe
  useEffect(() => {
    const checkAuth = async () => {
      console.log("ChangePasswordPage - Checking authentication...");
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log("ChangePasswordPage - Session:", session);
      console.log("ChangePasswordPage - User role from store:", userRole);
      console.log("ChangePasswordPage - User from store:", user);
      
      if (!session) {
        console.log("ChangePasswordPage - No session, redirecting to auth");
        // Rediriger vers la page de connexion si non connecté
        if (agency?.slug) {
          navigate(`/${agency.slug}/agency/auth`);
        }
        return;
      }
      
      const mustChangePassword = session.user?.user_metadata?.must_change_password;
      const sessionUserRole = session.user?.user_metadata?.role;
      
      console.log("ChangePasswordPage - Must change password:", mustChangePassword);
      console.log("ChangePasswordPage - User role from session:", sessionUserRole);
      
      if (!mustChangePassword) {
        console.log("ChangePasswordPage - No need to change password, redirecting to dashboard");
        // Rediriger vers le dashboard approprié si pas besoin de changer le mot de passe
        if (agency?.slug) {
          // Utiliser le rôle de la session plutôt que celui du store qui peut être null
          if (sessionUserRole === 'proprietaire') {
            console.log("ChangePasswordPage - Redirecting to proprietaire dashboard");
            navigate(`/${agency.slug}/proprietaire/dashboard`);
          } else {
            console.log("ChangePasswordPage - Redirecting to admin dashboard");
            navigate(`/${agency.slug}/agency/services`);
          }
        }
      }
    };
    
    checkAuth();
  }, [navigate, agency?.slug, userRole, user]);

  const onSubmit = async (values: FormValues) => {
    try {
      console.log("ChangePasswordPage - Submitting password change");
      setIsLoading(true);
      setError(null);
      
      // Obtenir la session actuelle pour vérifier le rôle
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUserRole = session?.user?.user_metadata?.role;
      
      console.log("ChangePasswordPage - Current session in onSubmit:", session);
      console.log("ChangePasswordPage - User role from session in onSubmit:", sessionUserRole);
      
      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      });
      
      if (updateError) throw updateError;
      
      // Mettre à jour les métadonnées pour retirer le flag must_change_password
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          must_change_password: false,
        }
      });
      
      if (metadataError) throw metadataError;
      
      toast({
        title: "Mot de passe modifié avec succès",
        description: "Vous allez être redirigé vers votre tableau de bord.",
      });
      
      console.log("ChangePasswordPage - Password changed successfully, redirecting soon...");
      
      // Rediriger vers le dashboard approprié
      setTimeout(() => {
        if (agency?.slug) {
          // Utiliser le rôle de la session plutôt que celui du store
          if (sessionUserRole === 'proprietaire') {
            console.log("ChangePasswordPage - Redirecting to proprietaire dashboard after password change");
            navigate(`/${agency.slug}/proprietaire/dashboard`);
          } else {
            console.log("ChangePasswordPage - Redirecting to admin dashboard after password change");
            navigate(`/${agency.slug}/agency/services`);
          }
        }
      }, 2000);
      
    } catch (error) {
      console.error("Password change error:", error);
      // Typer l'erreur comme AuthError de Supabase ou Error standard
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors du changement de mot de passe";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
      style={{
        backgroundColor: agency?.primary_color || '#ffffff',
        color: agency?.secondary_color || '#000000'
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Changement de mot de passe obligatoire
          </CardTitle>
          <CardDescription>
            Pour des raisons de sécurité, vous devez changer votre mot de passe par défaut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Modification en cours..." : "Changer mon mot de passe"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
