import React, { useMemo, useState } from "react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Edit, Eye, Plus, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Types
interface Lot {
  id: number;
  numero: number;
  nom: string;
  created_at: string;
  proprietaire?: {
    id: number;
    prenom: string;
    nom: string;
  };
  biens_count?: number;
}

interface Proprietaire {
  id: number;
  prenom: string;
  nom: string;
}

interface Bien {
  id: string;
  title: string;
  reference_number: string;
  property_type: string;
  surface_area: number;
  lot?: number | null;
  proprio?: number | null;
}

// Schéma de validation pour le formulaire d'ajout/modification de lot
const lotSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  biens_ids: z.array(z.string()).optional(),
});

type LotFormValues = z.infer<typeof lotSchema>;

const PAGE_SIZE = 10;

export default function LotsListPage() {
  const { agency } = useAgencyContext();
  const [search, setSearch] = useState("");
  const [proprietaireFilter, setProprietaireFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentLot, setCurrentLot] = useState<Lot | null>(null);
  const [biensDialogOpen, setBiensDialogOpen] = useState(false);
  const [selectedLotBiens, setSelectedLotBiens] = useState<Bien[]>([]);
  const [availableBiens, setAvailableBiens] = useState<Bien[]>([]);
  const [selectedBiens, setSelectedBiens] = useState<string[]>([]);

  // Formulaire pour ajouter/modifier un lot
  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      nom: "",
      biens_ids: [],
    },
  });

  // Récupérer tous les lots avec le nombre de biens associés
  const { data: lots, isLoading, refetch } = useQuery({
    queryKey: ["lots", agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      
      // Requête pour obtenir tous les lots
      const { data: lotsData, error: lotsError } = await supabase
        .from("lot")
        .select("*")
        .order("numero", { ascending: true });
      
      if (lotsError) {
        console.error("Erreur lors de la récupération des lots:", lotsError);
        throw lotsError;
      }
      
      // Pour chaque lot, récupérer le propriétaire et le nombre de biens
      const lotsWithDetails = await Promise.all(lotsData.map(async (lot) => {
        // Récupérer les propriétés (biens) liées à ce lot
        const { data: biens, error: biensError } = await supabase
          .from("properties")
          .select("id")
          .eq("lot", lot.id)
          .eq("agency_id", agency.id);
        
        if (biensError) {
          console.error(`Erreur lors de la récupération des biens pour le lot ${lot.id}:`, biensError);
        }
        
        // Trouver le propriétaire qui a le plus de biens dans ce lot
        const { data: proprietaires, error: proprioError } = await supabase
          .from("properties")
          .select("proprio, proprietaire:proprietaire(id, prenom, nom)")
          .eq("lot", lot.id)
          .eq("agency_id", agency.id)
          .not("proprio", "is", null);
        
        if (proprioError) {
          console.error(`Erreur lors de la récupération des propriétaires pour le lot ${lot.id}:`, proprioError);
        }
        
        // Trouver le propriétaire le plus fréquent
        let proprietaire = null;
        if (proprietaires && proprietaires.length > 0) {
          const proprioCount = proprietaires.reduce((acc, curr) => {
            if (curr.proprio) {
              acc[curr.proprio] = (acc[curr.proprio] || 0) + 1;
            }
            return acc;
          }, {} as Record<number, number>);
          
          const maxProprio = Object.entries(proprioCount).reduce(
            (max, [id, count]) => count > max.count ? { id: Number(id), count } : max,
            { id: 0, count: 0 }
          );
          
          proprietaire = proprietaires.find(p => p.proprio === maxProprio.id)?.proprietaire || null;
        }
        
        return {
          ...lot,
          proprietaire,
          biens_count: biens?.length || 0
        };
      }));
      
      return lotsWithDetails;
    },
    enabled: !!agency?.id,
  });

  // Récupérer les biens sans lot pour pouvoir les associer
  const { data: biensWithoutLot, refetch: refetchBiensWithoutLot } = useQuery({
    queryKey: ["biens_without_lot", agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, reference_number, property_type, surface_area, lot, proprio")
        .eq("agency_id", agency.id)
        .is("lot", null);
      
      if (error) {
        console.error("Erreur lors de la récupération des biens sans lot:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!agency?.id,
  });

  // Récupérer tous les propriétaires pour le filtre et le formulaire
  const { data: proprietaires } = useQuery({
    queryKey: ["proprietaires", agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      
      const { data, error } = await supabase
        .from("proprietaire")
        .select("id, prenom, nom")
        .eq("agenceID", agency.id)
        .order("nom", { ascending: true });
      
      if (error) {
        console.error("Erreur lors de la récupération des propriétaires:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!agency?.id,
  });

  // Filtrer les lots
  const filteredLots = useMemo(() => {
    if (!lots) return [];
    
    let filtered = lots;
    
    // Filtrer par numéro de lot (recherche)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(lot => 
        lot.numero.toString().includes(searchLower) || 
        lot.nom.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtrer par propriétaire
    if (proprietaireFilter !== "all") {
      const proprioId = parseInt(proprietaireFilter);
      filtered = filtered.filter(lot => 
        lot.proprietaire && lot.proprietaire.id === proprioId
      );
    }
    
    return filtered;
  }, [lots, search, proprietaireFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLots.length / PAGE_SIZE);
  const paginatedLots = filteredLots.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Récupérer les biens d'un lot spécifique avec leurs propriétaires
  const fetchLotBiens = async (lotId: number) => {
    if (!agency?.id) return;
    
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, reference_number, property_type, surface_area, proprio, proprietaire:proprietaire(id, prenom, nom)")
      .eq("lot", lotId)
      .eq("agency_id", agency.id);
    
    if (error) {
      console.error(`Erreur lors de la récupération des biens pour le lot ${lotId}:`, error);
      toast.error("Erreur lors de la récupération des biens");
      return;
    }
    
    setSelectedLotBiens(data || []);
    setBiensDialogOpen(true);
  };

  // Ouvrir le dialogue d'édition
  const openEditDialog = async (lot: Lot) => {
    setCurrentLot(lot);
    
    // Récupérer tous les biens de l'agence
    const { data: allBiens, error: biensError } = await supabase
      .from("properties")
      .select("id, title, reference_number, property_type, surface_area, lot, proprio")
      .eq("agency_id", agency?.id);
    
    if (biensError) {
      console.error("Erreur lors de la récupération des biens:", biensError);
      toast.error("Erreur lors de la récupération des biens");
      return;
    }
    
    // Filtrer les biens qui sont soit associés à ce lot, soit sans lot
    const availableBiens = allBiens?.filter(bien => bien.lot === lot.id || bien.lot === null) || [];
    setAvailableBiens(availableBiens);
    
    // Présélectionner les biens déjà associés à ce lot
    const bienIds = availableBiens.filter(bien => bien.lot === lot.id).map(bien => bien.id);
    setSelectedBiens(bienIds);
    
    form.reset({
      nom: lot.nom,
      biens_ids: bienIds,
    });
    
    setEditDialogOpen(true);
  };

  // Ouvrir le dialogue d'ajout
  const openAddDialog = async () => {
    setCurrentLot(null);
    setSelectedBiens([]);
    
    // Récupérer les biens sans lot pour l'ajout
    const { data: biensSansLot, error: biensError } = await supabase
      .from("properties")
      .select("id, title, reference_number, property_type, surface_area, lot, proprio")
      .eq("agency_id", agency?.id)
      .is("lot", null);
    
    if (biensError) {
      console.error("Erreur lors de la récupération des biens sans lot:", biensError);
      toast.error("Erreur lors de la récupération des biens sans lot");
      return;
    }
    
    setAvailableBiens(biensSansLot || []);
    
    form.reset({
      nom: "",
      biens_ids: [],
    });
    
    setAddDialogOpen(true);
  };

  // Soumettre le formulaire d'ajout/modification
  const onSubmit = async (data: LotFormValues) => {
    try {
      let lotId: number;
      
      if (currentLot) {
        // Modification
        const { error } = await supabase
          .from("lot")
          .update({
            nom: data.nom,
          })
          .eq("id", currentLot.id);
        
        if (error) throw error;
        
        lotId = currentLot.id;
        toast.success("Lot modifié avec succès");
      } else {
        // Ajout - Générer automatiquement le numéro de lot
        // Récupérer le dernier numéro de lot
        const { data: lastLot } = await supabase
          .from("lot")
          .select("numero")
          .order("numero", { ascending: false })
          .limit(1);
        
        const nextNumero = lastLot && lastLot.length > 0 ? lastLot[0].numero + 1 : 1;
        
        // Créer le nouveau lot
        const { data: newLot, error } = await supabase
          .from("lot")
          .insert({
            numero: nextNumero,
            nom: data.nom,
          })
          .select();
        
        if (error) throw error;
        if (!newLot || newLot.length === 0) throw new Error("Erreur lors de la création du lot");
        
        lotId = newLot[0].id;
        toast.success("Lot ajouté avec succès");
      }
      
      // Mettre à jour les biens associés au lot
      if (data.biens_ids && data.biens_ids.length > 0) {
        // Associer les biens sélectionnés au lot
        const { error: updateError } = await supabase
          .from("properties")
          .update({ lot: lotId })
          .in("id", data.biens_ids);
        
        if (updateError) {
          console.error("Erreur lors de l'association des biens au lot:", updateError);
          toast.error("Erreur lors de l'association des biens au lot");
        } else {
          toast.success(`${data.biens_ids.length} bien(s) associé(s) au lot`);
        }
      }
      
      // Fermer le dialogue et rafraîchir les données
      setAddDialogOpen(false);
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      const err = error as Error;
      console.error("Erreur lors de l'enregistrement du lot:", err);
      toast.error(`Erreur: ${err.message || "Une erreur est survenue"}`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Gestion des Lots</h1>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un lot
        </Button>
      </div>
      
      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-4">
        <Input
          placeholder="Rechercher par numéro ou nom..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Select 
          value={proprietaireFilter} 
          onValueChange={v => { setProprietaireFilter(v); setPage(1); }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrer par propriétaire" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les propriétaires</SelectItem>
            {proprietaires?.map(p => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.prenom} {p.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Tableau des lots */}
      <div className="w-full max-w-7xl mx-auto bg-gray-50 rounded-lg shadow-md p-6 mt-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Gestion des lots de copropriété</h1>
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead className="text-blue-900">Numéro</TableHead>
              <TableHead className="text-blue-900">Nom du lot</TableHead>
              <TableHead className="text-blue-900">Nombre de biens</TableHead>
              <TableHead className="text-blue-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">Chargement...</TableCell>
              </TableRow>
            ) : paginatedLots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">Aucun lot trouvé</TableCell>
              </TableRow>
            ) : (
              paginatedLots.map(lot => (
                <TableRow key={lot.id}>
                  <TableCell>{lot.numero}</TableCell>
                  <TableCell>{lot.nom}</TableCell>
                  <TableCell>{lot.biens_count || 0}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchLotBiens(lot.id)}
                        title="Voir les biens"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(lot)}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm('Voulez-vous vraiment supprimer ce lot ? Cette action est irréversible.')) {
                            const { error } = await supabase.from('lot').delete().eq('id', lot.id);
                            if (!error) {
                              toast.success('Lot supprimé avec succès');
                              refetch();
                            } else {
                              toast.error("Erreur lors de la suppression du lot : " + error.message);
                            }
                          }
                        }}
                        title="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span>
          Page {page} / {totalPages || 1}
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Précédent
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === totalPages || totalPages === 0} 
            onClick={() => setPage(p => p + 1)}
          >
            Suivant
          </Button>
        </div>
      </div>
      
      {/* Dialogue d'ajout de lot */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau lot</DialogTitle>
            <DialogDescription>
              Remplissez les informations du lot ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="mb-4">
                <FormLabel>Numéro du lot</FormLabel>
                <div className="p-2 border rounded bg-gray-50">
                  <span className="text-gray-500">Généré automatiquement</span>
                </div>
              </div>
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du lot</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Liste des biens disponibles */}
              <div className="mt-4">
                <FormLabel>Biens à associer à ce lot</FormLabel>
                <div className="border rounded-md p-3 mt-2 max-h-[200px] overflow-y-auto">
                  {availableBiens && availableBiens.length > 0 ? (
                    availableBiens.map(bien => (
                      <div key={bien.id} className="flex items-center space-x-2 py-2 border-b last:border-b-0">
                        <Checkbox 
                          id={`bien-${bien.id}`} 
                          checked={selectedBiens.includes(bien.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBiens(prev => [...prev, bien.id]);
                              form.setValue('biens_ids', [...selectedBiens, bien.id]);
                            } else {
                              setSelectedBiens(prev => prev.filter(id => id !== bien.id));
                              form.setValue('biens_ids', selectedBiens.filter(id => id !== bien.id));
                            }
                          }}
                        />
                        <label htmlFor={`bien-${bien.id}`} className="text-sm flex-1 cursor-pointer">
                          {bien.title} {bien.reference_number ? `(${bien.reference_number})` : ''}
                          {bien.lot ? <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">Déjà dans ce lot</span> : ''}
                        </label>
                        <span className="text-xs text-gray-500">{bien.property_type}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-gray-500">Aucun bien disponible</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Ajouter</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de modification de lot */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le lot</DialogTitle>
            <DialogDescription>
              Modifiez les informations du lot ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {currentLot && (
                <div className="mb-4">
                  <FormLabel>Numéro du lot</FormLabel>
                  <div className="p-2 border rounded bg-gray-50">
                    {currentLot.numero} <span className="text-gray-500 text-xs">(généré automatiquement)</span>
                  </div>
                </div>
              )}
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du lot</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Liste des biens disponibles pour modification */}
              <div className="mt-4">
                <FormLabel>Biens à associer à ce lot</FormLabel>
                <div className="border rounded-md p-3 mt-2 max-h-[200px] overflow-y-auto">
                  {availableBiens && availableBiens.length > 0 ? (
                    availableBiens.map(bien => (
                      <div key={bien.id} className="flex items-center space-x-2 py-2 border-b last:border-b-0">
                        <Checkbox 
                          id={`bien-edit-${bien.id}`} 
                          checked={selectedBiens.includes(bien.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBiens(prev => [...prev, bien.id]);
                              form.setValue('biens_ids', [...selectedBiens, bien.id]);
                            } else {
                              setSelectedBiens(prev => prev.filter(id => id !== bien.id));
                              form.setValue('biens_ids', selectedBiens.filter(id => id !== bien.id));
                            }
                          }}
                        />
                        <label htmlFor={`bien-edit-${bien.id}`} className="text-sm flex-1 cursor-pointer">
                          {bien.title} {bien.reference_number ? `(${bien.reference_number})` : ''}
                          {bien.lot ? <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">Déjà dans ce lot</span> : ''}
                        </label>
                        <span className="text-xs text-gray-500">{bien.property_type}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-gray-500">Aucun bien disponible</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue pour afficher les biens d'un lot */}
      <Dialog open={biensDialogOpen} onOpenChange={setBiensDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Biens du lot</DialogTitle>
            <DialogDescription>
              Liste des biens associés à ce lot.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            {selectedLotBiens.length === 0 ? (
              <p className="text-center py-4 text-gray-500">Aucun bien associé à ce lot</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Surface (m²)</TableHead>
                    <TableHead>Propriétaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedLotBiens.map(bien => (
                    <TableRow key={bien.id}>
                      <TableCell>{bien.reference_number || "-"}</TableCell>
                      <TableCell>{bien.title}</TableCell>
                      <TableCell>{bien.property_type}</TableCell>
                      <TableCell>{bien.surface_area || "-"}</TableCell>
                      <TableCell>
                        {bien.proprietaire 
                          ? `${bien.proprietaire.prenom} ${bien.proprietaire.nom}` 
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBiensDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
