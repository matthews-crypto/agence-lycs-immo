
import { useParams } from "react-router-dom";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Mock data for reservations
const mockReservations = [
  {
    id: 1,
    property: "Villa de luxe avec vue sur mer",
    client: "Jean Dupont",
    date: "2023-06-15",
    time: "14:30",
    contact: "jean.dupont@example.com",
    phone: "+33 6 12 34 56 78",
    status: "confirmed"
  },
  {
    id: 2,
    property: "Appartement 3 pièces au centre-ville",
    client: "Marie Martin",
    date: "2023-06-18",
    time: "10:00",
    contact: "marie.martin@example.com",
    phone: "+33 6 23 45 67 89",
    status: "pending"
  },
  {
    id: 3,
    property: "Maison familiale avec jardin",
    client: "Pierre Durand",
    date: "2023-06-20",
    time: "16:00",
    contact: "pierre.durand@example.com",
    phone: "+33 6 34 56 78 90",
    status: "confirmed"
  }
];

export default function ProspectionPage() {
  const { agencySlug } = useParams();
  const { agency } = useAgencyContext();
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDetails = (reservation) => {
    setSelectedReservation(reservation);
    setIsDialogOpen(true);
  };
  
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          <h1 className="text-3xl font-bold mb-6">Prospection</h1>
          <p className="text-muted-foreground mb-6">
            Consultez toutes les réservations effectuées sur les biens de l'agence.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockReservations.map((reservation) => (
              <Card 
                key={reservation.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleOpenDetails(reservation)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{reservation.property}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><span className="font-medium">Client:</span> {reservation.client}</p>
                    <p><span className="font-medium">Date:</span> {reservation.date} à {reservation.time}</p>
                    <p>
                      <span className="font-medium">Statut:</span>{" "}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        reservation.status === "confirmed" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {reservation.status === "confirmed" ? "Confirmé" : "En attente"}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedReservation && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Détails de la réservation</DialogTitle>
                  <DialogDescription>
                    Informations complètes sur la réservation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <h3 className="font-semibold">Propriété</h3>
                    <p>{selectedReservation.property}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Client</h3>
                    <p>{selectedReservation.client}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Date et heure</h3>
                    <p>{selectedReservation.date} à {selectedReservation.time}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Contact</h3>
                    <p>Email: {selectedReservation.contact}</p>
                    <p>Téléphone: {selectedReservation.phone}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Statut</h3>
                    <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedReservation.status === "confirmed" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {selectedReservation.status === "confirmed" ? "Confirmé" : "En attente"}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Fermer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
