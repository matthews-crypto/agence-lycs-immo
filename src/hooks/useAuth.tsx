import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthStateChange = useCallback(async (event: string, currentSession: Session | null) => {
    console.log("Auth state change event:", event);
    
    if (event === 'SIGNED_OUT') {
      setSession(null);
      // Clear any local session data
      await supabase.auth.signOut();
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      setSession(currentSession);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    console.log("Initializing auth hook...");
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          toast.error("Erreur lors de la récupération de la session");
          return;
        }

        if (mounted) {
          console.log("Initial session state:", initialSession ? "Active" : "No session");
          if (!initialSession) {
            // Clear any stale session data
            await supabase.auth.signOut();
          }
          setSession(initialSession);
        }
      } catch (error) {
        console.error("Unexpected error during auth initialization:", error);
        toast.error("Une erreur inattendue s'est produite");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log("Cleaning up auth hook subscription");
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  return { session, isLoading };
}