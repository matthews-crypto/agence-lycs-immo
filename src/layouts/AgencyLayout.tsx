import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { LoadingLayout } from "@/components/LoadingLayout";
import { useAuth } from "@/hooks/useAuth";

export default function AgencyLayout() {
  const { agencySlug } = useParams();
  const { agency, isLoading: isAgencyLoading, error } = useAgencyContext();
  const { session, isLoading: isAuthLoading } = useAuth();

  console.log("Current session:", session);
  console.log("Current agency:", agency);
  console.log("Current path:", window.location.pathname);

  // Wait for both agency and auth data to load
  if (isAgencyLoading || isAuthLoading) {
    return <LoadingLayout />;
  }

  // If there's an error or no agency found, redirect to 404
  if (error || !agency) {
    console.log("No agency found or error, redirecting to 404");
    return <Navigate to="/404" replace />;
  }

  // Check if the current path includes specific routes
  const isAgencyRoute = window.location.pathname.includes(`/${agencySlug}/agency/`);
  const isProprietaireRoute = window.location.pathname.includes(`/${agencySlug}/proprietaire/`);
  const isChangePasswordRoute = window.location.pathname.includes(`/${agencySlug}/agency/change-password`);
  
  console.log("Path analysis:", { 
    isAgencyRoute, 
    isProprietaireRoute, 
    isChangePasswordRoute,
    userRole: session?.user?.user_metadata?.role
  });

  // If no session for any protected route, redirect to auth
  if ((isAgencyRoute || isProprietaireRoute) && !session) {
    console.log("No session, redirecting to auth");
    return <Navigate to={`/${agencySlug}/agency/auth`} replace />;
  }

  // For agency routes (except change-password), verify that the user is authenticated and is the agency owner
  if (isAgencyRoute && !isChangePasswordRoute && session) {
    console.log("Checking agency access...");
    console.log("Session user:", session.user.id);
    console.log("Agency user:", agency.user_id);
    console.log("User role:", session.user.user_metadata?.role);

    // If user is not the agency owner and not on a special route, redirect appropriately
    if (session.user.id !== agency.user_id) {
      // If user is a proprietaire, redirect to proprietaire dashboard
      if (session.user.user_metadata?.role === 'proprietaire') {
        console.log("User is a proprietaire, redirecting to proprietaire dashboard");
        return <Navigate to={`/${agencySlug}/proprietaire/dashboard`} replace />;
      } else {
        // Otherwise redirect to home
        console.log("User is not agency owner or proprietaire, redirecting to home");
        return <Navigate to={`/${agencySlug}`} replace />;
      }
    }
  }
  
  // For proprietaire routes, verify the user has the proprietaire role
  if (isProprietaireRoute && session) {
    if (session.user.user_metadata?.role !== 'proprietaire') {
      console.log("User is not a proprietaire, redirecting to appropriate dashboard");
      // If user is agency owner, redirect to agency dashboard
      if (session.user.id === agency.user_id) {
        return <Navigate to={`/${agencySlug}/agency/services`} replace />;
      } else {
        // Otherwise redirect to home
        return <Navigate to={`/${agencySlug}`} replace />;
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}