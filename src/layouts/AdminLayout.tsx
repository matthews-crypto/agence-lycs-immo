import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAdminAuthStore } from "@/stores/useAdminAuthStore"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { LoadingLayout } from "@/components/LoadingLayout"
import { toast } from "sonner"

export default function AdminLayout() {
  const { isAuthenticated, isLoading, init } = useAdminAuthStore()
  const location = useLocation()

  useEffect(() => {
    let inactivityTimeout: NodeJS.Timeout

    const resetInactivityTimer = () => {
      // Effacer le timeout existant
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout)
      }

      // Définir un nouveau timeout (8 heures)
      inactivityTimeout = setTimeout(async () => {
        console.log("Session expirée après 8 heures d'inactivité")
        await supabase.auth.signOut()
        toast.info("Session expirée. Veuillez vous reconnecter.")
      }, 8 * 60 * 60 * 1000) // 8 heures en millisecondes
    }

    // Ajouter les écouteurs d'événements pour réinitialiser le timer
    const events = ['mousedown', 'keydown', 'mousemove', 'wheel']
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer)
    })

    // Démarrer le timer initial
    resetInactivityTimer()

    // Initialize authentication
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change event:", event)
      
      if (!session) {
        console.log("No session in auth state change")
        return
      }

      const { data: isAdmin, error: adminCheckError } = await supabase
        .rpc('is_admin', { user_id: session.user.id });

      if (adminCheckError) {
        console.error("Admin check error in auth state change:", adminCheckError)
        return
      }
    })

    // Cleanup function
    return () => {
      console.log("Cleaning up auth state change subscription")
      subscription.unsubscribe()
      // Nettoyer le timer et les écouteurs d'événements
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout)
      }
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer)
      })
    }
  }, [init])

  if (isLoading) {
    return <LoadingLayout />
  }

  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to auth page")
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