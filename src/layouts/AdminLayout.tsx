import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout() {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingLayout />;
  }

  // Check if user is admin (you'll need to implement this logic)
  if (!session) {
    return <Navigate to="/admin/auth" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin navigation will go here */}
      <Outlet />
    </div>
  );
}