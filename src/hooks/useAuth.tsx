import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Initializing auth hook...");
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting initial session:", error);
        toast.error("Error getting session");
      } else {
        console.log("Initial session state:", session ? "Active" : "No session");
        if (!session) {
          // Clear any stale session data
          supabase.auth.signOut().catch(console.error);
        }
      }
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change in hook:", event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token was refreshed successfully');
      }
      
      if (event === 'SIGNED_OUT') {
        // Clear any local session data
        setSession(null);
      }

      setSession(session);
      setIsLoading(false);
    });

    return () => {
      console.log("Cleaning up auth hook subscription");
      subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}