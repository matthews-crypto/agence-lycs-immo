
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
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"

export function AgencySidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAgencyAuthStore()
  const { agency } = useAgencyContext()
  const [newProspections, setNewProspections] = useState(0)
  const [viewedProspectionIds, setViewedProspectionIds] = useState<string[]>([])

  useEffect(() => {
    if (agency?.secondary_color) {
      document.documentElement.style.setProperty('--sidebar-background', agency.primary_color);
      document.documentElement.style.setProperty('--sidebar-primary', agency.secondary_color);
    }
  }, [agency?.secondary_color, agency?.primary_color]);

  // Check if we're on the prospection page and mark as viewed
  useEffect(() => {
    if (location.pathname.includes('/agency/prospection') && newProspections > 0) {
      // Mark all current notifications as viewed when visiting the prospection page
      setNewProspections(0);
      
      // Store IDs of viewed prospections
      const fetchAndStoreViewedIds = async () => {
        if (!agency?.id) return;
        
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const { data } = await supabase
          .from('reservations')
          .select('id')
          .eq('agency_id', agency.id)
          .eq('status', 'En attente')
          .gte('created_at', oneDayAgo.toISOString());
          
        if (data && data.length > 0) {
          const ids = data.map(item => item.id);
          setViewedProspectionIds(prev => [...prev, ...ids]);
        }
      };
      
      fetchAndStoreViewedIds();
    }
  }, [location.pathname, newProspections, agency?.id]);

  useEffect(() => {
    const fetchRecentProspections = async () => {
      if (!agency?.id) return;
      
      // Get timestamp for 24 hours ago
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      console.log("Fetching recent prospections, agency id:", agency.id);
      
      const { data, error } = await supabase
        .from('reservations')
        .select('id')
        .eq('agency_id', agency.id)
        .eq('status', 'En attente')
        .gte('created_at', oneDayAgo.toISOString());
      
      if (error) {
        console.error('Error fetching recent prospections:', error);
        return;
      }
      
      console.log("Recent prospections data:", data);
      console.log("Viewed prospection ids:", viewedProspectionIds);
      
      // Filter out viewed prospections
      const unseenProspections = data?.filter(item => !viewedProspectionIds.includes(item.id)) || [];
      console.log("Unseen prospections:", unseenProspections.length);
      setNewProspections(unseenProspections.length);
    };
    
    fetchRecentProspections();
    
    // Set up a real-time subscription for new prospections
    if (agency?.id) {
      console.log("Setting up real-time subscription for agency:", agency.id);
      
      const channel = supabase
        .channel('public:reservations')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reservations',
            filter: `agency_id=eq.${agency.id}`
          },
          (payload) => {
            console.log("Received new reservation:", payload);
            if (payload.new && payload.new.status === 'En attente') {
              const newId = payload.new.id as string;
              if (!viewedProspectionIds.includes(newId)) {
                console.log("Adding new prospection to count");
                setNewProspections(prev => prev + 1);
                toast.info("Nouvelle prospection reçue!");
              }
            }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [agency?.id, viewedProspectionIds]);

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
      label: "Gestion",
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
          notificationCount: newProspections,
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
                        {item.notificationCount > 0 && (
                          <SidebarMenuBadge>
                            <Badge variant="success" className="ml-auto">
                              {item.notificationCount}
                            </Badge>
                          </SidebarMenuBadge>
                        )}
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
