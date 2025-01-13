import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Agency = Tables<"agencies">;

interface AgencyContextType {
  agency: Agency | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const { agencySlug } = useParams();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgency = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("slug", agencySlug)
        .single();

      if (error) throw error;
      setAgency(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch agency"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (agencySlug) {
      fetchAgency();
    }
  }, [agencySlug]);

  return (
    <AgencyContext.Provider
      value={{ agency, isLoading, error, refetch: fetchAgency }}
    >
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgencyContext() {
  const context = useContext(AgencyContext);
  if (context === undefined) {
    throw new Error("useAgencyContext must be used within an AgencyProvider");
  }
  return context;
}