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
      // 1. Nettoyer toute session existante
      await supabase.auth.signOut();
      
      console.log("Attempting login with:", { email, agencySlug });
      
      // 2. Tenter la connexion avec plus de logs
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log("Auth response:", { data, error });
      
      if (error) throw error;
      
      // 3. Si la connexion réussit, vérifier la session
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session);

      // 4. Vérifier l'association avec l'agence
      if (session) {
        const { data: agencyData, error: agencyError } = await supabase
          .from('agencies')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('slug', agencySlug)
          .single();

        console.log("Agency check:", { agencyData, agencyError });

        if (agencyError || !agencyData) {
          throw new Error("Accès non autorisé à cette agence");
        }

        if (!agencyData.is_active) {
          throw new Error("Cette agence n'est pas active");
        }

        set({ isAuthenticated: true, error: null });
        toast.success("Connexion réussie");
      } else {
        throw new Error("Session invalide");
      }
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