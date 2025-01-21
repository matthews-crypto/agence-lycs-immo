import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Home, Euro, Bath, BedDouble, ArrowRight } from "lucide-react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { Link } from "react-router-dom";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AddPropertyDialog } from "@/components/agency/properties/AddPropertyDialog";

export default function AgencyPropertiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { agency } = useAgencyContext();

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ["properties", agency?.id],
    queryFn: async () => {
      if (!agency?.id) {
        throw new Error("Agency ID not found");
      }

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("agency_id", agency.id);

      if (error) throw error;
      return data;
    },
    enabled: !!agency?.id,
  });

  if (error) {
    console.error("Error fetching properties:", error);
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Une erreur est survenue lors du chargement des propriétés</p>
      </div>
    );
  }

  const filteredProperties = properties?.filter(
    (property) =>
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        <AgencySidebar />
        <div className="flex-1">
          <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col space-y-8">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <h1 className="text-4xl font-bold">Nos Biens Immobiliers</h1>
                  <AddPropertyDialog />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher par nom ou ville..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Properties Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <Card key={n} className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-lg" />
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties?.map((property) => (
                    <Link 
                      key={property.id} 
                      to={`/${agency?.slug}/properties/${property.id}`}
                      className="transition-transform hover:scale-105"
                    >
                      <Card className="overflow-hidden h-full">
                        <div 
                          className="h-48 bg-cover bg-center"
                          style={{
                            backgroundImage: property.photos?.length 
                              ? `url(${property.photos[0]})` 
                              : "url(/placeholder.svg)"
                          }}
                        />
                        <CardHeader>
                          <CardTitle className="line-clamp-1">{property.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Home className="h-4 w-4" />
                            <span>{property.property_type}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Euro className="h-4 w-4" />
                            <span>{property.price.toLocaleString()} FCFA</span>
                          </div>
                          {(property.bedrooms || property.bathrooms) && (
                            <div className="flex space-x-4">
                              {property.bedrooms && (
                                <div className="flex items-center space-x-1">
                                  <BedDouble className="h-4 w-4" />
                                  <span>{property.bedrooms}</span>
                                </div>
                              )}
                              {property.bathrooms && (
                                <div className="flex items-center space-x-1">
                                  <Bath className="h-4 w-4" />
                                  <span>{property.bathrooms}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {property.city}
                          </div>
                          <ArrowRight className="h-4 w-4" />
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}