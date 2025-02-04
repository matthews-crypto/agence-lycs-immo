import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAdminAuthStore } from "@/stores/useAdminAuthStore"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { LoadingLayout } from "@/components/LoadingLayout"
import { toast } from "sonner"

export default function AdminLayout() {
  const { isAuthenticated, setAuthenticated } = useAdminAuthStore()
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
        setAuthenticated(false)
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

    const checkAdminStatus = async () => {
      try {
        console.log("Checking admin session status...")
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Session error:", sessionError)
          setAuthenticated(false)
          return
        }

        if (!session) {
          console.log("No active session found")
          setAuthenticated(false)
          return
        }

        console.log("Session found, checking admin status for user:", session.user.id)

        const { data: isAdmin, error: adminCheckError } = await supabase
          .rpc('is_admin', { user_id: session.user.id });

        if (adminCheckError) {
          console.error("Admin check error:", adminCheckError)
          setAuthenticated(false)
          return
        }

        const isAdminUser = !!isAdmin
        console.log("Admin status check result:", isAdminUser)
        setAuthenticated(isAdminUser)
      } catch (error) {
        console.error("Session check error:", error)
        setAuthenticated(false)
      }
    }

    checkAdminStatus()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change event:", event)
      
      if (!session) {
        console.log("No session in auth state change")
        setAuthenticated(false)
        return
      }

      const { data: isAdmin, error: adminCheckError } = await supabase
        .rpc('is_admin', { user_id: session.user.id });

      if (adminCheckError) {
        console.error("Admin check error in auth state change:", adminCheckError)
        setAuthenticated(false)
        return
      }

      const isAdminUser = !!isAdmin
      console.log("Setting admin status on auth state change:", isAdminUser)
      setAuthenticated(isAdminUser)
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
  }, [setAuthenticated])

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