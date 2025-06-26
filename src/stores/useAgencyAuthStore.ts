import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AgencyAuthStore {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  userRole: 'admin' | 'proprietaire' | null;
  user: User | null;
  login: (email: string, password: string, agencySlug: string) => Promise<{ error?: string, redirectPath?: string }>;
  logout: () => Promise<void>;
  checkPasswordChangeRequired: () => boolean;
}

export const useAgencyAuthStore = create<AgencyAuthStore>((set, get) => ({
  isLoading: false,
  isAuthenticated: false,
  error: null,
  userRole: null,
  user: null,

  login: async (email: string, password: string, agencySlug: string) => {
    try {
      set({ isLoading: true, error: null });
      
      console.log("Login attempt for:", email, "in agency:", agencySlug);
      
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Authentication error:", error.message);
        return { error: error.message };
      }
      
      if (!data.user) {
        console.error("No user data returned");
        return { error: "Utilisateur introuvable" };
      }
      
      // Check user role from metadata
      const userRole = data.user.user_metadata?.role || 'admin';
      console.log("User authenticated with role:", userRole, "metadata:", data.user.user_metadata);
      
      // Different logic based on role
      if (userRole === 'proprietaire') {
        // Propriétaire logic - no need to check agency association
        console.log("Setting proprietaire auth state");
        set({ 
          isAuthenticated: true, 
          userRole: 'proprietaire',
          user: data.user
        });
        
        // Check if password change is required
        if (data.user.user_metadata?.must_change_password) {
          console.log("Password change required, redirecting to change password page");
          return { redirectPath: `/${agencySlug}/agency/change-password` };
        }
        
        // Redirect to proprietaire dashboard
        console.log("Redirecting to proprietaire dashboard");
        return { redirectPath: `/${agencySlug}/proprietaire/dashboard` };
      } else {
        // Admin logic - check agency association
        console.log("Checking agency association for admin");
        const { data: agencies, error: agencyError } = await supabase
          .from("agencies")
          .select("*")
          .eq("slug", agencySlug)
          .eq("contact_email", email)
          .single();

        if (agencyError || !agencies) {
          console.error("Agency association error:", agencyError?.message || "No agency found");
          // Logout if not associated with this agency
          await supabase.auth.signOut();
          return { error: "Agence introuvable ou email non associé à cette agence" };
        }

        console.log("Setting admin auth state");
        set({ 
          isAuthenticated: true, 
          userRole: 'admin',
          user: data.user
        });
        
        // Redirect to admin dashboard
        console.log("Redirecting to admin dashboard");
        return { redirectPath: `/${agencySlug}/agency/services` };
      }
      
      return {};
    } catch (error) {
      console.error("Login error:", error);
      return { 
        error: error instanceof Error ? error.message : "An error occurred during login" 
      };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ 
        isAuthenticated: false,
        userRole: null,
        user: null
      });
    } catch (error) {
      console.error("Logout error:", error);
      set({ 
        error: error instanceof Error ? error.message : "An error occurred during logout" 
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Check if user needs to change password
  checkPasswordChangeRequired: () => {
    const { user } = get();
    return !!user?.user_metadata?.must_change_password;
  },
}));