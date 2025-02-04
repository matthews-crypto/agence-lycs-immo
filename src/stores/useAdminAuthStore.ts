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
          console.log("Checking auth...");
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.user) {
            console.log("No session found");
            set({ isAuthenticated: false, isLoading: false });
            return false;
          }

          console.log("Session found, checking admin status...");
          const { data: isAdmin, error: adminCheckError } = await supabase
            .rpc('is_admin', { user_id: session.user.id });

          if (adminCheckError) {
            console.error("Admin check error:", adminCheckError);
            throw adminCheckError;
          }

          console.log("Admin status:", isAdmin);
          set({ 
            isAuthenticated: Boolean(isAdmin),
            isLoading: false 
          });

          return Boolean(isAdmin);
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
          console.log("Attempting login...");
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) throw signInError;
          if (!data.user) throw new Error("No user data");

          const isAdmin = await get().checkAuth();
          if (!isAdmin) throw new Error("Not admin");

          console.log("Login successful");
          toast.success("Connexion réussie");
        } catch (error) {
          console.error("Login error:", error);
          let message = "Erreur de connexion";
          if (error instanceof Error) message = error.message;
          set({ error: message, isAuthenticated: false });
          toast.error(message);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          console.log("Logging out...");
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