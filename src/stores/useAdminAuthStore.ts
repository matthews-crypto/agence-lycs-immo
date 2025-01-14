import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";

interface AdminAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  setAuthenticated: (value: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  isLoading: false,
  isAuthenticated: false,
  error: null,
  
  setAuthenticated: (value: boolean) => set({ isAuthenticated: value, isLoading: false }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Starting login process for:", email);

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (!signInData.user) {
        throw new Error("No user data received");
      }

      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", signInData.user.id)
        .maybeSingle();

      if (adminError) throw adminError;
      
      if (!adminData) {
        throw new Error("Unauthorized: Not an admin user");
      }

      set({ isAuthenticated: true, error: null });
      toast.success("Connexion réussie");
    } catch (error) {
      console.error("Login error:", error);
      let message = "Échec de la connexion";
      if (error instanceof AuthError) {
        message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      set({ error: message, isAuthenticated: false });
      toast.error(message);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ isAuthenticated: false });
      toast.success("Déconnexion réussie");
    } catch (error) {
      let message = "Échec de la déconnexion";
      if (error instanceof Error) {
        message = error.message;
      }
      set({ error: message });
      toast.error(message);
    } finally {
      set({ isLoading: false });
    }
  },
}));