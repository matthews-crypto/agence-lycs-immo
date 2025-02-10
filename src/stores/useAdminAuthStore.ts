import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";

interface AdminAuthState {
  isLoading: boolean;
  isSessionLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  setAuthenticated: (value: boolean) => void;
  checkAndUpdateSession: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setupInactivityTimeout: () => () => void;
}

const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 heures

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  isLoading: false,
  isSessionLoading: true, // Initialement true car on charge la session
  isAuthenticated: false,
  error: null,

  setAuthenticated: (value: boolean) => {
    console.log("Setting authenticated state to:", value);
    set({ isAuthenticated: value });
  },

  checkAndUpdateSession: async () => {
    try {
      console.log("Checking admin session status...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        set({ isAuthenticated: false, isSessionLoading: false });
        return false;
      }

      if (!session) {
        console.log("No active session found");
        set({ isAuthenticated: false, isSessionLoading: false });
        return false;
      }

      console.log("Session found, checking admin status for user:", session.user.id);
      const { data: isAdmin, error: adminCheckError } = await supabase
        .rpc('is_admin', { user_id: session.user.id });

      if (adminCheckError) {
        console.error("Admin check error:", adminCheckError);
        set({ isAuthenticated: false, isSessionLoading: false });
        return false;
      }

      const isAdminUser = !!isAdmin;
      console.log("Admin status check result:", isAdminUser);
      set({ isAuthenticated: isAdminUser, isSessionLoading: false });
      return isAdminUser;
    } catch (error) {
      console.error("Session check error:", error);
      set({ isAuthenticated: false, isSessionLoading: false });
      return false;
    }
  },

  setupInactivityTimeout: () => {
    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        console.log("Session expirée après 8 heures d'inactivité");
        await get().logout();
        toast.info("Session expirée. Veuillez vous reconnecter.");
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'mousemove', 'wheel'];
    events.forEach(event => document.addEventListener(event, resetTimeout));
    resetTimeout();

    return () => {
      events.forEach(event => document.removeEventListener(event, resetTimeout));
      if (timeoutId) clearTimeout(timeoutId);
    };
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Starting login process for:", email);
      await supabase.auth.signOut();
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

       if (signInError) {
        // Personnalisation des messages d'erreur
        if (signInError instanceof AuthError && signInError.message === 'Invalid login credentials') {
          throw new Error('Email ou mot de passe incorrect');
        }
        throw signInError;
      }
      if (!signInData.user) throw new Error("No user data received");

      const { data: isAdmin, error: adminCheckError } = await supabase
        .rpc('is_admin', { user_id: signInData.user.id });

      if (adminCheckError) throw adminCheckError;
      if (!isAdmin) throw new Error("Email ou mot de passe incorrect");

      set({ isAuthenticated: true, error: null });
      toast.success("Connexion réussie");
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Échec de la connexion";
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
      const message = error instanceof Error ? error.message : "Échec de la déconnexion";
      set({ error: message });
      toast.error(message);
    } finally {
      set({ isLoading: false });
    }
  },
}));
