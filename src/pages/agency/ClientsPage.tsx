
import React, { useState, useEffect } from 'react';
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ClientCard } from "@/components/agency/clients/ClientCard";
import { ClientDetailsDialog } from "@/components/agency/clients/ClientDetailsDialog";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";

export default function ClientsPage() {
  const { agency } = useAgencyContext();
  const [clients, setClients] = useState<Tables<"clients">[]>([]);
  const [properties, setProperties] = useState<Tables<"properties">[]>([]);
  const [reservations, setReservations] = useState<Tables<"reservations">[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Get the selected client, property and reservation
  const selectedClient = clients.find(client => client.id === selectedClientId) || null;
  const selectedProperty = selectedClient 
    ? properties.find(property => property.client_id === selectedClientId) || null
    : null;
  const selectedReservation = selectedProperty
    ? reservations.find(reservation => reservation.property_id === selectedProperty.id) || null
    : null;

  useEffect(() => {
    const fetchClients = async () => {
      if (!agency) return;
      
      setLoading(true);
      try {
        // Fetch properties with client_id to identify clients that have properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from("properties")
          .select("*")
          .eq("agency_id", agency.id)
          .not("client_id", "is", null);
        
        if (propertiesError) throw propertiesError;
        setProperties(propertiesData || []);
        
        // Get unique client IDs
        const clientIds = [...new Set(propertiesData.map(prop => prop.client_id).filter(Boolean))];
        
        if (clientIds.length > 0) {
          // Fetch clients with those IDs
          const { data: clientsData, error: clientsError } = await supabase
            .from("clients")
            .select("*")
            .in("id", clientIds);
          
          if (clientsError) throw clientsError;
          setClients(clientsData || []);
          
          // Fetch reservations for these properties
          const propertyIds = propertiesData.map(prop => prop.id);
          if (propertyIds.length > 0) {
            const { data: reservationsData, error: reservationsError } = await supabase
              .from("reservations")
              .select("*")
              .in("property_id", propertyIds);
            
            if (reservationsError) throw reservationsError;
            setReservations(reservationsData || []);
          }
        }
      } catch (error) {
        console.error("Error fetching clients data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [agency]);

  const handleOpenDetails = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleCloseDetails = () => {
    setSelectedClientId(null);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AgencySidebar />
        <div className="flex-1 overflow-auto p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Agency Clients</h1>
            <p className="text-muted-foreground">Manage and view information about your clients</p>
          </div>
          
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : clients.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-lg font-medium">No clients found</h3>
              <p className="text-muted-foreground">
                No clients with associated properties were found for this agency.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onOpenDetails={handleOpenDetails}
                />
              ))}
            </div>
          )}
          
          {/* Client Details Dialog */}
          <ClientDetailsDialog
            client={selectedClient}
            property={selectedProperty}
            reservation={selectedReservation}
            isOpen={!!selectedClientId}
            onClose={handleCloseDetails}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
