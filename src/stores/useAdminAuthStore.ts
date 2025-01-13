import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const user = signInData.user;
      if (!user) throw new Error("No user data");

      // Check if user has admin role in metadata
      const isAdmin = user.app_metadata?.role === "ADMIN";
      if (!isAdmin) {
        throw new Error("Unauthorized: Not an admin user");
      }

      // Check if user exists in admin_users table using maybeSingle() instead of single()
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (adminError) throw adminError;
      if (!adminData) {
        throw new Error("Unauthorized: User not found in admin table");
      }

      set({ isAuthenticated: true });
      toast.success("Successfully logged in");
    } catch (error) {
      let message = "Failed to login";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
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
      toast.error(message);
    } finally {
      set({ isLoading: false });
    }
  },
}));