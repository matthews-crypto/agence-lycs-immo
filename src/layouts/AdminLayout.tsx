import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAdminAuthStore } from "@/stores/useAdminAuthStore"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { LoadingLayout } from "@/components/LoadingLayout"

export default function AdminLayout() {
  const { isAuthenticated, setAuthenticated, isLoading } = useAdminAuthStore()
  const location = useLocation()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Vérifier si l'utilisateur est un admin
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

          setAuthenticated(!!adminData)
        } else {
          setAuthenticated(false)
        }
      } catch (error) {
        console.error("Session check error:", error)
        setAuthenticated(false)
      }
    }

    checkAdminStatus()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data: adminData } = await supabase
          .from("admin_users")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle()

        setAuthenticated(!!adminData)
      } else {
        setAuthenticated(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [setAuthenticated])

  if (isLoading) {
    return <LoadingLayout />
  }

  if (!isAuthenticated) {
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