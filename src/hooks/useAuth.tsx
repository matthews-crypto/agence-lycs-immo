import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Initializing auth hook...");
    
    // Fonction pour récupérer et définir la session
    const setServerSession = async () => {
      try {
        const { data: { session: serverSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting server session:", error);
          return;
        }
        
        if (serverSession) {
          console.log("Server session found:", serverSession.user.email);
          setSession(serverSession);
        } else {
          console.log("No server session found");
          setSession(null);
        }
      } catch (error) {
        console.error("Unexpected error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialiser la session au chargement
    setServerSession();

    // Écouter les changements d'état d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state change:", event, currentSession?.user?.email);
      
      if (event === 'SIGNED_IN') {
        setSession(currentSession);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
        setIsLoading(false);
      }
    });

    // Nettoyer la souscription
    return () => {
      console.log("Cleaning up auth hook subscription");
      subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}