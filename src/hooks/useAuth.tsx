import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Initializing auth hook...");
    
    // Get initial session from localStorage if available
    const savedSession = localStorage.getItem('supabase.auth.token');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession.currentSession);
      } catch (error) {
        console.error("Error parsing saved session:", error);
      }
    }
    
    // Get initial session from Supabase
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting initial session:", error);
      } else {
        console.log("Initial session state:", session ? "Active" : "No session");
        if (session) {
          setSession(session);
          // Save session to localStorage
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            currentSession: session
          }));
        }
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change in hook:", event);
      if (session) {
        setSession(session);
        // Update session in localStorage
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          currentSession: session
        }));
      } else {
        setSession(null);
        // Remove session from localStorage
        localStorage.removeItem('supabase.auth.token');
      }
      setIsLoading(false);
    });

    return () => {
      console.log("Cleaning up auth hook subscription");
      subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}