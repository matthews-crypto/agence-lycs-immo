
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Mail, 
  Home, 
  CalendarDays, 
  Tag,
  Clock
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
  if (!client) return null;
  
  const isRental = reservation?.type === 'LOCATION';
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User /> Client Information
          </DialogTitle>
          <DialogDescription>
            Detailed information about {client.first_name} {client.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Client Information Section */}
          <section>
            <h3 className="text-lg font-medium">Contact Information</h3>
            <Separator className="my-2" />
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{client.first_name} {client.last_name}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
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
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Property:</span>
                  <span>{property.title}</span>
                </div>
                {property.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Address:</span>
                    <span>{property.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Price:</span>
                  <span>{property.price.toLocaleString()} €</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
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
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Reference:</span>
                  <span>{reservation.reservation_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Status:</span>
                  <span className="capitalize">{reservation.status.toLowerCase()}</span>
                </div>
                {isRental ? (
                  <>
                    {reservation.rental_start_date && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Rental Start:</span>
                        <span>{new Date(reservation.rental_start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {reservation.rental_end_date && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Rental End:</span>
                        <span>{new Date(reservation.rental_end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {reservation.appointment_date && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
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
      </DialogContent>
    </Dialog>
  );
}
