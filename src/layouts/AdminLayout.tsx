import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAdminAuthStore } from "@/stores/useAdminAuthStore"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { LoadingLayout } from "@/components/LoadingLayout"

export default function AdminLayout() {
  const { isAuthenticated, setAuthenticated } = useAdminAuthStore()
  const location = useLocation()

  useEffect(() => {
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

        const { data: adminData, error: adminError } = await supabase
          .from("admin_users")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle()

        if (adminError) {
          console.error("Admin check error:", adminError)
          setAuthenticated(false)
          return
        }

        const isAdmin = !!adminData
        console.log("Admin status check result:", isAdmin)
        setAuthenticated(isAdmin)
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

      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle()

      if (adminError) {
        console.error("Admin check error in auth state change:", adminError)
        setAuthenticated(false)
        return
      }

      const isAdmin = !!adminData
      console.log("Setting admin status on auth state change:", isAdmin)
      setAuthenticated(isAdmin)
    })

    return () => {
      console.log("Cleaning up auth state change subscription")
      subscription.unsubscribe()
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