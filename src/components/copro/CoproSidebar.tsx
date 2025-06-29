import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Home,
  Users,
  LogOut,
  Image,
  Banknote,
  ArrowLeft,
  FileText,
  CreditCard
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

export function CoproSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAgencyAuthStore()
  const { agency } = useAgencyContext()

  useEffect(() => {
    if (agency?.secondary_color) {
      document.documentElement.style.setProperty('--sidebar-background', agency.primary_color);
      document.documentElement.style.setProperty('--sidebar-primary', agency.secondary_color);
    }
  }, [agency?.secondary_color, agency?.primary_color]);

  // Fonction pour gérer la déconnexion
  const handleLogout = async () => {
    try {
      await logout();
      if (agency?.slug) {
        navigate(`/${agency.slug}`);
      } else {
        navigate('/');
      }
      toast.success('Vous avez été déconnecté avec succès');
    } catch (error) {
      toast.error('Une erreur est survenue lors de la déconnexion');
    }
  };

  // Fonction pour retourner à la page des services
  const handleBackToServices = () => {
    navigate(`/${agency?.slug}/agency/services`);
  };

  // Définition des menus pour la gestion de copropriété
  const menuGroups = [
    {
      label: "Gestion Copropriété",
      items: [
        {
          title: "Tableau de bord",
          icon: LayoutDashboard,
          url: `/${agency?.slug}/copro/dashboard`,
        },
        {
          title: "Appels de fond",
          icon: Banknote,
          url: `/${agency?.slug}/copro/appels-de-fond`,
        },
        {
          title: "Lots",
          icon: Home,
          url: `/${agency?.slug}/copro/lots`,
        },

        {
          title: "Demandes",
          icon: FileText,
          url: `/${agency?.slug}/copro/demandes`,
        },
        {
          title: "Paiements",
          icon: CreditCard,
          url: `/${agency?.slug}/copro/paiements`,
        }
      ],
    }
  ];

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
        <div className="text-center mt-2">
          <h3 className="text-lg font-bold">Gestion Copropriété</h3>
        </div>
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
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <div className="mt-auto p-4 space-y-2">
          <Button
            variant="ghost" // ou "link" si ghost ne te convient pas
            className="w-full justify-start bg-transparent border-none text-white hover:text-white hover:bg-white/10"
            onClick={handleBackToServices}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux services
          </Button>

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
  );
}
