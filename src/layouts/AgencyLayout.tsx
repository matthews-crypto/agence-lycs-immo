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

  // Check if the current path includes /agency/ (dashboard routes)
  const isAgencyRoute = window.location.pathname.includes(`/${agencySlug}/agency/`);

  // For agency routes, verify that the user is authenticated and is the agency owner
  if (isAgencyRoute) {
    console.log("Checking agency access...");
    console.log("Session user:", session?.user.id);
    console.log("Agency user:", agency.user_id);

    // If no session, redirect to auth
    if (!session) {
      console.log("No session, redirecting to auth");
      return <Navigate to={`/${agencySlug}/auth`} replace />;
    }

    // If user is not the agency owner, redirect to home
    if (session.user.id !== agency.user_id) {
      console.log("User is not agency owner, redirecting to home");
      return <Navigate to={`/${agencySlug}`} replace />;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}