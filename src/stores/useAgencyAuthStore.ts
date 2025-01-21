import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

interface AgencyAuthStore {
  logout: () => Promise<void>;
}

export const useAgencyAuthStore = create<AgencyAuthStore>((set) => ({
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },
}));