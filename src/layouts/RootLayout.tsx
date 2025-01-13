import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Outlet />
    </div>
  );
}