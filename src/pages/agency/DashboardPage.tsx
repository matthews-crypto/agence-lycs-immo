import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChangePasswordForm } from "@/components/agency/ChangePasswordForm";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AgencyDashboardPage() {
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const { agency } = useAgencyContext();

  useEffect(() => {
    if (agency?.must_change_password) {
      setMustChangePassword(true);
    }
  }, [agency]);

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
  };

  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ChangePasswordForm onPasswordChanged={handlePasswordChanged} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Tableau de bord de l'agence</h1>
            {/* Le reste du contenu du tableau de bord sera ajouté ici */}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}