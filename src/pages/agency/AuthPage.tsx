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

  useEffect(() => {
    // Check if there's already a session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoading(true);
        handleUserRole(session.user.id);
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoading(true);
        setError(null);
        await handleUserRole(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, agency?.slug, agency?.id]);

  const handleUserRole = async (userId: string) => {
    try {
      console.log('Checking user role for:', userId);
      
      // Check if user is an agency
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('user_id', userId)
        .eq('slug', agency?.slug)
        .single();

      if (agencyError) {
        console.error('Error checking agency role:', agencyError);
        throw new Error("Erreur lors de la vérification du rôle de l'agence");
      }

      if (agencyData) {
        console.log('User is an agency:', agencyData);
        navigate(`/${agency?.slug}/agency/dashboard`);
        return;
      }

      // Check if user is an agent
      const { data: agentData, error: agentError } = await supabase
        .from('real_estate_agents')
        .select('*')
        .eq('user_id', userId)
        .eq('agency_id', agency?.id)
        .single();

      if (agentError && agentError.code !== 'PGRST116') {
        console.error('Error checking agent role:', agentError);
        throw new Error("Erreur lors de la vérification du rôle de l'agent");
      }

      if (agentData) {
        console.log('User is an agent:', agentData);
        navigate(`/${agency?.slug}/agent/dashboard`);
        return;
      }

      // Check if user is a client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .eq('agency_id', agency?.id)
        .single();

      if (clientError && clientError.code !== 'PGRST116') {
        console.error('Error checking client role:', clientError);
        throw new Error("Erreur lors de la vérification du rôle du client");
      }

      if (clientData) {
        console.log('User is a client:', clientData);
        navigate(`/${agency?.slug}/client/dashboard`);
        return;
      }

      // If no role is found for this agency
      console.log('No role found for this user in this agency');
      throw new Error("Vous n'avez pas accès à cette agence");
      
    } catch (error) {
      console.error('Error in handleUserRole:', error);
      let message = "Une erreur est survenue";
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
              },
            }}
          />
        </Card>
      </div>
    </div>
  );
}