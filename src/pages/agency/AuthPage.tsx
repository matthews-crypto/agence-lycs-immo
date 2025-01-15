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
      console.log('Checking user role for:', userId);
      setIsLoading(true);
      setError(null);

      // First, check if user is an agency owner
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('user_id', userId)
        .eq('slug', agency?.slug)
        .single();

      if (agencyData) {
        console.log('User is agency owner, redirecting to agency dashboard');
        navigate(`/${agency?.slug}/agency/dashboard`);
        return;
      }

      // Then, check if user is an agent
      const { data: agentData } = await supabase
        .from('real_estate_agents')
        .select('*')
        .eq('user_id', userId)
        .eq('agency_id', agency?.id)
        .single();

      if (agentData) {
        console.log('User is agent, redirecting to agent dashboard');
        navigate(`/${agency?.slug}/agent/dashboard`);
        return;
      }

      // Finally, check if user is a client
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .eq('agency_id', agency?.id)
        .single();

      if (clientData) {
        console.log('User is client, redirecting to client dashboard');
        navigate(`/${agency?.slug}/client/dashboard`);
        return;
      }

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
  }, [navigate, agency?.slug, agency?.id]);

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