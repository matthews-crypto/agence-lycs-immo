import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";

interface AdminAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  isLoading: true,
  isAuthenticated: false,
  error: null,

  init: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Vérifier si l'utilisateur est admin
        const { data: isAdmin, error: adminCheckError } = await supabase
          .rpc('is_admin', { user_id: session.user.id });

        if (adminCheckError) throw adminCheckError;
        
        set({ 
          isAuthenticated: isAdmin === true,
          isLoading: false 
        });
      } else {
        set({ 
          isAuthenticated: false,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error("Init error:", error);
      set({ 
        isAuthenticated: false,
        isLoading: false,
        error: "Erreur d'initialisation"
      });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      if (!signInData.user) {
        throw new Error("Aucune donnée utilisateur reçue");
      }

      const { data: isAdmin, error: adminCheckError } = await supabase
        .rpc('is_admin', { user_id: signInData.user.id });

      if (adminCheckError) throw adminCheckError;

      if (!isAdmin) {
        throw new Error("Non autorisé : Vous n'êtes pas administrateur");
      }

      set({ isAuthenticated: true });
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