
import React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Mail, 
  Home, 
  CalendarDays, 
  Tag,
  Clock,
  MapPin
} from "lucide-react";
import { getAbsoluteUrl } from "@/utils/urlUtils";
import { useAgencyContext } from "@/contexts/AgencyContext";
import type { Tables } from "@/integrations/supabase/types";

type ClientDetailsDialogProps = {
  client: Tables<"clients"> | null;
  property: Tables<"properties"> | null;
  reservation: Tables<"reservations"> | null;
  isOpen: boolean;
  onClose: () => void;
  onReservationClick?: (reservationId: string) => void;
};

export function ClientDetailsDialog({ 
  client, 
  property, 
  reservation, 
  isOpen, 
  onClose,
  onReservationClick
}: ClientDetailsDialogProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { agency } = useAgencyContext();
  
  if (!client) return null;
  
  const isRental = reservation?.type === 'LOCATION';

  const handlePropertyClick = () => {
    if (property && agency) {
      navigate(`/${agency.slug}/properties/${property.id}`);
    }
  };

  const handleReservationClick = () => {
    if (reservation && onReservationClick) {
      onReservationClick(reservation.id);
    }
  };
  
  // Content to display in both dialog and sheet
  const content = (
    <div className="space-y-6">
      {/* Client Information Section */}
      <section>
        <h3 className="text-lg font-medium">Informations de Contact</h3>
        <Separator className="my-2" />
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">Nom:</span>
            <span className="break-words">{client.first_name} {client.last_name}</span>
          </div>
          {client.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Email:</span>
              <span className="break-all">{client.email}</span>
            </div>
          )}
          {client.phone_number && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Téléphone:</span>
              <span>{client.phone_number}</span>
            </div>
          )}
        </div>
      </section>
      
      {/* Property Information Section */}
      {property && (
        <section>
          <h3 className="text-lg font-medium">Informations du Bien</h3>
          <Separator className="my-2" />
          <div className="grid gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Bien:</span>
              <button 
                onClick={handlePropertyClick} 
                className="text-blue-600 hover:underline break-words"
              >
                {property.title}
              </button>
            </div>
            {property.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                <span className="font-medium mt-0.5">Adresse:</span>
                <span className="break-words">{property.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Prix:</span>
              <span>{property.price.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Type:</span>
              <span>{property.property_type}</span>
            </div>
          </div>
        </section>
      )}
      
      {/* Reservation Information Section */}
      {reservation && (
        <section>
          <h3 className="text-lg font-medium">
            {isRental ? 'Informations de Location' : 'Informations de Vente'}
          </h3>
          <Separator className="my-2" />
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Référence:</span>
              <button 
                onClick={handleReservationClick}
                className="text-blue-600 hover:underline"
              >
                {reservation.reservation_number}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Statut:</span>
              <span className="capitalize">{reservation.status.toLowerCase()}</span>
            </div>
            {isRental ? (
              <>
                {reservation.rental_start_date && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Début de location:</span>
                    <span>{new Date(reservation.rental_start_date).toLocaleDateString()}</span>
                  </div>
                )}
                {reservation.rental_end_date && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Fin de location:</span>
                    <span>{new Date(reservation.rental_end_date).toLocaleDateString()}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {reservation.appointment_date && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Date de vente:</span>
                    <span>{new Date(reservation.appointment_date).toLocaleDateString()}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
  
  return isMobile ? (
    // Mobile view: use Sheet (bottom drawer)
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <User /> Informations Client
          </SheetTitle>
          <SheetDescription>
            Informations détaillées sur {client.first_name} {client.last_name}
          </SheetDescription>
        </SheetHeader>
        
        {content}
      </SheetContent>
    </Sheet>
  ) : (
    // Desktop view: use Dialog (modal)
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User /> Informations Client
          </DialogTitle>
          <DialogDescription>
            Informations détaillées sur {client.first_name} {client.last_name}
          </DialogDescription>
        </DialogHeader>
        
        {content}
      </DialogContent>
    </Dialog>
  );
}
