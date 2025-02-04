import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingLayout } from "@/components/LoadingLayout";
import { toast } from "sonner";

const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000;

export default function AdminLayout() {
  const { isAuthenticated, isLoading, checkAuth } = useAdminAuthStore();
  const location = useLocation();
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>();

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      toast.info("Session expirée. Veuillez vous reconnecter.");
    }, INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'mousemove', 'wheel'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    checkAuth();
    resetInactivityTimer();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        await checkAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [checkAuth, resetInactivityTimer]);

  if (isLoading) {
    return <LoadingLayout />;
  }

  if (!isAuthenticated) {
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