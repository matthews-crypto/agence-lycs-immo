import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";

interface AgencyAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  setAuthenticated: (value: boolean) => void;
  login: (email: string, password: string, agencySlug: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAgencyAuthStore = create<AgencyAuthState>((set) => ({
  isLoading: false,
  isAuthenticated: false,
  error: null,
  
  setAuthenticated: (value: boolean) => {
    console.log("Setting agency authenticated state to:", value);
    set({ isAuthenticated: value, isLoading: false });
  },

  login: async (email: string, password: string, agencySlug: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Starting agency login process for:", email);
      console.log("Agency slug:", agencySlug);

      // 1. Vérifier d'abord si l'agence existe
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('slug', agencySlug)
        .single();

      if (agencyError) {
        console.error("Agency check error:", agencyError);
        throw new Error("Cette agence n'existe pas");
      }

      console.log("Agency found:", agencyData);

      // 2. Tentative de connexion
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      console.log("Sign in successful, checking agency association");

      if (!signInData.user) {
        console.error("No user data received");
        throw new Error("No user data received");
      }

      // 3. Vérifier si l'utilisateur est associé à l'agence
      const { data: userAgencyData, error: userAgencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('user_id', signInData.user.id)
        .eq('slug', agencySlug)
        .single();

      if (userAgencyError) {
        console.error("User-agency check error:", userAgencyError);
        throw new Error("Vous n'avez pas accès à cette agence");
      }

      if (!userAgencyData) {
        console.error("User is not associated with this agency");
        throw new Error("Vous n'avez pas accès à cette agence");
      }

      if (!userAgencyData.is_active) {
        console.error("Agency is not active");
        throw new Error("Cette agence n'est pas active");
      }

      console.log("Agency check successful, setting authenticated state");
      set({ isAuthenticated: true, error: null });
      toast.success("Connexion réussie");
    } catch (error) {
      console.error("Login error:", error);
      let message = "Échec de la connexion";
      if (error instanceof AuthError) {
        switch (error.message) {
          case 'Invalid login credentials':
            message = "Email ou mot de passe incorrect";
            break;
          case 'Email not confirmed':
            message = "Veuillez confirmer votre email avant de vous connecter";
            break;
          default:
            message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      set({ error: message, isAuthenticated: false });
      toast.error(message);
      await supabase.auth.signOut();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log("Starting agency logout process");
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