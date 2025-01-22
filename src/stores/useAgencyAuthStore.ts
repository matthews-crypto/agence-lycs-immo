import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

interface AgencyAuthStore {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string, agencySlug: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

export const useAgencyAuthStore = create<AgencyAuthStore>((set) => ({
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (email: string, password: string, agencySlug: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // First, check if the user exists and is associated with the agency
      const { data: agencies } = await supabase
        .from("agencies")
        .select("*")
        .eq("slug", agencySlug)
        .eq("contact_email", email)
        .single();

      if (!agencies) {
        return { error: "Agency not found or email not associated with this agency" };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };

      set({ isAuthenticated: true });
      return {};
    } catch (error) {
      console.error("Login error:", error);
      return { 
        error: error instanceof Error ? error.message : "An error occurred during login" 
      };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ isAuthenticated: false });
    } catch (error) {
      console.error("Logout error:", error);
      set({ 
        error: error instanceof Error ? error.message : "An error occurred during logout" 
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));