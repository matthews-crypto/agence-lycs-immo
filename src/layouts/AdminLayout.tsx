import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";

export default function AdminLayout() {
  const { isAuthenticated } = useAdminAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/auth" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin navigation will go here */}
      <Outlet />
    </div>
  );
}