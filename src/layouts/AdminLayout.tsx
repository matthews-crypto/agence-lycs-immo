import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingLayout } from "@/components/LoadingLayout";
import { toast } from "sonner";

const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

export default function AdminLayout() {
  const { isAuthenticated, isLoading, checkAuth } = useAdminAuthStore();
  const location = useLocation();
  const authChecked = useRef(false);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const resetInactivityTimer = () => {
      console.log("Resetting inactivity timer");
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = setTimeout(async () => {
        console.log("Session expired due to inactivity");
        await supabase.auth.signOut();
        toast.info("Session expirée. Veuillez vous reconnecter.");
      }, INACTIVITY_TIMEOUT);
    };

    const initAuth = async () => {
      if (!authChecked.current) {
        console.log("Initializing auth...");
        await checkAuth();
        authChecked.current = true;
      }
    };

    const events = ['mousedown', 'keydown', 'mousemove', 'wheel'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    initAuth();
    resetInactivityTimer();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        await checkAuth();
      }
    });

    return () => {
      console.log("Cleaning up admin layout");
      subscription.unsubscribe();
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [checkAuth]);

  console.log("Layout render:", { isAuthenticated, isLoading, authChecked: authChecked.current });

  if (isLoading || !authChecked.current) {
    return <LoadingLayout />;
  }

  if (!isAuthenticated) {
    console.log("Redirecting to auth page");
    return <Navigate to="/admin/auth" state={{ from: location }} replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}