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
  ShoppingBag,
  Receipt,
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
  const [newContactMessagesCount, setNewContactMessagesCount] = useState(0)
  
  // Déterminer quelle section afficher en fonction du chemin
  const currentPath = location.pathname
  const isImmoSection = currentPath.includes('/immo/dashboard') ||
                       currentPath.includes('/properties') || 
                       currentPath.includes('/prospection') || 
                       currentPath.includes('/appointments') || 
                       currentPath.includes('/contact-requests')
  
  const isLocativeSection = currentPath.includes('/locative/dashboard') ||
                           currentPath.includes('/planning') || 
                           currentPath.includes('/payments') || 
                           currentPath.includes('/sales') || 
                           currentPath.includes('/clients') || 
                           currentPath.includes('/proprietaires')
  
  const isCoproSection = currentPath.includes('/copro/dashboard') ||
                        currentPath.includes('/copropriete') || 
                        currentPath.includes('/appel-de-fond')

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
    
    if (location.pathname.includes('/agency/contact-requests')) {
      console.log('Resetting contact messages count - visiting contact-requests page');
      setNewContactMessagesCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!agency?.id) return;
    
    // Ne pas configurer l'abonnement en temps réel pour la page d'appel de fond
    if (location.pathname.includes('/agency/appel-de-fond')) {
      console.log('Skipping realtime subscription for appel-de-fond page');
      return;
    }

    console.log('Setting up realtime subscription for reservations and contact messages');
    
    // Abonnement aux réservations
    const reservationsChannel = supabase
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
        console.log('Reservations subscription status:', status);
      });
      
    // Abonnement aux messages de contact
    const contactMessagesChannel = supabase
      .channel('agency-contact-messages')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages',
          filter: `agency_id=eq.${agency.id}`
        },
        (payload) => {
          console.log('New contact message received:', payload);
          setNewContactMessagesCount(prev => prev + 1);
          toast.success('Nouveau message de contact reçu!', {
            position: 'top-right',
          });
        }
      )
      .subscribe((status) => {
        console.log('Contact messages subscription status:', status);
      });
      
    // Écouteur d'événement pour la réinitialisation du compteur de messages
    const handleContactMessagesViewed = (event: CustomEvent) => {
      if (event.detail?.agencyId === agency.id) {
        setNewContactMessagesCount(0);
      }
    };
    
    window.addEventListener('contact-messages-viewed', handleContactMessagesViewed as EventListener);

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(contactMessagesChannel);
      window.removeEventListener('contact-messages-viewed', handleContactMessagesViewed as EventListener);
    };
  }, [agency?.id, location.pathname]);
  
  // Charger le compteur initial de messages non lus au démarrage
  useEffect(() => {
    if (!agency?.id) return;
    
    const checkNewContactMessages = async () => {
      try {
        // Récupérer le dernier timestamp de consultation depuis localStorage
        const storedData = localStorage.getItem(`contact_messages_viewed_${agency.id}`);
        let lastViewedTimestamp = 0;
        let viewedMessageIds: string[] = [];
        
        if (storedData) {
          const parsedData = JSON.parse(storedData) as { lastViewedTimestamp: number, messageIds: string[] };
          lastViewedTimestamp = parsedData.lastViewedTimestamp;
          viewedMessageIds = parsedData.messageIds;
        }
        
        // Convertir le timestamp en date ISO pour la comparaison avec created_at
        const lastViewedDate = new Date(lastViewedTimestamp).toISOString();
        
        // Récupérer le nombre de nouveaux messages depuis la dernière consultation
        const { data, error, count } = await supabase
          .from('contact_messages')
          .select('id', { count: 'exact' })
          .eq('agency_id', agency.id)
          .gt('created_at', lastViewedDate);
          
        if (error) {
          console.error('Erreur lors de la vérification des nouveaux messages:', error);
          return;
        }
        
        // Filtrer les messages déjà vus (si l'ID est dans viewedMessageIds)
        const newCount = data ? data.filter(msg => !viewedMessageIds.includes(msg.id)).length : 0;
        setNewContactMessagesCount(newCount);
      } catch (error) {
        console.error('Erreur lors de la vérification des nouveaux messages:', error);
      }
    };
    
    checkNewContactMessages();
  }, [agency?.id]);

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
      label: "Gestion Immobilière",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          url: `/${agency?.slug}/immo/dashboard`,
        },
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
        {
          title: "Demandes de contact",
          icon: MessageSquare,
          url: `/${agency?.slug}/agency/contact-requests`,
          badgeCount: newContactMessagesCount,
        },
      ],
    },
    {
      label: "Gestion Locative",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          url: `/${agency?.slug}/locative/dashboard`,
        },
        {
          title: "Planning location",
          icon: MapPin,
          url: `/${agency?.slug}/agency/planning`,
        },
        {
          title: "Paiements",
          icon: Receipt,
          url: `/${agency?.slug}/agency/payments`,
        },
        {
          title: "Ventes",
          icon: ShoppingBag,
          url: `/${agency?.slug}/agency/sales`,
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
          title: "Dashboard",
          icon: LayoutDashboard,
          url: `/${agency?.slug}/copro/dashboard`,
        },
        {
          title: "Lots",
          icon: Home,
          url: `/${agency?.slug}/agency/copropriete`,
        }
      ],
    },
  ]

  // Filtrer les groupes de menu en fonction du chemin actuel
  // Hide Gestion Locative and Copropriété only on sale opportunity detail page
  const isSaleOpportunityDetail = /\/agency\/opportunities\/sale\//.test(currentPath);
  const filteredMenuGroups = menuGroups.filter(group => {
    if (isSaleOpportunityDetail) {
      // Hide Gestion Locative and Copropriété
      return group.label !== "Gestion Locative" && group.label !== "Gestion Copropriété";
    }
    if (isImmoSection) {
      return group.label === "Gestion Immobilière";
    } else if (isLocativeSection) {
      return group.label === "Gestion Locative";
    } else if (isCoproSection) {
      return group.label === "Gestion Copropriété";
    }
    return true;
  });

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
            className="w-24 h-24 object-cover rounded-full mx-auto"
          />
        ) : (
          <div className="flex items-center gap-2">
            <Image className="w-6 h-6" />
            <h2 className="text-lg font-semibold">{agency?.agency_name}</h2>
          </div>
        )}
        {/* Titre métier dynamique sous le logo */}
        <div className="mt-2 text-center">
          {isImmoSection && <span className="text-white text-base font-bold tracking-wide">Gestion Immobilière</span>}
          {isLocativeSection && <span className="text-white text-base font-bold tracking-wide">Gestion Locative</span>}
          {isCoproSection && <span className="text-white text-base font-bold tracking-wide">Gestion Copropriété</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {filteredMenuGroups.map((group) => (
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

        <div className="mt-auto p-4 flex flex-col gap-2">
          {agency && (
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-primary hover:text-white hover:bg-sidebar-primary mb-2 border border-sidebar-primary"
              onClick={() => navigate(`/${agency.slug}/agency/services`)}
              
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Retour aux services
            </Button>
          )}
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
