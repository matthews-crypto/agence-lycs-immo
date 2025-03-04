import { useParams } from "react-router-dom";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { useAgencyContext } from "@/contexts/AgencyContext";

export default function ProspectionPage() {
  const { agencySlug } = useParams();
  const { agency } = useAgencyContext();
  
  return (
    <div className="flex h-screen">
      <AgencySidebar />
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-6">Prospection</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-lg font-semibold">Aucune réservation pour le moment</p>
            <p className="text-muted-foreground">Les réservations de biens apparaîtront ici</p>
          </div>
        </div>
      </main>
    </div>
  );
}
