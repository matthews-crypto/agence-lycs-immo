import { useAgencyContext } from "@/contexts/AgencyContext";
import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AgencyRegisterPage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        navigate(`/${agency?.slug}/client/dashboard`);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, agency?.slug]);

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
            Inscription chez {agency?.agency_name}
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
            view="sign_up"
          />
        </Card>
      </div>
    </div>
  );
}