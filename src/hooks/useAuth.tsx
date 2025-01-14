import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Initializing auth hook...")
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting initial session:", error)
      } else {
        console.log("Initial session state:", session ? "Active" : "No session")
      }
      setSession(session)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change in hook:", event)
      setSession(session)
      setIsLoading(false)
    })

    return () => {
      console.log("Cleaning up auth hook subscription")
      subscription.unsubscribe()
    }
  }, [])

  return { session, isLoading }
}