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
  
  setAuthenticated: (value: boolean) => {
    console.log("Setting authenticated state to:", value);
    set({ isAuthenticated: value, isLoading: false });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Starting login process for:", email);

      // Nettoyer toute session existante d'abord
      console.log("Cleaning existing sessions...");
      await supabase.auth.signOut();
      console.log("Existing sessions cleaned");

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      console.log("Sign in successful, checking user data");

      if (!signInData.user) {
        console.error("No user data received");
        throw new Error("No user data received");
      }

      // Utiliser la fonction rpc is_admin pour vérifier le statut d'administrateur
      const { data: isAdmin, error: adminCheckError } = await supabase
        .rpc('is_admin', { user_id: signInData.user.id });

      if (adminCheckError) {
        console.error("Admin check error:", adminCheckError);
        throw adminCheckError;
      }

      if (!isAdmin) {
        console.error("User is not an admin");
        throw new Error("Unauthorized: Not an admin user");
      }

      console.log("Admin check successful, setting authenticated state");
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
      console.log("Starting logout process");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        throw error;
      }
      console.log("Logout successful");
      set({ isAuthenticated: false });
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error("Logout error:", error);
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