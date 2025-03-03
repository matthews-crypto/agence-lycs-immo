import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAdminAuthStore } from "@/stores/useAdminAuthStore"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { LoadingLayout } from "@/components/LoadingLayout"

export default function AdminLayout() {
  const { isAuthenticated, isSessionLoading, checkAndUpdateSession, setupInactivityTimeout } = useAdminAuthStore()
  const location = useLocation()

  useEffect(() => {
    // Vérifier la session initiale
    checkAndUpdateSession();

    // Configurer le timeout d'inactivité
    const cleanupTimeout = setupInactivityTimeout();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      console.log("Auth state change event:", event);
      if (event === 'TOKEN_REFRESHED') {
        await checkAndUpdateSession();
      }
      if (event === 'SIGNED_OUT') {
        useAdminAuthStore.getState().setAuthenticated(false);
      }
    });

    // Cleanup
    return () => {
      console.log("Cleaning up AdminLayout");
      subscription.unsubscribe();
      cleanupTimeout();
    }
  }, [checkAndUpdateSession, setupInactivityTimeout]);

  // Afficher le loader pendant la vérification de la session
  if (isSessionLoading) {
    return <LoadingLayout />;
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to auth page");
    return <Navigate to="/admin/auth" state={{ from: location }} replace />
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
  )
}
