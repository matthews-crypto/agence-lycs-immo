import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
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
  DialogTrigger,
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
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

// Define the property condition type to match Supabase enum
type PropertyCondition = "VEFA" | "NEUF" | "RENOVE" | "USAGE";

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
});

type PropertyFormValues = z.infer<typeof propertySchema>;
type Region = { id: number; nom: string };
type Zone = { id: number; nom: string };

const propertyConditionTranslations = {
  VEFA: "Vente en l'État Futur d'Achèvement (VEFA)",
  NEUF: "Neuf",
  RENOVE: "Récemment rénové",
  USAGE: "Usagé",
};

export function AddPropertyDialog() {
  const [open, setOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [availableCities, setAvailableCities] = useState<Zone[]>([]);
  const [isLocation, setIsLocation] = useState(false);
  const [isVente, setIsVente] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { agency } = useAgencyContext();
  const navigate = useNavigate();

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
    };

    fetchRegions();
  }, []);

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
    },
  });

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
    if (!agency?.id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "ID de l'agence non trouvé",
      });
      return;
    }

    setLoading(true);

    try {
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
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
        agency_id: agency.id,
        property_status: "DISPONIBLE" as const,
        is_available: true,
        is_furnished: data.is_furnished,
        property_offer_type: data.property_type === "TERRAIN" ? "VENTE" : data.property_offer_type,
        property_condition: data.property_condition as PropertyCondition | null,
        vefa_availability_date: data.property_condition === "VEFA" ? data.vefa_availability_date : null,
        amenities: [] as string[],
      };

      let attempt = 0;
      let newProperty = null;
      let error = null;
      
      while (attempt < 3 && !newProperty) {
        attempt++;
        const response = await supabase
          .from("properties")
          .insert(propertyData)
          .select()
          .single();
          
        error = response.error;
        
        if (!error) {
          newProperty = response.data;
          break;
        }
        
        if (error.code !== '23505' || !error.message.includes('unique_reference_per_agency')) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (error) {
        console.error("Error adding property (attempt " + attempt + "):", error);
        
        if (error.code === '23505' && error.message.includes('unique_reference_per_agency')) {
          toast({
            variant: "destructive",
            title: "Erreur de référence",
            description: "Un problème est survenu avec la génération de la référence. Veuillez réessayer.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Une erreur est survenue lors de la création de l'offre: " + error.message,
          });
        }
        
        setLoading(false);
        return;
      }

      toast({
        title: "Succès",
        description: "L'offre a été ajoutée avec succès",
      });
      setOpen(false);
      form.reset();
      setLoading(false);
      
      navigate(`/${agency.slug}/properties/${newProperty.id}/images`);
    } catch (error) {
      console.error("Error adding property:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'offre",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90">
          <PlusCircle className="h-5 w-5" />
          Nouvelle Offre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Creation Offre</DialogTitle>
          <DialogDescription>
            Remplissez les informations de l'offre.
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
                              defaultValue={field.value}
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
                            onValueChange={field.onChange}
                            defaultValue={field.value?.toString()}
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
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création en cours...' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
