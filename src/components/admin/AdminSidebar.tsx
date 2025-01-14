import { Building2, Home, Settings, Users } from "lucide-react"
import { useLocation } from "react-router-dom"
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
    title: "Paramètres",
    url: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const location = useLocation()

  return (
    <Sidebar variant="sidebar" className="border-r">
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold">LYCS IMMO Admin</h2>
      </SidebarHeader>
      <SidebarContent>
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
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}