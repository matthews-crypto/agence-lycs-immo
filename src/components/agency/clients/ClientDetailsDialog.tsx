
import React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
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
import type { Tables } from "@/integrations/supabase/types";

type ClientDetailsDialogProps = {
  client: Tables<"clients"> | null;
  property: Tables<"properties"> | null;
  reservation: Tables<"reservations"> | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ClientDetailsDialog({ 
  client, 
  property, 
  reservation, 
  isOpen, 
  onClose 
}: ClientDetailsDialogProps) {
  const isMobile = useIsMobile();
  
  if (!client) return null;
  
  const isRental = reservation?.type === 'LOCATION';
  
  // Content to display in both dialog and sheet
  const content = (
    <div className="space-y-6">
      {/* Client Information Section */}
      <section>
        <h3 className="text-lg font-medium">Contact Information</h3>
        <Separator className="my-2" />
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">Name:</span>
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
              <span className="font-medium">Phone:</span>
              <span>{client.phone_number}</span>
            </div>
          )}
        </div>
      </section>
      
      {/* Property Information Section */}
      {property && (
        <section>
          <h3 className="text-lg font-medium">Property Information</h3>
          <Separator className="my-2" />
          <div className="grid gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Property:</span>
              <span className="break-words">{property.title}</span>
            </div>
            {property.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                <span className="font-medium mt-0.5">Address:</span>
                <span className="break-words">{property.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Price:</span>
              <span>{property.price.toLocaleString()} €</span>
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
            {isRental ? 'Rental Information' : 'Sale Information'}
          </h3>
          <Separator className="my-2" />
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Reference:</span>
              <span>{reservation.reservation_number}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">Status:</span>
              <span className="capitalize">{reservation.status.toLowerCase()}</span>
            </div>
            {isRental ? (
              <>
                {reservation.rental_start_date && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Rental Start:</span>
                    <span>{new Date(reservation.rental_start_date).toLocaleDateString()}</span>
                  </div>
                )}
                {reservation.rental_end_date && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Rental End:</span>
                    <span>{new Date(reservation.rental_end_date).toLocaleDateString()}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {reservation.appointment_date && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Sale Date:</span>
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
            <User /> Client Information
          </SheetTitle>
          <SheetDescription>
            Detailed information about {client.first_name} {client.last_name}
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
            <User /> Client Information
          </DialogTitle>
          <DialogDescription>
            Detailed information about {client.first_name} {client.last_name}
          </DialogDescription>
        </DialogHeader>
        
        {content}
      </DialogContent>
    </Dialog>
  );
}
