import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Home,
  Calendar,
  Users,
  ChartBar,
  Settings,
  MessageSquare,
  LogOut,
} from "lucide-react"
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
import { useAgencyAuthStore } from "@/stores/useAgencyAuthStore"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAgencyContext } from "@/contexts/AgencyContext"
import { useEffect } from "react"

export function AgencySidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAgencyAuthStore()
  const { agency } = useAgencyContext()

  useEffect(() => {
    console.log("Agency data:", agency)
    console.log("Secondary color:", agency?.secondary_color)
  }, [agency])

  const handleLogout = async () => {
    try {
      await logout()
      navigate(`/${agency?.slug}`) // Redirection vers la page de l'agence
      toast.success("Déconnexion réussie")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Erreur lors de la déconnexion")
    }
  }

  const menuGroups = [
    {
      label: "Vue d'ensemble",
      items: [
        {
          title: "Tableau de bord",
          icon: LayoutDashboard,
          url: `/${agency?.slug}/agency/dashboard`,
        },
      ],
    },
    {
      label: "Gestion",
      items: [
        {
          title: "Biens Immobiliers",
          icon: Home,
          url: `/${agency?.slug}/agency/properties`,
        },
        {
          title: "Rendez-vous",
          icon: Calendar,
          url: `/${agency?.slug}/agency/appointments`,
        },
        {
          title: "Clients",
          icon: Users,
          url: `/${agency?.slug}/agency/clients`,
        },
      ],
    },
    {
      label: "Analyse & Configuration",
      items: [
        {
          title: "Analytics & Rapports",
          icon: ChartBar,
          url: `/${agency?.slug}/agency/analytics`,
        },
        {
          title: "Configuration",
          icon: Settings,
          url: `/${agency?.slug}/agency/settings`,
        },
        {
          title: "Chat WhatsApp",
          icon: MessageSquare,
          url: `/${agency?.slug}/agency/whatsapp`,
        },
      ],
    },
  ]

  const sidebarStyle = {
    backgroundColor: agency?.secondary_color || '#f3f4f6',
    transition: 'background-color 0.3s ease'
  }

  console.log("Applied sidebar style:", sidebarStyle)

  return (
    <Sidebar 
      variant="sidebar" 
      className="border-r"
      style={sidebarStyle}
    >
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold">Dashboard Agence</h2>
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
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
        ))}

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