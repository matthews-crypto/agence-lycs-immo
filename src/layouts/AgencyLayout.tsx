import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { LoadingLayout } from "@/components/LoadingLayout";

export default function AgencyLayout() {
  const { agencySlug } = useParams();
  const { agency, isLoading, error } = useAgencyContext();

  if (isLoading) {
    return <LoadingLayout />;
  }

  if (error || !agency) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Agency navigation will go here */}
      <Outlet />
    </div>
  );
}