import { Outlet, useNavigate } from "react-router-dom";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { ImmoSidebar } from "@/components/immo/ImmoSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect } from "react";

export default function ImmoLayout() {
  const { agency, isLoading } = useAgencyContext();
  const navigate = useNavigate();

  // Vérification des droits d'accès
  useEffect(() => {
    if (!isLoading && agency && agency.isImmo !== true) {
      // Rediriger vers la page services si l'agence n'a pas accès à la gestion immobilière
      navigate(`/${agency.slug}/agency/services`);
    }
  }, [agency, isLoading, navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!agency) {
    return <div className="flex items-center justify-center h-screen">Agence non trouvée</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <ImmoSidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
