import {useEffect, useState} from "react"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {toast, useToast } from "@/hooks/use-toast";
import {useParams} from "react-router-dom";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client.ts";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import {useAgencyContext} from "@/contexts/AgencyContext.tsx";

const propertySchema = z.object({
    title: z.string().min(1, "Le titre est requis"),
    description: z.string().optional(),
    property_type: z.string().min(1, "Le type de bien est requis"),
    bedrooms: z.coerce.number().min(1, "Le nombre de pièces est requis"),
    price: z.coerce.number().min(1, "Le prix est requis"),
    surface_area: z.coerce.number().optional(),
    address: z.string().min(1, "L'adresse est requise"),
    city: z.string().optional(),
    location_lat: z.coerce.number().min(1, "La latitude est requise"),
    location_lng:  z.coerce.number().min(1, "La longitude est requise"),
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

interface ModifyPropertyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    propertyId: string
}
type PropertyFormValues = z.infer<typeof propertySchema>;

export default function ModifyPropertyDialog({open, onOpenChange, propertyId}: ModifyPropertyDialogProps) {
    const navigate = useNavigate();
    const [selectedRegion, setSelectedRegion] = useState<string>("");
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const { agency } = useAgencyContext();

    const { data: request} = useQuery({
        queryKey: ['properties', propertyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('id', propertyId)
                .single()
            if (error) throw error
            return data
        },
    })
    const form = useForm<PropertyFormValues>({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            title: "",
            description: "",
            property_type: "",
            bedrooms: 0,
            price: 0,
            surface_area: 0,
            location_lat: 0,
            location_lng: 0,
            address: "",
            city: "",
            region: "",
            postal_code: "",
        },
    });

    useEffect(() => {
        if (request) {
            form.reset(request);
            setSelectedRegion(request.region);
        }
        console.log(Form)
    }, [request, form]);

    useEffect(() => {
        if (selectedRegion) {
            setAvailableCities(citiesByRegion[selectedRegion] || []);
        } else {
            setAvailableCities([]);
        }
    }, [selectedRegion]);

    const onSubmit = async (data: PropertyFormValues) => {
        try {
            const propertyData = {
                ...data,
                agency_id: agency.id,
                property_status: "DISPONIBLE" as const,
                is_available: true,
                amenities: [] as string[],
            };

            const { error } = await supabase
                .from("properties")
                .update(propertyData)
                .eq('id', propertyId)

            if (error) throw error;

            toast({
                title: "Succès",
                description: "L'offre a été modifiée avec succès",
            });
            onOpenChange(false);
            navigate(`/${agency.slug}/properties/${propertyId}`);
        } catch (error) {
            console.error("Error while modifying property:", error);
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
                        <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Titre</FormLabel>
                                        <FormControl>
                                            <Input  {...field} />
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
                                                    <SelectValue placeholder="Sélectionnez un type" defaultValue={field.value}/>
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
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bedrooms"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de pièces</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prix (CFA)</FormLabel>
                                        <FormControl>
                                            <Input
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
                                            <Input {...field} />
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
                                            <Input {...field} />
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
    )
}