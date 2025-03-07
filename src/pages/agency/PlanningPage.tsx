
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function PlanningPage() {
  const { agency } = useAgencyContext();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          {/* Empty page as requested */}
        </main>
      </div>
    </SidebarProvider>
  );
}
