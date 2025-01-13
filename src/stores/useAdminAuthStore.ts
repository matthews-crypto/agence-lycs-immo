import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";

interface AdminAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Starting login process for:", email); // Debug log

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("SignIn Error:", signInError); // Debug log
        throw signInError;
      }

      const user = signInData.user;
      if (!user) {
        console.error("No user data received"); // Debug log
        throw new Error("No user data");
      }

      console.log("User authenticated, checking admin status"); // Debug log

      // Check if user has admin role in metadata
      const isAdmin = user.app_metadata?.role === "ADMIN";
      if (!isAdmin) {
        console.error("User is not an admin"); // Debug log
        throw new Error("Unauthorized: Not an admin user");
      }

      // Check if user exists in admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (adminError) {
        console.error("Admin check error:", adminError); // Debug log
        throw adminError;
      }
      
      if (!adminData) {
        console.error("User not found in admin_users table"); // Debug log
        throw new Error("Unauthorized: User not found in admin table");
      }

      console.log("Login successful, user is admin"); // Debug log
      set({ isAuthenticated: true, error: null });
      toast.success("Successfully logged in");
    } catch (error) {
      console.error("Final error:", error); // Debug log
      let message = "Failed to login";
      if (error instanceof AuthError) {
        message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      set({ error: message });
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
      toast.success("Successfully logged out");
    } catch (error) {
      let message = "Failed to logout";
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