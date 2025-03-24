import React, { useState, useMemo } from 'react';
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { UserSquare, Phone, Mail, MapPin, Search, Plus, Home } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { ProprietairePropertiesDialog } from "@/components/agency/properties/ProprietairePropertiesDialog";

type Proprietaire = {
  id: number;
  prenom: string;
  nom: string;
  adresse: string | null;
  numero_telephone: string | null;
  adresse_email: string | null;
};

// Schéma de validation pour le formulaire d'ajout de propriétaire
const proprietaireSchema = z.object({
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  adresse: z.string().optional(),
  numero_telephone: z.string().optional(),
  adresse_email: z.string().email("Adresse email invalide").optional(),
});

type ProprietaireFormValues = z.infer<typeof proprietaireSchema>;

export default function ProprietairesPage() {
  const { agency } = useAgencyContext();
  const [selectedProprietaire, setSelectedProprietaire] = useState<Proprietaire | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [propertiesDialogOpen, setPropertiesDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState("");

  // Formulaire pour ajouter un propriétaire
  const form = useForm<ProprietaireFormValues>({
    resolver: zodResolver(proprietaireSchema),
    defaultValues: {
      prenom: "",
      nom: "",
      adresse: "",
      numero_telephone: "",
      adresse_email: "",
    },
  });

  // Récupération des propriétaires
  const { data: proprietaires, isLoading, error, refetch } = useQuery({
    queryKey: ['proprietaires', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      
      const { data, error } = await supabase
        .from('proprietaire')
        .select(`
          id,
          prenom,
          nom,
          adresse,
          numero_telephone,
          adresse_email
        `)
        .order('nom', { ascending: true });

      if (error) {
        console.error("Error fetching proprietaires:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!agency?.id,
  });

  // Filtrer les propriétaires en fonction du terme de recherche
  const filteredProprietaires = useMemo(() => {
    if (!proprietaires) return [];
    
    return proprietaires.filter(proprietaire => {
      const fullName = `${proprietaire.prenom} ${proprietaire.nom}`.toLowerCase();
      const email = proprietaire.adresse_email?.toLowerCase() || "";
      const phone = proprietaire.numero_telephone?.toLowerCase() || "";
      const address = proprietaire.adresse?.toLowerCase() || "";
      
      return searchTerm === "" || 
             fullName.includes(searchTerm.toLowerCase()) ||
             email.includes(searchTerm.toLowerCase()) ||
             phone.includes(searchTerm.toLowerCase()) ||
             address.includes(searchTerm.toLowerCase());
    });
  }, [proprietaires, searchTerm]);

  // Gérer le clic sur un propriétaire
  const handleProprietaireClick = (proprietaire: Proprietaire) => {
    setSelectedProprietaire(proprietaire);
    setDialogOpen(true);
  };

  // Gérer la soumission du formulaire d'ajout de propriétaire
  const onSubmit = async (data: ProprietaireFormValues) => {
    try {
      const { error } = await supabase
        .from('proprietaire')
        .insert([
          {
            prenom: data.prenom,
            nom: data.nom,
            adresse: data.adresse || null,
            numero_telephone: data.numero_telephone || null,
            adresse_email: data.adresse_email || null,
          },
        ]);

      if (error) throw error;

      toast.success("Propriétaire ajouté avec succès");
      form.reset();
      setAddDialogOpen(false);
      refetch(); // Rafraîchir la liste des propriétaires
    } catch (error) {
      console.error("Error adding proprietaire:", error);
      toast.error("Erreur lors de l'ajout du propriétaire");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AgencySidebar />
        <div className="flex-1 p-4 md:p-8">
          <div className="h-full flex flex-col">
            <div className="flex-1 space-y-4 p-4 md:p-8">
              <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Propriétaires</h2>
                <Button 
                  onClick={() => setAddDialogOpen(true)}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: agency?.secondary_color || '' }}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un propriétaire
                </Button>
              </div>

              {/* Contenu principal avec largeur maximale et centrage */}
              <div className="mx-auto w-full max-w-7xl space-y-6">
                {/* Filtre de recherche */}
                <div className="grid gap-4 md:gap-6">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un propriétaire..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <p>Chargement des propriétaires...</p>
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-destructive p-4 md:p-8 text-center">
                    <h3 className="text-lg font-medium text-destructive">Erreur de chargement</h3>
                    <p className="text-muted-foreground">
                      Impossible de charger les propriétaires. Veuillez réessayer.
                    </p>
                  </div>
                ) : filteredProprietaires.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredProprietaires.map((proprietaire) => (
                      <Card 
                        key={proprietaire.id} 
                        className="cursor-pointer hover:shadow-md transition-all duration-300 border-l-4 border-l-primary"
                        onClick={() => handleProprietaireClick(proprietaire)}
                      >
                        <CardHeader className="pb-2 bg-muted/30">
                          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                            <UserSquare className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="truncate">
                              {proprietaire.prenom} {proprietaire.nom}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-2 text-sm">
                            {proprietaire.numero_telephone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{proprietaire.numero_telephone}</span>
                              </div>
                            )}
                            {proprietaire.adresse_email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{proprietaire.adresse_email}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            className="w-full hover:bg-primary hover:text-white transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProprietaireClick(proprietaire);
                            }}
                          >
                            Voir détails
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 md:p-8 text-center">
                    <h3 className="text-lg font-medium">Aucun propriétaire trouvé</h3>
                    <p className="text-muted-foreground">
                      Il n'y a pas de propriétaires enregistrés pour le moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Dialog pour afficher les détails d'un propriétaire */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className={cn(
              "max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6",
              isMobile && "w-full"
            )}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <UserSquare className="h-5 w-5 text-primary" /> 
                  Informations détaillées du propriétaire
                </DialogTitle>
              </DialogHeader>
              {selectedProprietaire && (
                <div className="space-y-6 mt-2">
                  <div className="space-y-4 bg-muted/20 rounded-lg p-4">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <UserSquare className="h-5 w-5 text-primary" />
                      Information personnelle
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                        <UserSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Nom complet</p>
                          <p className="font-medium truncate">{selectedProprietaire.prenom} {selectedProprietaire.nom}</p>
                        </div>
                      </div>
                      {selectedProprietaire.numero_telephone && (
                        <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Téléphone</p>
                            <p className="font-medium truncate">{selectedProprietaire.numero_telephone}</p>
                          </div>
                        </div>
                      )}
                      {selectedProprietaire.adresse_email && (
                        <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                          <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium truncate">{selectedProprietaire.adresse_email}</p>
                          </div>
                        </div>
                      )}
                      {selectedProprietaire.adresse && (
                        <div className="flex items-center gap-2 bg-background p-3 rounded-md border">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Adresse</p>
                            <p className="font-medium truncate">{selectedProprietaire.adresse}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => setPropertiesDialogOpen(true)}
                      className="flex items-center gap-2"
                      style={{ backgroundColor: agency?.secondary_color || '' }}
                    >
                      <Home className="h-4 w-4" />
                      Voir les biens de ce propriétaire
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog pour afficher les biens d'un propriétaire */}
          {selectedProprietaire && (
            <ProprietairePropertiesDialog
              open={propertiesDialogOpen}
              onOpenChange={setPropertiesDialogOpen}
              proprietaireId={selectedProprietaire.id}
              proprietaireName={`${selectedProprietaire.prenom} ${selectedProprietaire.nom}`}
            />
          )}

          {/* Dialog pour ajouter un propriétaire */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent className={cn(
              "max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6",
              isMobile && "w-full"
            )}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Plus className="h-5 w-5 text-primary" /> 
                  Ajouter un nouveau propriétaire
                </DialogTitle>
                <DialogDescription>
                  Remplissez les informations du propriétaire ci-dessous.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="prenom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input placeholder="Prénom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numero_telephone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="Numéro de téléphone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="adresse_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse email</FormLabel>
                          <FormControl>
                            <Input placeholder="Adresse email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="adresse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Adresse complète" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit">Ajouter</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SidebarProvider>
  );
}
