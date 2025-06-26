import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { LoadingLayout } from "@/components/LoadingLayout";
import { useAuth } from "@/hooks/useAuth";
import { ProprietaireSidebar } from "@/components/proprietaire/ProprietaireSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProprietaireLayout() {
  const { agencySlug } = useParams();
  const { agency, isLoading: isAgencyLoading, error } = useAgencyContext();
  const { session, isLoading: isAuthLoading } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  console.log("ProprietaireLayout - Current session:", session);
  console.log("ProprietaireLayout - Current agency:", agency);
  console.log("ProprietaireLayout - Current path:", window.location.pathname);
  console.log("ProprietaireLayout - User role:", session?.user?.user_metadata?.role);

  // Attendre que les données de l'agence et de l'authentification soient chargées
  // Utiliser un état de chargement plus robuste pour éviter les redirections prématurées
  if (isAgencyLoading || isAuthLoading) {
    console.log("Chargement en cours...");
    return <LoadingLayout />;
  }

  // Si une erreur se produit ou si aucune agence n'est trouvée, rediriger vers 404
  if (error || !agency) {
    console.log("No agency found or error, redirecting to 404");
    return <Navigate to="/404" replace />;
  }

  // Si aucune session n'est disponible, rediriger vers la page d'authentification
  // Mais seulement si nous sommes sûrs que le chargement est terminé
  if (!session && !isAuthLoading) {
    console.log("No session after loading completed, redirecting to auth");
    return <Navigate to={`/${agencySlug}/agency/auth`} replace />;
  }
  
  // Si la session est toujours en cours de chargement, afficher le layout de chargement
  if (!session) {
    console.log("Session still loading, showing loading layout");
    return <LoadingLayout />;
  }

  // Check if user needs to change password
  const mustChangePassword = session.user.user_metadata?.must_change_password;
  if (mustChangePassword) {
    console.log("User must change password, redirecting to change password page");
    return <Navigate to={`/${agencySlug}/agency/change-password`} replace />;
  }

  // Verify that the user has the proprietaire role
  if (session.user.user_metadata?.role !== 'proprietaire') {
    console.log("User is not a proprietaire, redirecting appropriately");
    
    // If user is agency owner, redirect to agency dashboard
    if (session.user.id === agency.user_id) {
      return <Navigate to={`/${agencySlug}/agency/services`} replace />;
    } else {
      // Otherwise redirect to home
      return <Navigate to={`/${agencySlug}`} replace />;
    }
  }

  // Hooks déjà déclarés en haut de la fonction

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar pour les écrans larges ou lorsqu'elle est ouverte sur mobile */}
      <div 
        className={cn(
          "h-screen w-64 shrink-0 border-r transition-all duration-300",
          isMobile && !sidebarOpen ? "-ml-64" : "ml-0"
        )}
      >
        <ProprietaireSidebar />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
        {/* Barre supérieure avec bouton menu sur mobile */}
        {isMobile && (
          <div className="h-14 border-b flex items-center px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Contenu de la page */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
