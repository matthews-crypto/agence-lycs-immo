
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, MapPin } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ClientCardProps = {
  client: Tables<"clients">;
  onOpenDetails: (clientId: string) => void;
};

export function ClientCard({ client, onOpenDetails }: ClientCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-primary/5 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          {client.first_name} {client.last_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2 text-sm">
          {client.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
          )}
          {client.phone_number && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone_number}</span>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          className="mt-4 w-full" 
          onClick={() => onOpenDetails(client.id)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
