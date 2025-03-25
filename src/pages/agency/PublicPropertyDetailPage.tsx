import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, StarIcon, BedDouble, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import PropertyMap from "@/components/PropertyMap";
import PropertyHeader from "@/components/property/PropertyHeader";
import PropertyImageGallery from "@/components/property/PropertyImageGallery";
import PropertyStats from "@/components/property/PropertyStats";
import SimilarProperties from "@/components/property/SimilarProperties";
import PropertyMetaTags from "@/components/property/PropertyMetaTags";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function PublicPropertyDetailPage() {
  const navigate = useNavigate();
  const { agencySlug, propertyId } = useParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    startDate: "",
    endDate: "",
  });
  const { toast } = useToast();

  const { data: property } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          agencies(*),
          zone (
            id,
            nom,
            latitude,
            longitude,
            circle_radius
          )
        `)
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const createReservation = useMutation({
    mutationFn: async ({
      firstName,
      lastName,
      phone,
      propertyId,
      agencyId,
      startDate,
      endDate,
    }: {
      firstName: string;
      lastName: string;
      phone: string;
      propertyId: string;
      agencyId: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const isRental = property?.property_offer_type === 'LOCATION';
      
      if (!isRental) {
        const { data: existingReservation, error: reservationCheckError } = await supabase
          .from("reservations")
          .select("*")
          .eq("property_id", propertyId)
          .eq("client_phone", phone)
          .single();

        if (reservationCheckError?.code !== "PGRST116") {
          if (existingReservation) {
            throw new Error("Vous avez déjà réservé ce bien pour un achat");
          }
          if (reservationCheckError) throw reservationCheckError;
        }
      }

      const { data: reservationNumberData, error: reservationNumberError } = await supabase
        .rpc('generate_reservation_number');

      if (reservationNumberError) throw reservationNumberError;

      const { data: existingClient, error: clientCheckError } = await supabase
        .from("clients")
        .select("*")
        .eq("phone_number", phone)
        .single();

      let client;

      if (clientCheckError?.code === "PGRST116") {
        const { data: newClient, error: insertError } = await supabase
          .from("clients")
          .insert({
            first_name: firstName,
            last_name: lastName,
            phone_number: phone,
            agency_id: agencyId,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Client error:", insertError);
          throw insertError;
        }
        
        client = newClient;
      } else if (clientCheckError) {
        throw clientCheckError;
      } else {
        client = existingClient;
      }

      const reservationData = {
        client_phone: phone,
        property_id: propertyId,
        agency_id: agencyId,
        reservation_number: reservationNumberData,
        type: isRental ? 'LOCATION' : 'VENTE',
        status: 'En attente',
        rental_start_date: isRental ? startDate : null,
        rental_end_date: isRental ? endDate : null
      };

      const { data: reservation, error: reservationError } = await supabase
        .from("reservations")
        .insert(reservationData)
        .select("reservation_number")
        .single();

      if (reservationError) {
        console.error("Reservation error:", reservationError);
        throw reservationError;
      }

      return { 
        client,
        reservation_number: reservation.reservation_number 
      };
    },
    onSuccess: ({ reservation_number }) => {
      toast({
        title: "Réservation confirmée !",
        description: `Votre numéro de réservation est : ${reservation_number}`,
      });
      setIsReservationOpen(false);
      setFormData({ 
        firstName: "", 
        lastName: "", 
        phone: "", 
        startDate: "", 
        endDate: "" 
      });
    },
    onError: (error: Error) => {
      console.error("Reservation error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la réservation. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property?.agencies?.id) return;

    const isRental = property.property_offer_type === 'LOCATION';
    const isLongTermRental = isRental && property.type_location === 'longue_duree';
    const isShortTermRental = isRental && property.type_location === 'courte_duree';
    
    if (isShortTermRental && (!formData.startDate || !formData.endDate)) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner les dates de location",
        variant: "destructive",
      });
      return;
    }
    
    if (isLongTermRental && !formData.startDate) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner la date de début de location",
        variant: "destructive",
      });
      return;
    }

    try {
      // Pour les locations longue durée, calculer automatiquement la date de fin
      let endDate = formData.endDate;
      if (isLongTermRental && formData.startDate) {
        const startDate = new Date(formData.startDate);
        const endMonth = startDate.getMonth() + 2; // +1 pour le mois suivant, +1 car les mois sont indexés à partir de 0
        const endYear = endMonth > 11 ? startDate.getFullYear() + 1 : startDate.getFullYear();
        const adjustedEndMonth = endMonth > 11 ? endMonth - 12 : endMonth;
        
        // Obtenir le dernier jour du mois suivant
        const lastDay = new Date(endYear, adjustedEndMonth, 0).getDate();
        const calculatedEndDate = new Date(endYear, adjustedEndMonth - 1, lastDay);
        
        endDate = format(calculatedEndDate, 'yyyy-MM-dd');
      }
      
      createReservation.mutate({
        ...formData,
        endDate: endDate,
        propertyId: property.id,
        agencyId: property.agencies.id,
      });
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission du formulaire. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const { data: similarProperties } = useQuery({
    queryKey: ["similar-properties", property?.property_type, property?.price, property?.zone?.id, property?.property_offer_type],
    enabled: !!property,
    queryFn: async () => {
      const minPrice = property.price * 0.8;
      const maxPrice = property.price * 1.2;

      const query = supabase
        .from("properties")
        .select("*")
        .eq("property_type", property.property_type)
        .eq("property_offer_type", property.property_offer_type)
        .eq("agency_id", property.agency_id)
        .eq("zone_id", property.zone?.id)
        .neq("id", propertyId)
        .eq("is_available", true);

      const { data, error } = await query.limit(6);

      if (error) throw error;
      return data;
    },
  });

  const handleBack = () => {
    navigate(`/${agencySlug}`);
  };

  const handleSimilarPropertyClick = (propertyId: string) => {
    navigate(`/${agencySlug}/properties/${propertyId}/public`);
  };

  const handleImageClick = (imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
  };

  const handleNextImage = () => {
    if (property?.photos) {
      setCurrentImageIndex((prev) => 
        prev === property.photos.length - 1 ? 0 : prev + 1
      );
      setSelectedImage(property.photos[currentImageIndex + 1] || property.photos[0]);
    }
  };

  const handlePrevImage = () => {
    if (property?.photos) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.photos.length - 1 : prev - 1
      );
      setSelectedImage(property.photos[currentImageIndex - 1] || property.photos[property.photos.length - 1]);
    }
  };

  const getPropertyConditionLabel = (condition: string) => {
    switch (condition) {
      case "VEFA":
        return "Vente en l'État Futur d'Achèvement";
      case "NEUF":
        return "Neuf";
      case "RENOVE":
        return "Rénové";
      case "USAGE":
        return "Usage";
      default:
        return condition;
    }
  };

  if (!property) return null;

  const isRental = property.property_offer_type === 'LOCATION';

  return (
    <div className="min-h-screen bg-background">
      <PropertyMetaTags
        title={property.title}
        description={property.description || ""}
        price={property.price}
        photos={property.photos}
      />

      <PropertyHeader
        onBack={handleBack}
        agencyLogo={property.agencies?.logo_url}
        agencyName={property.agencies?.agency_name}
        primaryColor={property.agencies?.primary_color}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4">
          <Badge variant="secondary" className="text-sm">
            {property.property_type}
          </Badge>
          <Badge 
            className="text-sm text-white"
            style={{ backgroundColor: property.agencies?.primary_color || '#0066FF' }}
          >
            {property.property_status}
          </Badge>
          <Badge 
            className="text-sm text-white"
            style={{ backgroundColor: property.agencies?.primary_color || '#0066FF' }}
          >
            {property.property_offer_type === 'VENTE' ? 'À Vendre' : 'À Louer'}
          </Badge>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
          <Button
            onClick={() => setIsReservationOpen(true)}
            style={{ backgroundColor: property.agencies?.primary_color }}
            className="text-white"
          >
            Réserver ce bien
          </Button>
        </div>

        <p className="text-gray-600 mb-2">
          {property.zone?.nom}
        </p>
        {property.reference_number && (
          <p className="text-sm text-muted-foreground mb-6">
            Référence : {property.reference_number}
          </p>
        )}

        {property.property_condition && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <StarIcon className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">État du bien :</span>
                  <span>{getPropertyConditionLabel(property.property_condition)}</span>
                </div>
                {property.property_condition === "VEFA" && property.vefa_availability_date && (
                  <div className="text-gray-600">
                    Date de disponibilité : {format(new Date(property.vefa_availability_date), 'dd MMMM yyyy', { locale: fr })}
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <BedDouble className="h-5 w-5" />
                  <span className="font-semibold">Meublé :</span>
                  <span>{property.is_furnished ? "Oui" : "Non"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <PropertyImageGallery
              images={property.photos || []}
              title={property.title}
              onImageClick={handleImageClick}
            />
          </div>

          <div className="h-[300px]">
            <PropertyMap 
              latitude={property.zone?.latitude || null} 
              longitude={property.zone?.longitude || null}
              radius={property.zone?.circle_radius || 5000}
            />
          </div>
        </div>

        <PropertyStats
          price={property.price}
          bedrooms={property.bedrooms}
          surfaceArea={property.surface_area}
        />

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <p className="text-gray-600 leading-relaxed">{property.description}</p>
        </div>

        {property.amenities && property.amenities.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Équipements</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.amenities.map((amenity, index) => (
                <div key={index} className="bg-gray-100 p-4 rounded-lg">
                  {amenity}
                </div>
              ))}
            </div>
          </div>
        )}

        {similarProperties && similarProperties.length > 0 && (
          <SimilarProperties
            properties={similarProperties.map(prop => ({
              id: prop.id,
              title: prop.title,
              photos: prop.photos || [],
              price: prop.price,
              bedrooms: prop.bedrooms,
              surfaceArea: prop.surface_area,
              region: prop.region,
              propertyOfferType: prop.property_offer_type,
              onClick: handleSimilarPropertyClick
            }))}
            agencyPrimaryColor={property.agencies?.primary_color}
          />
        )}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage}
                alt={property.title}
                className="w-full h-auto"
              />
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full">
                {currentImageIndex + 1}/{property.photos?.length}
              </div>
              <Button
                variant="ghost"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
                onClick={handlePrevImage}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white rotate-180"
                onClick={handleNextImage}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isReservationOpen} onOpenChange={setIsReservationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réserver ce bien</DialogTitle>
            <DialogDescription>
              Remplissez le formulaire ci-dessous pour réserver ce bien immobilier.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReservationSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                pattern="[0-9]*"
                minLength={9}
                maxLength={15}
                placeholder="Ex: 777777777"
              />
            </div>
            {isRental && (
              <>
                <div>
                  <Label htmlFor="startDate">Date de début</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>
                {property.type_location === 'courte_duree' && (
                  <div>
                    <Label htmlFor="endDate">Date de fin</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                        min={formData.startDate || format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                  </div>
                )}
                {property.type_location === 'longue_duree' && (
                  <div className="text-sm text-muted-foreground">
                    <p>Pour les locations longue durée, la date de fin sera automatiquement fixée au dernier jour du mois suivant.</p>
                  </div>
                )}
              </>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={createReservation.isPending}
                style={{ backgroundColor: property.agencies?.primary_color }}
                className="text-white"
              >
                {createReservation.isPending ? "En cours..." : "Réserver"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
