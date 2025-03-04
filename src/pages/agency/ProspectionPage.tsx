
import { useState } from "react";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, User, Phone, Clock, Home } from "lucide-react";

interface Reservation {
  id: string;
  propertyName: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  location: string;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
}

// Données de réservation fictives pour la démonstration
const mockReservations: Reservation[] = [
  {
    id: "res-001",
    propertyName: "Appartement Haussmannien",
    clientName: "Jean Dupont",
    clientPhone: "06 12 34 56 78",
    date: "2023-06-15",
    time: "14:30",
    location: "75008 Paris",
    status: "confirmed",
    notes: "Client intéressé par l'achat, recherche un bien avec 3 chambres"
  },
  {
    id: "res-002",
    propertyName: "Villa Méditerranéenne",
    clientName: "Marie Laurent",
    clientPhone: "07 98 76 54 32",
    date: "2023-06-16",
    time: "10:00",
    location: "06400 Cannes",
    status: "pending",
    notes: "Première visite, cliente cherche une résidence secondaire"
  },
  {
    id: "res-003",
    propertyName: "Loft Industriel",
    clientName: "Paul Martin",
    clientPhone: "06 45 67 89 12",
    date: "2023-06-17",
    time: "16:00",
    location: "69001 Lyon",
    status: "cancelled",
    notes: "Client cherche plutôt dans le 7ème arrondissement"
  },
  {
    id: "res-004",
    propertyName: "Maison Contemporaine",
    clientName: "Sophie Petit",
    clientPhone: "07 12 34 56 78",
    date: "2023-06-18",
    time: "11:30",
    location: "44000 Nantes",
    status: "confirmed"
  },
  {
    id: "res-005",
    propertyName: "Studio Centre-Ville",
    clientName: "Thomas Durand",
    clientPhone: "06 87 65 43 21",
    date: "2023-06-19",
    time: "15:00",
    location: "33000 Bordeaux",
    status: "pending",
    notes: "Investisseur cherchant un bien locatif"
  },
  {
    id: "res-006",
    propertyName: "Chalet Montagnard",
    clientName: "Camille Roux",
    clientPhone: "07 65 43 21 09",
    date: "2023-06-20",
    time: "09:30",
    location: "74120 Megève",
    status: "confirmed",
    notes: "Cliente internationale, prévoir un interprète"
  }
];

export default function ProspectionPage() {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmé";
      case "pending": return "En attente";
      case "cancelled": return "Annulé";
      default: return status;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AgencySidebar />
      <div className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-6">Prospection</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockReservations.map((reservation) => (
            <Dialog key={reservation.id}>
              <DialogTrigger asChild>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedReservation(reservation)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{reservation.propertyName}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{reservation.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(reservation.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{reservation.time}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                      {getStatusText(reservation.status)}
                    </div>
                  </CardFooter>
                </Card>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl">Détails de la réservation</DialogTitle>
                </DialogHeader>
                
                <div className="mt-4 space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <Home className="mr-2 h-5 w-5" />
                      Propriété
                    </h3>
                    <p className="text-lg">{reservation.propertyName}</p>
                    <div className="flex items-center mt-1 text-sm text-muted-foreground">
                      <MapPin className="mr-1 h-4 w-4" />
                      {reservation.location}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Client
                    </h3>
                    <p className="text-lg">{reservation.clientName}</p>
                    <div className="flex items-center mt-1 text-sm text-muted-foreground">
                      <Phone className="mr-1 h-4 w-4" />
                      {reservation.clientPhone}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Date et heure
                    </h3>
                    <p className="text-lg">
                      {new Date(reservation.date).toLocaleDateString('fr-FR')} à {reservation.time}
                    </p>
                    <div className="flex items-center mt-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusText(reservation.status)}
                      </div>
                    </div>
                  </div>
                  
                  {reservation.notes && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">Notes</h3>
                      <p className="text-sm">{reservation.notes}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </div>
  );
}
