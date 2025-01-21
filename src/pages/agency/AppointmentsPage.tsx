import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AgencyAppointmentsPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Gestion des rendez-vous</h1>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}