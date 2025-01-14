import { useAgencyContext } from "@/contexts/AgencyContext";
import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { toast } from "sonner";

export default function AgencyAuthPage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoading(true);
        try {
          // Check if user is an agency
          const { data: agencyData } = await supabase
            .from('agencies')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('slug', agency?.slug)
            .single();

          if (agencyData) {
            navigate(`/${agency?.slug}/agency/dashboard`);
            return;
          }

          // Check if user is an agent
          const { data: agentData } = await supabase
            .from('real_estate_agents')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('agency_id', agency?.id)
            .single();

          if (agentData) {
            navigate(`/${agency?.slug}/agent/dashboard`);
            return;
          }

          // Check if user is a client
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('agency_id', agency?.id)
            .single();

          if (clientData) {
            navigate(`/${agency?.slug}/client/dashboard`);
            return;
          }

          // If no role is found for this agency
          toast.error("Vous n'avez pas accès à cette agence");
          await supabase.auth.signOut();
          
        } catch (error) {
          console.error('Error checking user role:', error);
          toast.error("Une erreur est survenue lors de la vérification de votre rôle");
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
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
          />
        </Card>
      </div>
    </div>
  );
}