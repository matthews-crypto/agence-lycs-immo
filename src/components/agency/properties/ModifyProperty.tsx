import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

// Define the property condition type to match Supabase enum
type PropertyCondition = "VEFA" | "NEUF" | "RENOVE" | "USAGE";
type Region = { id: number; nom: string };
type Zone = { id: number; nom: string };

const propertySchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  property_type: z.string().min(1, "Le type de bien est requis"),
  bedrooms: z.coerce.number().optional(),
  price: z.coerce.number().min(1, "Le prix est requis"),
  surface_area: z.coerce.number().optional(),
  address: z.string().optional(),
  zone_id: z.coerce.number().min(1, "La zone est requise"),
  region: z.string().min(1, "La région est requise"),
  postal_code: z.string().optional(),
  is_furnished: z.boolean().optional(),
  property_offer_type: z.string(),
  property_condition: z.enum(["VEFA", "NEUF", "RENOVE", "USAGE"] as const).optional(),
  vefa_availability_date: z.string().optional(),
  type_location: z.string().optional(),
});

const propertyConditionTranslations = {
  VEFA: "Vente en l'État Futur d'Achèvement (VEFA)",
  NEUF: "Neuf",
  RENOVE: "Récemment rénové",
  USAGE: "Usagé",
};

type PropertyFormValues = z.infer<typeof propertySchema>;

interface ModifyPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string | undefined;
}

export default function ModifyPropertyDialog({ open, onOpenChange, propertyId }: ModifyPropertyDialogProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [availableCities, setAvailableCities] = useState<Zone[]>([]);
  const [isLocation, setIsLocation] = useState(false);
  const [isVente, setIsVente] = useState(true);
  const { toast } = useToast();
  const { agency } = useAgencyContext();

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: "",
      description: "",
      property_type: "",
      bedrooms: undefined,
      price: undefined,
      surface_area: undefined,
      address: "",
      zone_id: undefined,
      region: "",
      postal_code: "",
      is_furnished: false,
      property_offer_type: "VENTE",
      property_condition: undefined,
      vefa_availability_date: undefined,
      type_location: undefined,
    },
  });

  // Fetch property data and set form values
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return;

      const { data: property, error } = await supabase
        .from("properties")
        .select(`
          *,
          zone (
            id,
            nom,
            region (
              id,
              nom
            )
          )
        `)
        .eq("id", propertyId)
        .single();

      if (error) {
        console.error("Error fetching property:", error);
        return;
      }

      if (property) {
        // Set form values
        form.reset({
          title: property.title || "",
          description: property.description || "",
          property_type: property.property_type || "",
          bedrooms: property.bedrooms || undefined,
          price: property.price || undefined,
          surface_area: property.surface_area || undefined,
          address: property.address || "",
          zone_id: property.zone_id || undefined,
          region: property.region || "", // We'll update this when regions are loaded
          postal_code: property.postal_code || "",
          is_furnished: property.is_furnished || false,
          property_offer_type: property.property_offer_type || "VENTE",
          property_condition: property.property_condition as PropertyCondition | undefined,
          vefa_availability_date: property.vefa_availability_date 
            ? format(new Date(property.vefa_availability_date), "yyyy-MM-dd")
            : undefined,
          type_location: property.type_location || undefined,
        });

        // Set offer type state
        setIsLocation(property.property_offer_type === "LOCATION");
        setIsVente(property.property_offer_type === "VENTE");

        // Set selected region if available
        if (property.zone?.region?.id) {
          setSelectedRegion(property.zone.region.id.toString());
        }
      }
    };

    fetchProperty();
  }, [propertyId, form]);

  // Fetch regions
  useEffect(() => {
    const fetchRegions = async () => {
      const { data: regionsData, error } = await supabase
        .from('region')
        .select('*')
        .order('nom');
      
      if (error) {
        console.error('Error fetching regions:', error);
        return;
      }
      
      setRegions(regionsData);

      // If form has a region value, find its corresponding ID and set selectedRegion
      const regionValue = form.getValues("region");
      if (regionValue && regionsData) {
        const matchingRegion = regionsData.find(r => r.nom === regionValue);
        if (matchingRegion) {
          setSelectedRegion(matchingRegion.id.toString());
        }
      }
    };

    fetchRegions();
  }, [form]);

  // Fetch cities when region changes
  useEffect(() => {
    const fetchCities = async (regionId: string) => {
      const numericRegionId = parseInt(regionId, 10);
      
      if (isNaN(numericRegionId)) {
        console.error('Invalid region ID:', regionId);
        return;
      }

      const { data: citiesData, error } = await supabase
        .from('zone')
        .select('*')
        .eq('region_id', numericRegionId)
        .order('nom');
      
      if (error) {
        console.error('Error fetching cities:', error);
        return;
      }
      
      setAvailableCities(citiesData);
    };

    if (selectedRegion) {
      fetchCities(selectedRegion);
    } else {
      setAvailableCities([]);
    }
  }, [selectedRegion]);

  const selectedPropertyType = form.watch("property_type");
  const selectedPropertyCondition = form.watch("property_condition");

  const showBedroomsField = ["APPARTEMENT", "MAISON", "BUREAU"].includes(selectedPropertyType);
  const showFurnishedField = ["APPARTEMENT", "MAISON"].includes(selectedPropertyType);
  const showOfferTypeField = ["APPARTEMENT", "MAISON", "BUREAU"].includes(selectedPropertyType);
  const showPropertyConditionField = ["APPARTEMENT", "MAISON", "BUREAU"].includes(selectedPropertyType);
  const showVEFADateField = selectedPropertyCondition === "VEFA";

  const handleLocationChange = (checked: boolean) => {
    if (checked) {
      setIsLocation(true);
      setIsVente(false);
      form.setValue("property_offer_type", "LOCATION");
    }
  };

  const handleVenteChange = (checked: boolean) => {
    if (checked) {
      setIsVente(true);
      setIsLocation(false);
      form.setValue("property_offer_type", "VENTE");
    }
  };

  const onSubmit = async (data: PropertyFormValues) => {
    if (!propertyId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "ID de la propriété non trouvé",
      });
      return;
    }

    try {
      const propertyData = {
        title: data.title,
        description: data.description,
        property_type: data.property_type,
        bedrooms: data.bedrooms,
        price: data.price,
        surface_area: data.surface_area,
        address: data.address,
        zone_id: data.zone_id,
        region: data.region,
        postal_code: data.postal_code,
        is_furnished: data.is_furnished,
        property_offer_type: data.property_type === "TERRAIN" ? "VENTE" : data.property_offer_type,
        property_condition: data.property_condition as PropertyCondition | null,
        vefa_availability_date: data.property_condition === "VEFA" ? data.vefa_availability_date : null,
        type_location: data.property_offer_type === "LOCATION" ? data.type_location : null,
      };

      const { error } = await supabase
        .from("properties")
        .update(propertyData)
        .eq("id", propertyId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'offre a été modifiée avec succès",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error modifying property:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification de l'offre",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modification Offre</DialogTitle>
          <DialogDescription>
            Veuillez modifier les informations de l'offre.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre</FormLabel>
                    <FormControl>
                      <Input placeholder="Titre de l'offre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de bien</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="APPARTEMENT">Appartement</SelectItem>
                        <SelectItem value="MAISON">Maison</SelectItem>
                        <SelectItem value="BUREAU">Bureau</SelectItem>
                        <SelectItem value="TERRAIN">Terrain</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {showPropertyConditionField && (
                <FormField
                  control={form.control}
                  name="property_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>État du bien</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez l'état" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(propertyConditionTranslations).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {showVEFADateField && (
                <FormField
                  control={form.control}
                  name="vefa_availability_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de livraison prévue</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="surface_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surface (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Surface en m²"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {showBedroomsField && (
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de pièces</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Nombre de pièces"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {showOfferTypeField && (
              <div className="flex flex-col space-y-4">
                <FormLabel>Type d'offre</FormLabel>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={isLocation}
                      onCheckedChange={handleLocationChange}
                      id="location"
                    />
                    <label
                      htmlFor="location"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Location
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={isVente}
                      onCheckedChange={handleVenteChange}
                      id="vente"
                    />
                    <label
                      htmlFor="vente"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Vente
                    </label>
                  </div>
                </div>
              </div>
            )}

            {isLocation && (
              <FormField
                control={form.control}
                name="type_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de location</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type de location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="courte_duree">Courte durée</SelectItem>
                        <SelectItem value="longue_duree">Longue durée</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showFurnishedField && (
              <FormField
                control={form.control}
                name="is_furnished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Meublé
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix (CFA)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Prix en FCFA"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description détaillée du bien"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Région</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const selectedRegion = regions.find(r => r.id.toString() === value);
                        if (selectedRegion) {
                          field.onChange(selectedRegion.nom);
                          setSelectedRegion(value);
                        }
                      }}
                      value={selectedRegion}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une région" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id.toString()}>
                            {region.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zone_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(parseInt(value, 10));
                      }}
                      value={field.value?.toString()}
                      disabled={availableCities.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une zone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse complémentaire</FormLabel>
                    <FormControl>
                      <Input placeholder="Adresse complémentaire" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code postal</FormLabel>
                    <FormControl>
                      <Input placeholder="Code postal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Modifier</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
