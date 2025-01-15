import { useAgencyContext } from "@/contexts/AgencyContext";
import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError } from "@supabase/supabase-js";

export default function AgencyAuthPage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserRole = async (userId: string) => {
    try {
      console.log('Checking if user is agency owner:', userId);
      setIsLoading(true);
      setError(null);

      // Vérifier uniquement dans la table agencies
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('user_id', userId)
        .eq('slug', agency?.slug)
        .single();

      if (agencyError) {
        console.error('Error checking agency role:', agencyError);
        throw agencyError;
      }

      if (agencyData) {
        console.log('User is agency owner, redirecting to dashboard');
        navigate(`/${agency?.slug}/agency/dashboard`);
        return;
      }

      // Si on arrive ici, l'utilisateur n'est pas une agence
      console.error('User is not associated with this agency');
      throw new Error("Vous n'avez pas accès à cette agence");
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      let message = "Une erreur est survenue lors de la vérification de votre rôle";
      
      if (error instanceof Error) {
        message = error.message;
      }
      
      setError(message);
      toast.error(message);
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await checkUserRole(session.user.id);
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await checkUserRole(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, agency?.slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{
        backgroundColor: agency?.primary_color || '#ffffff',
        color: agency?.secondary_color || '#000000'
      }}
    >
      <div className="container max-w-md mx-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Connexion à {agency?.agency_name}
          </h1>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: agency?.secondary_color || '#000000',
                    brandAccent: agency?.primary_color || '#ffffff',
                  },
                },
              },
            }}
            providers={[]}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Adresse email',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                  loading_button_label: 'Connexion en cours...',
                  email_input_placeholder: 'Votre adresse email',
                  password_input_placeholder: 'Votre mot de passe',
                },
                sign_up: {
                  email_label: 'Adresse email',
                  password_label: 'Mot de passe',
                  button_label: "S'inscrire",
                  loading_button_label: 'Inscription en cours...',
                  email_input_placeholder: 'Votre adresse email',
                  password_input_placeholder: 'Votre mot de passe',
                },
              },
            }}
          />
        </Card>
      </div>
    </div>
  );
}