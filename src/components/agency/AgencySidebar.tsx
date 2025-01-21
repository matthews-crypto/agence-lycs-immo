import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Home,
  Calendar,
  Users,
  ChartBar,
  Settings,
  MessageSquare,
  PlusCircle,
  Clock,
  List,
  History,
  TrendingUp,
  MapPin,
  FileText,
  User,
  Palette,
  Bot,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useAgencyAuthStore } from "@/stores/useAgencyAuthStore"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function AgencySidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAgencyAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
      navigate("auth")
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
          url: "dashboard",
          subItems: [
            { title: "Statistiques clés", url: "stats" },
            { title: "Indicateurs de performance", url: "kpis" },
          ],
        },
      ],
    },
    {
      label: "Biens Immobiliers",
      items: [
        {
          title: "Liste des propriétés",
          icon: Home,
          url: "properties",
        },
        {
          title: "Ajouter une propriété",
          icon: PlusCircle,
          url: "properties/new",
        },
        {
          title: "Gérer les disponibilités",
          icon: Clock,
          url: "properties/availability",
        },
      ],
    },
    {
      label: "Rendez-vous",
      items: [
        {
          title: "Calendrier des visites",
          icon: Calendar,
          url: "appointments",
        },
        {
          title: "Demandes en attente",
          icon: List,
          url: "appointments/pending",
        },
        {
          title: "Historique des visites",
          icon: History,
          url: "appointments/history",
        },
      ],
    },
    {
      label: "Clients",
      items: [
        {
          title: "Liste des clients",
          icon: Users,
          url: "clients",
        },
        {
          title: "Demandes de contact",
          icon: MessageSquare,
          url: "clients/requests",
        },
        {
          title: "Historique des interactions",
          icon: History,
          url: "clients/history",
        },
      ],
    },
    {
      label: "Analytics & Rapports",
      items: [
        {
          title: "Statistiques de vues",
          icon: ChartBar,
          url: "analytics/views",
        },
        {
          title: "Taux de conversion",
          icon: TrendingUp,
          url: "analytics/conversion",
        },
        {
          title: "Performance par zone",
          icon: MapPin,
          url: "analytics/geography",
        },
        {
          title: "Rapports d'activité",
          icon: FileText,
          url: "analytics/reports",
        },
      ],
    },
    {
      label: "Configuration",
      items: [
        {
          title: "Profil de l'agence",
          icon: User,
          url: "settings/profile",
        },
        {
          title: "Paramètres de compte",
          icon: Settings,
          url: "settings/account",
        },
        {
          title: "Gestion des thèmes",
          icon: Palette,
          url: "settings/theme",
        },
      ],
    },
    {
      label: "Chat WhatsApp",
      items: [
        {
          title: "État du bot",
          icon: Bot,
          url: "whatsapp/status",
        },
        {
          title: "Historique des conversations",
          icon: History,
          url: "whatsapp/history",
        },
        {
          title: "Configuration des réponses",
          icon: Settings,
          url: "whatsapp/settings",
        },
      ],
    },
  ]

  return (
    <Sidebar variant="sidebar" className="border-r">
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
                      data-active={location.pathname.includes(item.url)}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.subItems && (
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              data-active={location.pathname.includes(subItem.url)}
                            >
                              <Link to={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
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