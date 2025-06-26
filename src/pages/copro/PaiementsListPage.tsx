import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAgencyContext } from "@/contexts/AgencyContext";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Types
interface Proprietaire {
  id: number;
  prenom: string;
  nom: string;
}

interface AppelDeFond {
  id: number;
  titre: string;
}

export type PaiementType = "appel_de_fond" | "travaux_entretien";

interface Paiement {
  id: number;
  proprietaire_id: number;
  proprietaire: Proprietaire | null;
  type_paiement: PaiementType;
  appel_de_fond_id: number | null;
  appel_de_fond?: AppelDeFond | null;
  montant: number;
  description: string | null;
  date_ajout: string;
  statut: "paye" | "non_paye";
  fichier_facture_recu: string | null;
  agence_id: string;
}

const TYPE_LABELS: Record<PaiementType, string> = {
  appel_de_fond: "Appel de fond",
  travaux_entretien: "Travaux d'entretien",
};

const STATUS_LABELS = {
  paye: { label: "Payé", color: "green" },
  non_paye: { label: "Non payé", color: "red" },
};

const PAGE_SIZE = 10;

const PaiementsListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { agency } = useAgencyContext(); // Récupérer l'agence depuis le contexte
  const [tab, setTab] = useState<PaiementType>("appel_de_fond");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    type_paiement: "appel_de_fond" as PaiementType,
    proprietaire_bien_id: "", // Identifiant composite "proprietaire_id-bien_concerne"
    appel_de_fond_id: "",
    montant: "",
    description: "",
    file: null as File | null,
  });
  
  // Extraire proprietaire_id et bien_concerne de l'identifiant composite
  const getProprietaireEtBien = () => {
    if (!form.proprietaire_bien_id) return { proprietaire_id: "", bien_concerne: "" };
    
    // On extrait l'ID du propriétaire (premier nombre) et le reste est l'UUID du bien
    const indexFirstDash = form.proprietaire_bien_id.indexOf('-');
    const proprietaire_id = form.proprietaire_bien_id.substring(0, indexFirstDash);
    const bien_concerne = form.proprietaire_bien_id.substring(indexFirstDash + 1);
    
    return { proprietaire_id, bien_concerne };
  };
  const [uploading, setUploading] = useState(false);

  // Récupérer paiements avec jointure propriétaire et appel de fond
  const { data: paiements, isLoading, error, refetch } = useQuery({
    queryKey: ["paiements", tab, agency?.id],
    queryFn: async () => {
      if (!agency?.id) {
        console.error("Agency ID not available");
        return [];
      }

      const { data, error } = await supabase
        .from("paiements")
        .select(
          `*, proprietaire:proprietaire_id(id, prenom, nom), appel_de_fond:appel_de_fond_id(id, titre)`
        )
        .eq("agence_id", agency.id)
        .eq("type_paiement", tab)
        .order("date_ajout", { ascending: false });
        
      if (error) {
        console.error("Erreur lors de la récupération des paiements:", error);
        throw error;
      }
      return data as Paiement[];
    },
    enabled: !!agency?.id && !!tab,
  });

  // Récupérer appels de fond
  const { data: appelsDeFond, isLoading: loadingAppels } = useQuery({
    queryKey: ["appels_de_fond", agency?.id],
    queryFn: async () => {
      if (!agency?.id) {
        console.error("Agency ID not available");
        return [];
      }

      // Récupérer tous les appels de fond en cours pour cette agence
      const { data, error } = await supabase
        .from("appels_de_fond")
        .select("id, titre")
        .eq("agence_id", agency.id)
        .eq("statut", "en_cours")  // Uniquement les appels de fond en cours
        .order("date_creation", { ascending: false });
      
      console.log("Appels de fond récupérés:", data);
      
      if (error) {
        console.error("Erreur lors de la récupération des appels de fond:", error);
        throw error;
      }
      return data as AppelDeFond[];
    },
    enabled: !!agency?.id,
  });

  // Récupérer propriétaires
  const { data: proprietaires } = useQuery({
    queryKey: ["proprietaires", agency?.id],
    queryFn: async () => {
      if (!agency?.id) {
        console.error("Agency ID not available");
        return [];
      }

      const { data, error } = await supabase
        .from("proprietaire")
        .select("id, prenom, nom")
        .eq("agenceID", agency.id)
        .order("nom");
      
      if (error) {
        console.error("Erreur lors de la récupération des propriétaires:", error);
        throw error;
      }
      return data as Proprietaire[];
    },
    enabled: !!agency?.id,
  });

  // Récupérer dynamiquement les propriétaires concernés par un appel de fond (avec bien)
  const { data: afProprietaires, isLoading: loadingAfProps } = useQuery({
    queryKey: ["af_proprietaires", form.appel_de_fond_id, agency?.id],
    queryFn: async () => {
      if (!form.appel_de_fond_id || !agency?.id) return [];
      
      const { data, error } = await supabase
        .from("appels_de_fond_proprietaires")
        .select(`proprietaire_id, bien_concerne, montant_du, montant_restant, proprietaire:proprietaire_id(id, prenom, nom), bien:bien_concerne(id, reference_number, title)`)
        .eq("appel_de_fond_id", form.appel_de_fond_id)
        .eq("agence_id", agency.id);
      
      console.log("Propriétaires pour l'appel de fond", form.appel_de_fond_id, ":", data);
      
      if (error) {
        console.error("Erreur lors de la récupération des propriétaires pour l'appel de fond:", error);
        throw error;
      }
      // On retourne [{proprietaire_id, proprietaire: {id, prenom, nom}, bien: {id, reference_number, titre}}]
      return data || [];
    },
    enabled: form.type_paiement === "appel_de_fond" && !!form.appel_de_fond_id && !!agency?.id
  });


  // Filtres dynamiques
  const filteredPaiements = useMemo(() => {
    let filtered = paiements || [];
    if (search) {
      filtered = filtered.filter((p) =>
        `${p.proprietaire?.prenom || ""} ${p.proprietaire?.nom || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((p) => p.type_paiement === typeFilter);
    }
    if (statutFilter !== "all") {
      filtered = filtered.filter((p) => p.statut === statutFilter);
    }
    return filtered;
  }, [paiements, search, typeFilter, statutFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPaiements.length / PAGE_SIZE);
  const paginatedPaiements = filteredPaiements.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Action : modifier statut
  const mutationStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: number; statut: "paye" | "non_paye" }) => {
      if (!agency?.id) {
        throw new Error("Agency ID not available");
      }

      const { error } = await supabase
        .from("paiements")
        .update({ statut })
        .eq("id", id)
        .eq("agence_id", agency.id);
      if (error) throw error;
      return { id, statut };
    },
    onSuccess: () => {
      toast.success("Statut mis à jour");
      refetch();
    },
    onError: () => toast.error("Erreur lors de la mise à jour du statut")
  });

  // Action : ajout paiement
  const mutationAjout = useMutation({
    mutationFn: async (values: typeof form) => {
      if (!agency?.id) {
        throw new Error("Agency ID not available");
      }

      // Upload fichier si présent
      let fichier_facture_recu = null;
      if (values.file) {
        setUploading(true);
        const fileExt = values.file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        // Utiliser le dossier "paiements" dans le bucket "copro-doc"
        const filePath = `paiements/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("copro-doc")
          .upload(filePath, values.file);

        if (uploadError) {
          setUploading(false);
          throw uploadError;
        }

        fichier_facture_recu = filePath;
        setUploading(false);
      }

      // Insérer paiement
      let proprietaire_id = "";
      if (values.type_paiement === "appel_de_fond" && values.proprietaire_bien_id) {
        const indexFirstDash = values.proprietaire_bien_id.indexOf('-');
        proprietaire_id = values.proprietaire_bien_id.substring(0, indexFirstDash);
      } else {
        proprietaire_id = values.proprietaire_bien_id;
      }
      
      const { error } = await supabase.from("paiements").insert({
        proprietaire_id: Number(proprietaire_id),
        type_paiement: values.type_paiement,
        appel_de_fond_id: values.type_paiement === "appel_de_fond" ? Number(values.appel_de_fond_id) : null,
        montant: Number(values.montant),
        description: values.description || null,
        fichier_facture_recu,
        statut: "paye", // Mettre directement le statut à "paye" dans la table paiements
        agence_id: agency.id,
      });
      if (error) throw error;
      
      // Si c'est un paiement pour un appel de fond, mettre à jour le montant_restant
      if (values.type_paiement === "appel_de_fond" && values.appel_de_fond_id && values.proprietaire_bien_id) {
        // Extraire proprietaire_id et bien_concerne
        const indexFirstDash = values.proprietaire_bien_id.indexOf('-');
        const proprietaire_id = values.proprietaire_bien_id.substring(0, indexFirstDash);
        const bien_concerne = values.proprietaire_bien_id.substring(indexFirstDash + 1);
        
        // Récupérer l'entrée actuelle pour obtenir le montant_restant
        const { data: currentData, error: fetchError } = await supabase
          .from("appels_de_fond_proprietaires")
          .select("id, montant_restant")
          .eq("appel_de_fond_id", Number(values.appel_de_fond_id))
          .eq("proprietaire_id", Number(proprietaire_id))
          .eq("bien_concerne", bien_concerne)
          .eq("agence_id", agency.id)
          .single();
          
        if (fetchError) throw fetchError;
        
        if (currentData) {
          // Calculer le nouveau montant restant (ne peut pas être négatif)
          const nouveauMontantRestant = Math.max(0, Number(currentData.montant_restant || 0) - Number(values.montant));
          
          // Préparer les données à mettre à jour
          const updateData: any = { 
            montant_restant: nouveauMontantRestant
          };
          
          // Mettre à jour le statut et la date de paiement uniquement si le montant restant est 0
          if (nouveauMontantRestant === 0) {
            updateData.statut_paiement = "paye";
            updateData.date_paiement = new Date().toISOString();
          }
          
          // Mettre à jour l'entrée dans la table appels_de_fond_proprietaires
          const { error: updateError } = await supabase
            .from("appels_de_fond_proprietaires")
            .update(updateData)
            .eq("id", currentData.id);
            
          if (updateError) throw updateError;
          
          // Vérifier si tous les montants restants sont à 0 pour cet appel de fond
          const { data: allEntries, error: checkError } = await supabase
            .from("appels_de_fond_proprietaires")
            .select("montant_restant")
            .eq("appel_de_fond_id", Number(values.appel_de_fond_id))
            .eq("agence_id", agency.id);
          
          if (checkError) throw checkError;
          
          // Vérifier si tous les montants restants sont à 0 ou null
          const allPaid = allEntries.every(entry => Number(entry.montant_restant || 0) === 0);
          
          // Si tous les montants sont à 0, mettre à jour le statut de l'appel de fond à "termine"
          if (allPaid) {
            const { error: updateAppelError } = await supabase
              .from("appels_de_fond")
              .update({ statut: "termine" })
              .eq("id", Number(values.appel_de_fond_id))
              .eq("agence_id", agency.id);
            
            if (updateAppelError) throw updateAppelError;
          }
        }
      }
    },
    onSuccess: () => {
      toast.success("Paiement ajouté");
      setAddOpen(false);
      setForm({
        type_paiement: "appel_de_fond",
        proprietaire_bien_id: "",
        appel_de_fond_id: "",
        montant: "",
        description: "",
        file: null,
      });
      refetch();
    },
    onError: () => toast.error("Erreur lors de l'ajout du paiement")
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des paiements</h1>
      <div className="flex mb-4 justify-between">
        <Tabs value={tab} onValueChange={v => { setTab(v as PaiementType); setPage(1); }}>
          <TabsList>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={() => setAddOpen(true)}>Ajout Paiement</Button>
      </div>
      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-4">
        <Input
          placeholder="Rechercher par propriétaire..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[210px]">
            <SelectValue placeholder="Type de paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, l]) => (
              <SelectItem key={k} value={k}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statutFilter} onValueChange={v => { setStatutFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="paye">Payé</SelectItem>
            <SelectItem value="non_paye">Non payé</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Table paiements */}
      <div className="w-full max-w-7xl mx-auto bg-gray-50 rounded-lg shadow-md p-6 mt-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Liste des paiements</h1>
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Propriétaire</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Fichier</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPaiements.map(paiement => (
              <TableRow key={paiement.id}>
                <TableCell>{new Date(paiement.date_ajout).toLocaleDateString()}</TableCell>
                <TableCell>{paiement.proprietaire ? `${paiement.proprietaire.prenom} ${paiement.proprietaire.nom}` : "-"}</TableCell>
                <TableCell>{TYPE_LABELS[paiement.type_paiement]}{paiement.type_paiement === "appel_de_fond" && paiement.appel_de_fond ? ` - ${paiement.appel_de_fond.titre}` : ""}</TableCell>
                <TableCell>{paiement.description}</TableCell>
                <TableCell>{Number(paiement.montant).toLocaleString()} FCFA</TableCell>
                <TableCell>
                  <Badge color={STATUS_LABELS[paiement.statut].color}>{STATUS_LABELS[paiement.statut].label}</Badge>
                </TableCell>
                <TableCell>
                  {paiement.fichier_facture_recu ? (
                    <a
                      href={supabase.storage.from("paiements-fichiers").getPublicUrl(paiement.fichier_facture_recu).publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Télécharger
                    </a>
                  ) : (
                    <span className="text-gray-400">Aucun</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => mutationStatut.mutate({ id: paiement.id, statut: paiement.statut === "paye" ? "non_paye" : "paye" })}
                    variant={paiement.statut === "paye" ? "secondary" : "default"}
                  >
                    {paiement.statut === "paye" ? "Marquer non payé" : "Marquer payé"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination */}
        <div className="flex justify-between items-center py-4">
          <span>
            Page {page} / {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Précédent
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      </div>
      {/* Modal ajout paiement */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent aria-describedby="paiement-form-description">
          <DialogHeader>
            <DialogTitle>Ajout d'un paiement</DialogTitle>
            <p id="paiement-form-description" className="text-sm text-muted-foreground">
              Remplissez ce formulaire pour ajouter un nouveau paiement.
            </p>
          </DialogHeader>
          <div className="mb-4">
            <label className="font-semibold">Type de paiement</label>
            <Select value={form.type_paiement} onValueChange={v => setForm(f => ({ ...f, type_paiement: v as PaiementType, appel_de_fond_id: "", proprietaire_bien_id: "" }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Appel de fond d'abord si type = appel_de_fond */}
          {form.type_paiement === "appel_de_fond" && (
            <div className="mb-4">
              <label className="font-semibold">Appel de fond</label>
              <Select value={form.appel_de_fond_id} onValueChange={v => {
                setForm(f => ({ ...f, appel_de_fond_id: v, proprietaire_id: "" }));
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {appelsDeFond?.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.titre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Propriétaire : dépend du type */}
          <div className="mb-4">
            <label className="font-semibold">Propriétaire</label>
            {form.type_paiement === "appel_de_fond" && form.appel_de_fond_id ? (
              <Select 
                value={form.proprietaire_bien_id}
                onValueChange={v => {
                  // Rechercher l'entrée exacte dans la liste des propriétaires de l'appel de fond
                  const selectedProp = afProprietaires?.find(
                    p => `${p.proprietaire_id}-${p.bien_concerne || 'no-bien'}` === v
                  );
                  
                  // Pré-remplir le montant avec le montant restant si disponible
                  setForm(f => ({ 
                    ...f, 
                    proprietaire_bien_id: v,
                    montant: selectedProp?.montant_restant ? String(selectedProp.montant_restant) : f.montant
                  }));
                }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingAfProps ? "Chargement..." : "Sélectionner..."} />
                </SelectTrigger>
                <SelectContent>
                  {afProprietaires && afProprietaires.length > 0 ? (
                    afProprietaires.map((item: any) => (
                      <SelectItem 
                        key={`${item.proprietaire_id}-${item.bien_concerne || 'no-bien'}`} 
                        value={`${item.proprietaire_id}-${item.bien_concerne || 'no-bien'}`}
                      >
                        {item.proprietaire?.prenom} {item.proprietaire?.nom} {item.bien?.reference_number || item.bien?.title ? `(${item.bien?.title || item.bien?.reference_number})` : ""}
                        {item.montant_restant ? ` - Reste: ${Number(item.montant_restant).toLocaleString()} FCFA` : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no_owner" disabled>Aucun propriétaire pour cet appel de fond</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Select value={form.proprietaire_id} onValueChange={v => setForm(f => ({ ...f, proprietaire_id: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {proprietaires?.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.prenom} {p.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="mb-4">
            <label className="font-semibold">Montant</label>
            <Input
              type="number"
              value={form.montant}
              onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
              placeholder="Montant en FCFA"
            />
          </div>
          <div className="mb-4">
            <label className="font-semibold">Description</label>
            <Input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description (optionnelle)"
            />
          </div>
          <div className="mb-4">
            <label className="font-semibold">Fichier (facture/reçu)</label>
            <Input
              type="file"
              onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
              accept="image/*,application/pdf"
            />
            {form.file && <span className="text-xs text-gray-600">{form.file.name}</span>}
          </div>
          <DialogFooter>
            <Button
              onClick={() => mutationAjout.mutate(form)}
              disabled={mutationAjout.isLoading || uploading}
            >
              {mutationAjout.isLoading || uploading ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaiementsListPage;
