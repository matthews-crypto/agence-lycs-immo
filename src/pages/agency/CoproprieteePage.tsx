import React, { useState, useEffect } from "react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Home, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Lot {
  id: number;
  nom: string;
  created_at: string;
  properties?: Property[];
}

interface Property {
  id: string;
  title: string;
  price: number;
  property_type: string;
  property_status: string;
  property_offer_type: string;
  type_location: string;
  lot: number | null;
}

export default function CoproprieteePage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLotName, setNewLotName] = useState("");
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  // Fetch lots
  const { data: lots, isLoading: isLoadingLots } = useQuery({
    queryKey: ["lots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lot")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lot[];
    },
  });

  // Fetch rental properties
  const { data: rentalProperties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ["rental-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, price, property_type, property_status, property_offer_type, type_location, lot")
        .eq("property_offer_type", "LOCATION")
        .eq("property_status", "DISPONIBLE")
        .eq("agency_id", agency?.id);

      if (error) throw error;
      
      // Filter properties that are currently available for rental
      // (We could add more complex filtering based on rental_end_date in locations table)
      return data as Property[];
    },
  });

  // Fetch properties for a specific lot
  const fetchLotProperties = async (lotId: number) => {
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, price, property_type, property_status, property_offer_type, type_location")
      .eq("lot", lotId)
      .eq("agency_id", agency?.id);

    if (error) throw error;
    return data as Property[];
  };

  // Create lot mutation
  const createLotMutation = useMutation({
    mutationFn: async ({ name, propertyIds }: { name: string; propertyIds: string[] }) => {
      // 1. Create the lot
      const { data: lotData, error: lotError } = await supabase
        .from("lot")
        .insert([{ nom: name }])
        .select("id")
        .single();

      if (lotError) throw lotError;

      // 2. Update properties to associate them with the lot
      if (propertyIds.length > 0) {
        const { error: propertiesError } = await supabase
          .from("properties")
          .update({ lot: lotData.id })
          .in("id", propertyIds);

        if (propertiesError) throw propertiesError;
      }

      return lotData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      queryClient.invalidateQueries({ queryKey: ["rental-properties"] });
      setIsCreateDialogOpen(false);
      setNewLotName("");
      setSelectedProperties([]);
      toast.success("Lot créé avec succès");
    },
    onError: (error) => {
      console.error("Error creating lot:", error);
      toast.error("Erreur lors de la création du lot");
    },
  });

  // Handle lot creation
  const handleCreateLot = () => {
    if (!newLotName.trim()) {
      toast.error("Veuillez saisir un nom pour le lot");
      return;
    }

    if (selectedProperties.length < 2) {
      toast.error("Un lot doit contenir au moins 2 biens");
      return;
    }

    createLotMutation.mutate({
      name: newLotName,
      propertyIds: selectedProperties,
    });
  };

  // Handle property selection
  const handlePropertySelection = (propertyId: string) => {
    setSelectedProperties((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  // Handle lot selection
  const handleLotClick = async (lot: Lot) => {
    try {
      const properties = await fetchLotProperties(lot.id);
      setSelectedLot({ ...lot, properties });
    } catch (error) {
      console.error("Error fetching lot properties:", error);
      toast.error("Erreur lors de la récupération des biens du lot");
    }
  };

  // Handle property click
  const handlePropertyClick = (propertyId: string) => {
    navigate(`/${agency?.slug}/properties/${propertyId}`);
  };

  // Filter lots based on search term
  const filteredLots = lots?.filter((lot) => 
    lot.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold">Gestion des Lots</h1>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Créer un lot
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau lot</DialogTitle>
                    <DialogDescription>
                      Saisissez les informations du lot et sélectionnez au moins 2 biens en location.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="lot-name">Nom du lot</Label>
                      <Input
                        id="lot-name"
                        placeholder="Saisissez le nom du lot"
                        value={newLotName}
                        onChange={(e) => setNewLotName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Biens en location disponibles</Label>
                      <div className="border rounded-md max-h-[300px] overflow-y-auto">
                        {isLoadingProperties ? (
                          <div className="p-4 text-center">Chargement des biens...</div>
                        ) : rentalProperties && rentalProperties.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Titre</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Prix</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rentalProperties.map((property) => (
                                <TableRow key={property.id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedProperties.includes(property.id)}
                                      onCheckedChange={() => handlePropertySelection(property.id)}
                                    />
                                  </TableCell>
                                  <TableCell>{property.title}</TableCell>
                                  <TableCell>{property.property_type}</TableCell>
                                  <TableCell>
                                    {property.price.toLocaleString()} FCFA
                                    {property.type_location === 'longue_duree' && ' /mois'}
                                    {property.type_location === 'courte_duree' && ' /jour'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="p-4 text-center">Aucun bien en location disponible</div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedProperties.length} bien(s) sélectionné(s)
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleCreateLot}
                      disabled={createLotMutation.isPending || !newLotName.trim() || selectedProperties.length < 2}
                    >
                      {createLotMutation.isPending ? "Création..." : "Créer le lot"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Liste des lots */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Liste des lots</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto">
                  {isLoadingLots ? (
                    <div className="text-center py-4">Chargement des lots...</div>
                  ) : filteredLots && filteredLots.length > 0 ? (
                    <div className="space-y-2">
                      {filteredLots.map((lot) => (
                        <div
                          key={lot.id}
                          className={`p-3 rounded-md border cursor-pointer transition-colors hover:bg-muted ${
                            selectedLot?.id === lot.id ? "bg-muted" : ""
                          }`}
                          onClick={() => handleLotClick(lot)}
                        >
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{lot.nom}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Créé le {new Date(lot.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      {searchTerm ? "Aucun lot correspondant à votre recherche" : "Aucun lot disponible"}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Détails du lot */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedLot ? `Détails du lot: ${selectedLot.nom}` : "Détails du lot"}
                  </CardTitle>
                  {selectedLot && (
                    <CardDescription>
                      Créé le {new Date(selectedLot.created_at).toLocaleDateString()}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedLot ? (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Biens dans ce lot</h3>
                      {selectedLot.properties && selectedLot.properties.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Titre</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Prix</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedLot.properties.map((property) => (
                              <TableRow key={property.id}>
                                <TableCell>{property.title}</TableCell>
                                <TableCell>{property.property_type}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{property.property_status}</Badge>
                                </TableCell>
                                <TableCell>
                                  {property.price.toLocaleString()} FCFA
                                  {property.type_location === 'longue_duree' && ' /mois'}
                                  {property.type_location === 'courte_duree' && ' /jour'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePropertyClick(property.id)}
                                  >
                                    Voir détails
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          Aucun bien dans ce lot
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Sélectionnez un lot pour voir ses détails
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
