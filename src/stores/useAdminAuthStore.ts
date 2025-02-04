import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";

interface AdminAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  checkAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      isLoading: true,
      isAuthenticated: false,
      error: null,

      checkAuth: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.user) {
            set({ isAuthenticated: false, isLoading: false });
            return false;
          }

          const { data: isAdmin, error: adminCheckError } = await supabase
            .rpc('is_admin', { user_id: session.user.id });

          if (adminCheckError) throw adminCheckError;

          const isAuthenticated = !!isAdmin;
          set({ isAuthenticated, isLoading: false });
          return isAuthenticated;

        } catch (error) {
          console.error("Auth check error:", error);
          set({ 
            isAuthenticated: false,
            isLoading: false,
            error: "Erreur de vérification"
          });
          return false;
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user }, error: signInError } = 
            await supabase.auth.signInWithPassword({ email, password });

          if (signInError) throw signInError;
          if (!user) throw new Error("Aucun utilisateur trouvé");

          const isAdmin = await get().checkAuth();
          if (!isAdmin) throw new Error("Accès non autorisé");

          toast.success("Connexion réussie");
        } catch (error) {
          let message = "Erreur de connexion";
          if (error instanceof Error) {
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
        try {
          await supabase.auth.signOut();
          set({ isAuthenticated: false });
          toast.success("Déconnexion réussie");
        } catch (error) {
          console.error("Logout error:", error);
          toast.error("Erreur de déconnexion");
        }
      },
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated })
    }
  )
);