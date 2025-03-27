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
  Image,
  FileSearch,
  MapPin,
  UserSquare,
  Banknote,
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
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import { useAgencyAuthStore } from "@/stores/useAgencyAuthStore"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAgencyContext } from "@/contexts/AgencyContext"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export function AgencySidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAgencyAuthStore()
  const { agency } = useAgencyContext()
  const [newOpportunityCount, setNewOpportunityCount] = useState(0)

  useEffect(() => {
    if (agency?.secondary_color) {
      document.documentElement.style.setProperty('--sidebar-background', agency.primary_color);
      document.documentElement.style.setProperty('--sidebar-primary', agency.secondary_color);
    }
  }, [agency?.secondary_color, agency?.primary_color]);

  useEffect(() => {
    if (location.pathname.includes('/agency/prospection')) {
      console.log('Resetting opportunity count - visiting prospection page');
      setNewOpportunityCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!agency?.id) return;
    
    // Ne pas configurer l'abonnement en temps réel pour la page d'appel de fond
    if (location.pathname.includes('/agency/appel-de-fond')) {
      console.log('Skipping realtime subscription for appel-de-fond page');
      return;
    }

    console.log('Setting up realtime subscription for reservations');
    
    const channel = supabase
      .channel('agency-reservations')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations',
          filter: `agency_id=eq.${agency.id}`
        },
        (payload) => {
          console.log('New reservation received:', payload);
          setNewOpportunityCount(prev => prev + 1);
          toast.success('Nouvelle opportunité reçue!', {
            position: 'top-right',
          });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [agency?.id, location.pathname]);

  const handleLogout = async () => {
    try {
      await logout()
      navigate(`/${agency?.slug}`)
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
      label: "Gestion Immobilière",
      items: [
        {
          title: "Offres",
          icon: Home,
          url: `/${agency?.slug}/agency/properties`,
        },
        {
          title: "Opportunité",
          icon: FileSearch,
          url: `/${agency?.slug}/agency/prospection`,
          badgeCount: newOpportunityCount,
        },
        {
          title: "Rendez-vous",
          icon: Calendar,
          url: `/${agency?.slug}/agency/appointments`,
        },
      ],
    },
    {
      label: "Gestion Locative",
      items: [
        {
          title: "Planning location",
          icon: MapPin,
          url: `/${agency?.slug}/agency/planning`,
        },
        {
          title: "Clients",
          icon: Users,
          url: `/${agency?.slug}/agency/clients`,
        },
        {
          title: "Propriétaires",
          icon: UserSquare,
          url: `/${agency?.slug}/agency/proprietaires`,
        },
      ],
    },
    {
      label: "Gestion Copropriété",
      items: [
        {
          title: "Lots",
          icon: Home,
          url: `/${agency?.slug}/agency/copropriete`,
        },
        {
          title: "Appel de fond",
          icon: Banknote,
          url: `/${agency?.slug}/agency/appel-de-fond`,
        },
      ],
    },
    {
      label: "Analyse & Configuration",
      items: [
        {
          title: "Configuration",
          icon: Settings,
          url: `/${agency?.slug}/agency/settings`,
        },
      ],
    },
  ]

  return (
    <Sidebar 
      variant="sidebar" 
      className="border-r bg-sidebar text-white"
    >
      <SidebarHeader className="p-4">
        {agency?.logo_url ? (
          <img 
            src={agency.logo_url} 
            alt={agency.agency_name}
            className="w-32 h-32 object-cover rounded-full mx-auto"
          />
        ) : (
          <div className="flex items-center gap-2">
            <Image className="w-6 h-6" />
            <h2 className="text-lg font-semibold">{agency?.agency_name}</h2>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-white/70">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="transition-colors hover:text-white data-[active=true]:bg-sidebar-primary"
                      data-active={location.pathname === item.url}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badgeCount > 0 && (
                      <SidebarMenuBadge className="absolute -top-2 right-0 bg-red-500 text-white">
                        {item.badgeCount}
                      </SidebarMenuBadge>
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
            className="w-full justify-start text-white hover:text-white hover:bg-sidebar-primary"
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
