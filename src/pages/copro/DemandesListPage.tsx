import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Upload } from "lucide-react";

// Types
interface Proprietaire {
  id: number;
  prenom: string;
  nom: string;
}

export type DemandeType =
  | "paiements_charges"
  | "declaration_depannage"
  | "entretien_menuiserie"
  | "entretien_electricite"
  | "entretien_plomberie";

interface Demande {
  id: number;
  proprietaire_id: number;
  proprietaire: Proprietaire | null;
  type_demande: DemandeType;
  description: string | null;
  fichier_joint: string | null;
  statut: "traitee" | "non_traitee";
  date_creation: string;
  date_traitement: string | null;
  agence_id: string;
  commentaire_admin?: string | null;
  fichier_reponse?: string | null;
}

const TYPE_LABELS: Record<DemandeType, string> = {
  paiements_charges: "Paiements, charges",
  declaration_depannage: "Déclaration, dépannage",
  entretien_menuiserie: "Entretien Menuiserie",
  entretien_electricite: "Entretien Électricité",
  entretien_plomberie: "Entretien Plomberie",
};

const STATUS_LABELS = {
  traitee: { label: "Traitée", color: "green" },
  non_traitee: { label: "Non traitée", color: "red" },
};

const PAGE_SIZE = 10;

const DemandesListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DemandeType>("paiements_charges");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Récupérer toutes les demandes + propriétaire
  const { data: demandes, isLoading, error, refetch } = useQuery({
    queryKey: ["demandes", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demandes")
        .select(
          `*, proprietaire:proprietaire_id(id, prenom, nom)`
        )
        .eq("agence_id", supabase.auth.user()?.user_metadata?.agency_id)
        .eq("type_demande", tab)
        .order("date_creation", { ascending: false });
      if (error) throw error;
      return data as Demande[];
    },
    enabled: !!tab,
  });

  // Filtres propriétaires
  const proprietaires = useMemo(() => {
    if (!demandes) return [];
    const uniqueProps = new Map<number, Proprietaire>();
    demandes.forEach((d) => {
      if (d.proprietaire) uniqueProps.set(d.proprietaire.id, d.proprietaire);
    });
    return Array.from(uniqueProps.values());
  }, [demandes]);

  // Filtres dynamiques
  const filteredDemandes = useMemo(() => {
    let filtered = demandes || [];
    if (search) {
      filtered = filtered.filter((d) =>
        `${d.proprietaire?.prenom || ""} ${d.proprietaire?.nom || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((d) => d.type_demande === typeFilter);
    }
    if (statutFilter !== "all") {
      filtered = filtered.filter((d) => d.statut === statutFilter);
    }
    return filtered;
  }, [demandes, search, typeFilter, statutFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredDemandes.length / PAGE_SIZE);
  const paginatedDemandes = filteredDemandes.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Action : marquer comme traitée/non traitée
  const mutationStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: number; statut: "traitee" | "non_traitee" }) => {
      const { error } = await supabase
        .from("demandes")
        .update({ statut, date_traitement: statut === "traitee" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut mis à jour");
      refetch();
    },
    onError: () => toast.error("Erreur lors de la mise à jour du statut")
  });

  // Action : ajouter commentaire et fichier de réponse
  const mutationReponse = useMutation({
    mutationFn: async ({ id, commentaire, file }: { id: number; commentaire: string; file: File | null }) => {
      let fichier_reponse_url = null;
      if (file) {
        setUploading(true);
        const { data, error } = await supabase.storage
          .from("demandes-reponses")
          .upload(`reponse_${id}_${Date.now()}_${file.name}`, file);
        setUploading(false);
        if (error) throw error;
        fichier_reponse_url = data?.path;
      }
      const { error } = await supabase
        .from("demandes")
        .update({ commentaire_admin: commentaire, fichier_reponse: fichier_reponse_url })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Réponse enregistrée");
      setDialogOpen(false);
      setCommentaire("");
      setFile(null);
      refetch();
    },
    onError: () => toast.error("Erreur lors de l'envoi de la réponse")
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des demandes</h1>
      <Tabs value={tab} onValueChange={v => { setTab(v as DemandeType); setPage(1); }}>
        <TabsList className="mb-4">
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(TYPE_LABELS).map(([key]) => (
          <TabsContent key={key} value={key}>
            {/* Filtres */}
            <div className="flex flex-wrap gap-4 mb-4">
              <Input
                placeholder="Rechercher par propriétaire..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="max-w-xs"
              />
              <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Type de demande" />
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
                  <SelectItem value="traitee">Traitée</SelectItem>
                  <SelectItem value="non_traitee">Non traitée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Table demandes */}
            <div className="w-full max-w-7xl mx-auto bg-gray-50 rounded-lg shadow-md p-6 mt-6">
              <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Liste des demandes</h1>
              <Table>
                <TableHeader className="bg-blue-100">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Propriétaire</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Fichier joint</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDemandes.map(demande => (
                    <TableRow key={demande.id}>
                      <TableCell>{new Date(demande.date_creation).toLocaleDateString()}</TableCell>
                      <TableCell>{demande.proprietaire ? `${demande.proprietaire.prenom} ${demande.proprietaire.nom}` : "-"}</TableCell>
                      <TableCell>{TYPE_LABELS[demande.type_demande]}</TableCell>
                      <TableCell>{demande.description}</TableCell>
                      <TableCell>
                        <Badge color={STATUS_LABELS[demande.statut].color}>{STATUS_LABELS[demande.statut].label}</Badge>
                      </TableCell>
                      <TableCell>
                        {demande.fichier_joint ? (
                          <a
                            href={supabase.storage.from("demandes").getPublicUrl(demande.fichier_joint).publicUrl}
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
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => mutationStatut.mutate({ id: demande.id, statut: demande.statut === "traitee" ? "non_traitee" : "traitee" })}
                            variant={demande.statut === "traitee" ? "secondary" : "default"}
                          >
                            {demande.statut === "traitee" ? "Marquer non traitée" : "Marquer traitée"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedDemande(demande); setDialogOpen(true); }}>
                            Répondre
                          </Button>
                        </div>
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
          </TabsContent>
        ))}
      </Tabs>
      {/* Modal réponse admin */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Répondre à la demande</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <label className="font-semibold">Commentaire de traitement</label>
            <Input
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              placeholder="Ajouter un commentaire..."
            />
          </div>
          <div className="mb-4">
            <label className="font-semibold">Joindre un fichier de réponse</label>
            <Input
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
              accept="image/*,application/pdf"
            />
            {file && <span className="text-xs text-gray-600">{file.name}</span>}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (selectedDemande) mutationReponse.mutate({ id: selectedDemande.id, commentaire, file });
              }}
              disabled={mutationReponse.isLoading || uploading}
            >
              {mutationReponse.isLoading || uploading ? "Envoi..." : "Envoyer la réponse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandesListPage;
