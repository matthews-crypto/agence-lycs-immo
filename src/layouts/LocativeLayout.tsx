import { Outlet, useNavigate } from "react-router-dom";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { LocativeSidebar } from "@/components/locative/LocativeSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect } from "react";

export default function LocativeLayout() {
  const { agency, isLoading } = useAgencyContext();
  const navigate = useNavigate();

  // Vérification des droits d'accès
  useEffect(() => {
    if (!isLoading && agency && agency.isLocative !== true) {
      // Rediriger vers la page services si l'agence n'a pas accès à la gestion locative
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
        <LocativeSidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
