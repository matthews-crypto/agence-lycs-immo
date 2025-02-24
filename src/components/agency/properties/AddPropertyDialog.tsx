
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { ScrollArea } from "@/components/ui/scroll-area";

const propertySchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  price: z.coerce.number().min(1, "Le prix est requis"),
  property_type: z.string().min(1, "Le type de bien est requis"),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  surface_area: z.coerce.number().optional(),
  region: z.string().min(1, "La région est requise"),
  zone: z.string().min(1, "La zone est requise"),
  address: z.string().optional(),
  year_built: z.coerce.number().optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

type Region = {
  id: number;
  nom: string;
};

type Zone = {
  id: number;
  nom: string;
  region_id: number | null;
};

export function AddPropertyDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const [regions, setRegions] = useState<Region[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: "",
      description: "",
      price: undefined,
      property_type: "",
      bedrooms: undefined,
      bathrooms: undefined,
      surface_area: undefined,
      region: "",
      zone: "",
      address: "",
      year_built: undefined,
    },
  });

  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase
        .from("region")
        .select("*")
        .order('nom');
      
      if (error) {
        console.error("Error fetching regions:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les régions",
        });
        return;
      }
      
      setRegions(data);
    };

    fetchRegions();
  }, [toast]);

  useEffect(() => {
    const fetchZones = async () => {
      if (!selectedRegionId) {
        setZones([]);
        return;
      }

      const { data, error } = await supabase
        .from("zone")
        .select("*")
        .eq('region_id', selectedRegionId)
        .order('nom');
      
      if (error) {
        console.error("Error fetching zones:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les zones",
        });
        return;
      }
      
      setZones(data);
    };

    fetchZones();
  }, [selectedRegionId, toast]);

  const onSubmit = async (data: PropertyFormValues) => {
    if (!agency?.id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "ID de l'agence non trouvé",
      });
      return;
    }

    try {
      // Find the region and zone names based on the selected IDs
      const selectedRegion = regions.find(r => r.id === parseInt(data.region));
      const selectedZone = zones.find(z => z.id === parseInt(data.zone));

      if (!selectedRegion || !selectedZone) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Région ou zone invalide",
        });
        return;
      }

      const propertyData = {
        title: data.title,
        description: data.description,
        price: data.price,
        property_type: data.property_type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        surface_area: data.surface_area,
        region: selectedRegion.nom,
        city: selectedZone.nom,
        address: data.address || null,
        year_built: data.year_built,
        agency_id: agency.id,
        property_status: "DISPONIBLE" as const,
        is_available: true,
        amenities: [] as string[],
        photos: [] as string[],
      };

      const { data: newProperty, error } = await supabase
        .from("properties")
        .insert(propertyData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le bien a été ajouté avec succès",
      });
      setOpen(false);
      form.reset();
      
      // Redirection vers la page de gestion des images
      navigate(`/${agency.slug}/properties/${newProperty.id}/images`);
    } catch (error) {
      console.error("Error adding property:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du bien",
      });
    }
  };

  const handleRegionChange = (regionId: string) => {
    setSelectedRegionId(parseInt(regionId));
    form.setValue('zone', ''); // Reset zone when region changes
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90">
          <PlusCircle className="h-5 w-5" />
          Ajouter un bien
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau bien</DialogTitle>
          <DialogDescription>
            Remplissez les informations du bien immobilier ci-dessous.
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
                      <Input placeholder="Titre du bien" {...field} />
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
                        <SelectItem value="APARTMENT">Appartement</SelectItem>
                        <SelectItem value="HOUSE">Maison</SelectItem>
                        <SelectItem value="VILLA">Villa</SelectItem>
                        <SelectItem value="LAND">Terrain</SelectItem>
                        <SelectItem value="COMMERCIAL">Local commercial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix</FormLabel>
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
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chambres</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Nombre de chambres"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salles de bain</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Nombre de salles de bain"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        field.onChange(value);
                        handleRegionChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une région" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id.toString()}>
                              {region.nom}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!selectedRegionId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedRegionId ? "Sélectionnez une zone" : "Choisissez d'abord une région"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {zones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.id.toString()}>
                              {zone.nom}
                            </SelectItem>
                          ))}
                        </ScrollArea>
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      Adresse complémentaire <span className="text-sm text-muted-foreground">(optionnel)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Adresse complémentaire" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year_built"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année de construction</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Année de construction"
                        {...field}
                      />
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
              >
                Annuler
              </Button>
              <Button type="submit">Ajouter le bien</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
