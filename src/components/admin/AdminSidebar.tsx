import { Building2, Home, LogOut, Settings, Users, Bell } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAdminAuthStore } from "@/stores/useAdminAuthStore"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { RegistrationRequestsButton } from "@/components/admin/dashboard/RegistrationRequestsButton"

const menuItems = [
  {
    title: "Tableau de bord",
    url: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Agences",
    url: "/admin/agencies",
    icon: Building2,
  },
  {
    title: "Utilisateurs",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Messages",
    url: "/admin/messages",
    icon: Bell,
  },
]

export function AdminSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAdminAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/admin/auth")
      toast.success("Déconnexion réussie")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Erreur lors de la déconnexion")
    }
  }

  return (
    <Sidebar variant="sidebar" className="border-r">
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold">LYCS IMMO Admin</h2>
      </SidebarHeader>
      <SidebarContent className="flex flex-col h-full">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="transition-colors"
                    data-active={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <RegistrationRequestsButton />
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}