import {useEffect, useState} from "react";
import {useForm, useFormContext} from "react-hook-form";
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

const propertySchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  property_type: z.string().min(1, "Le type de bien est requis"),
  bedrooms: z.coerce.number().min(1, "Le nombre de pièces est requis"),
  price: z.coerce.number().min(1, "Le prix est requis"),
  surface_area: z.coerce.number().optional(),
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().optional(),
  location_lat: z.coerce.number().min(-90,"la latitude doit etre compris entre -90 et 90").max(90,"la latitude doit etre compris entre -90 et 90").nullable(),
  location_lng: z.coerce.number().min(-180,"la longitude doit etre compris entre -180 et 180").max(180,"la longitude doit etre compris entre -180 et 180").nullable(),
  region: z.string().min(1, "La région est requise"),
  postal_code: z.string().optional(),
});

const citiesByRegion: Record<string, string[]> = {
    Dakar: ["Dakar", "Pikine", "Guédiawaye", "Rufisque",  'Bargny',
        'Diamniadio', 'Sébikotane', 'Sangalkam', 'Yène', 'Jaxaay-Parcelles'],
    Diourbel: ['Diourbel', 'Bambey', 'Mbacké', 'Touba', 'Ndindy',
        'Ndoulo', 'Ngoye', 'Lambaye', 'Taïf', 'Dankh Sène'],
    Fatick: ['Fatick', 'Foundiougne', 'Gossas', 'Diofior', 'Sokone',
        'Passy', 'Diakhao', 'Diaoule', 'Niakhar', 'Tattaguine'],
    Kaffrine: [ 'Kaffrine', 'Koungheul', 'Malem Hodar', 'Birkelane', 'Nganda',
        'Diamagadio', 'Kathiote', 'Médinatoul Salam', 'Gniby', 'Boulel'],
    Kaolack: ['Kaolack', 'Guinguinéo', 'Nioro du Rip', 'Gandiaye', 'Kahone',
        'Ndoffane', 'Sibassor', 'Keur Madiabel', 'Ndiédieng', 'Thiaré'],
    Kedougou: ['Kédougou', 'Salémata', 'Saraya', 'Bandafassi', 'Fongolimbi',
        'Dimboli', 'Ninéfécha', 'Tomboronkoto', 'Dindefelo', 'Khossanto'],
    Kolda: ['Kolda', 'Vélingara', 'Médina Yoro Foulah', 'Dabo', 'Salikégné',
        'Saré Yoba Diéga', 'Tankanto Escale', 'Kounkané', 'Dioulacolon', 'Mampatim'],
    Sédhiou: [
        'Sédhiou', 'Bounkiling', 'Goudomp', 'Marsassoum', 'Diannah Malary',
        'Bambaly', 'Djiredji', 'Tankon', 'Diattacounda', 'Samine'
    ],
    Louga: ['Louga', 'Kébémer', 'Linguère', 'Dahra', 'Guéoul',
        'Ndiagne', 'Sakal', 'Niomré', 'Ngueune Sarr', 'Keur Momar Sarr'],
    Matam: ['Matam', 'Kanel', 'Ranérou', 'Ourossogui', 'Thilogne',
        'Waoundé', 'Agnam Civol', 'Bokidiawé', 'Nabadji Civol', 'Sinthiou Bamambé'],
    "Saint-Louis": [ 'Saint-Louis', 'Dagana', 'Richard Toll', 'Rosso', 'Podor',
        'Mpal', 'Rao', 'Ndiébène Gandiol', 'Gandon', 'Fass Ngom'],
    Tambacounda: ['Tambacounda', 'Bakel', 'Goudiry', 'Kidira', 'Koumpentoum',
        'Malème Niani', 'Dialacoto', 'Missirah', 'Kothiary', 'Maka'],
    Thies: [ 'Thiès', 'Mbour', 'Tivaouane', 'Joal-Fadiouth', 'Kayar',
        'Pout', 'Khombole', 'Meckhe', 'Ngoundiane', 'Tassette'],
    Ziguinchor: ['Ziguinchor', 'Bignona', 'Oussouye', 'Thionck Essyl', 'Diouloulou',
        'Kafountine', 'Diembéring', 'Mlomp', 'Santhiaba Manjack', 'Niaguis'],
};

type PropertyFormValues = z.infer<typeof propertySchema>;

export function AddPropertyDialog() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const { toast } = useToast();
  const { agency } = useAgencyContext();
  const navigate = useNavigate();

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: "",
      description: "",
      property_type: "",
      bedrooms: undefined,
      price: undefined,
      surface_area: undefined,
      location_lat: undefined,
      location_lng: undefined,
      address: "",
      city: "",
      region: "",
      postal_code: "",
    },
  });
    useEffect(() => {
        // Met à jour les villes disponibles lorsque la région change
        if (selectedRegion) {
            setAvailableCities(citiesByRegion[selectedRegion] || []);
        } else {
            setAvailableCities([]);
        }
    }, [selectedRegion]);

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

      const propertyData = {
        title: data.title,
        description: data.description,
        property_type: data.property_type,
        bedrooms: data.bedrooms,
        price: data.price,
        surface_area: data.surface_area,
        address: data.address,
        city: data.city,
        region: data.region,
        postal_code: data.postal_code,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        agency_id: agency.id,
        property_status: "DISPONIBLE" as const,
        is_available: true,
        amenities: [] as string[],
      };

      const { data: newProperty, error } = await supabase
        .from("properties")
        .insert(propertyData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'offre a été ajoutée avec succès",
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
        description: "Une erreur est survenue lors de la creation de l'offre",
      });
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
                      <Input placeholder="Titre de l'offre                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  " {...field} />
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
            </div>

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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Adresse du bien" {...field} />
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
                <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Région</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    setSelectedRegion(value);
                                }}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez une région" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.keys(citiesByRegion).map((region) => (
                                        <SelectItem key={region} value={region}>
                                            {region}
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
                    name="city"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={availableCities.length === 0}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez une ville" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableCities.map((city) => (
                                        <SelectItem key={city} value={city}>
                                            {city}
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
                    name="location_lat"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Latitude"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="location_lng"
                    render={({ field }) => (
                        <FormItem>
                                <FormLabel>Longitude</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Longitude"
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
              <Button type="submit">Créer</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

