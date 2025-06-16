import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

export default function AppelDeFondDetailPage() {
  const { id } = useParams();
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [relanceLoading, setRelanceLoading] = useState<number | null>(null);

  // Récupération appel de fond
  const { data: appel, isLoading: loadingAppel } = useQuery({
    queryKey: ["appel_de_fond", id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("appels_de_fond")
        .select("*")
        .eq("id", id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  // Récupération liaisons propriétaires
  const { data: liaisons, isLoading: loadingLiaisons } = useQuery({
    queryKey: ["appels_de_fond_proprietaires", id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("appels_de_fond_proprietaires")
        .select("*, proprietaire:proprietaire_id (id, nom, prenom)")
        .eq("appel_de_fond_id", id)
        .eq("agence_id", agency?.id);
      return data || [];
    },
    enabled: !!id && !!agency?.id,
  });

  // Statistiques recouvrement
  const stats = useMemo(() => {
    if (!liaisons || !appel) return { taux: "-", collecte: 0, payes: 0, total: 0 };
    const total = liaisons.length;
    const payes = liaisons.filter((l: any) => l.statut_paiement === "paye").length;
    const collecte = liaisons.filter((l: any) => l.statut_paiement === "paye").reduce((sum: number, l: any) => sum + Number(l.montant_du || 0), 0);
    const taux = appel.montant_total ? Math.round((collecte / Number(appel.montant_total)) * 100) + "%" : "0%";
    return { taux, collecte, payes, total };
  }, [liaisons, appel]);

  // Relancer un propriétaire
  const relancer = useMutation({
    mutationFn: async (ligne: any) => {
      setRelanceLoading(ligne.id);
      // 1. Insert relance
      await (supabase as any)
        .from("relances")
        .insert({
          appel_de_fond_id: appel.id,
          proprietaire_id: ligne.proprietaire_id,
          agence_id: agency.id,
          type_relance: "email"
        });
      // 2. Insert notification
      await (supabase as any)
        .from("notifications")
        .insert({
          proprietaire_id: ligne.proprietaire_id,
          appel_de_fond_id: appel.id,
          agence_id: agency.id,
          message: `Relance pour paiement de l'appel de fond : ${appel.titre}`
        });
      setRelanceLoading(null);
    },
    onSuccess: () => {
      toast({ title: "Relance envoyée", description: "Le propriétaire a bien été relancé." });
      queryClient.invalidateQueries({ queryKey: ["relances", id] });
    },
    onError: () => {
      setRelanceLoading(null);
      toast({ title: "Erreur", description: "La relance a échoué.", variant: "destructive" });
    }
  });

  if (loadingAppel || loadingLiaisons) return <div className="p-8">Chargement...</div>;
  if (!appel) return <div className="p-8">Appel de fond introuvable.</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        ← Retour
      </Button>
      <h1 className="text-2xl font-bold mb-2">{appel.titre}</h1>
      <div className="mb-4 text-gray-700">{appel.description}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div><span className="font-semibold">Montant total&nbsp;:</span> {Number(appel.montant_total).toLocaleString()} FCFA</div>
          <div><span className="font-semibold">Date création&nbsp;:</span> {appel.date_creation ? format(new Date(appel.date_creation), "dd/MM/yyyy") : "-"}</div>
          <div><span className="font-semibold">Date échéance&nbsp;:</span> {appel.date_echeance ? format(new Date(appel.date_echeance), "dd/MM/yyyy") : "-"}</div>
          <div>
            <span className="font-semibold">Statut&nbsp;:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${appel.statut === "en_cours" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-800"}`}>
              {appel.statut === "en_cours" ? "En cours" : "Terminé"}
            </span>
          </div>
          {appel.fichiers_joints && (
            <div>
              <span className="font-semibold">Fichiers joints&nbsp;:</span>
              <ul className="list-disc ml-6">
                {(() => {
                  // Extraire correctement les URLs selon le format
                  let urls: string[] = [];
                  
                  if (Array.isArray(appel.fichiers_joints)) {
                    // Si c'est déjà un tableau
                    urls = appel.fichiers_joints;
                  } else if (typeof appel.fichiers_joints === 'string') {
                    try {
                      // Vérifier si c'est une chaîne JSON (tableau stringifié)
                      const parsed = JSON.parse(appel.fichiers_joints);
                      if (Array.isArray(parsed)) {
                        urls = parsed;
                      } else {
                        // Sinon, traiter comme une chaîne séparée par des virgules
                        urls = appel.fichiers_joints.split(',');
                      }
                    } catch {
                      // Si le parsing JSON échoue, traiter comme une chaîne simple
                      urls = appel.fichiers_joints.split(',');
                    }
                  }
                  
                  // Afficher les liens
                  return urls.filter(url => url !== null && url !== undefined).map((url: string, i: number) => {
                    try {
                      // Nettoyer l'URL des guillemets si nécessaire
                      const cleanUrl = url ? url.replace(/^"|"$/g, '') : '';
                      if (!cleanUrl) return null; // Ignorer les URLs vides
                      
                      const fileName = cleanUrl.split('/').pop() || 'fichier';
                      
                      return (
                        <li key={i}>
                          <a 
                            href={cleanUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 underline"
                          >
                            Télécharger {fileName}
                          </a>
                        </li>
                      );
                    } catch (error) {
                      console.error("Erreur lors du traitement de l'URL:", url, error);
                      return null; // En cas d'erreur, ne pas afficher ce lien
                    }
                  }).filter(Boolean); // Filtrer les éléments null
                })()} 
              </ul>
            </div>
          )}
        </div>
        <div className="bg-gray-50 rounded shadow p-4 space-y-2">
          <div><span className="font-semibold">Taux de recouvrement&nbsp;:</span> {stats.taux}</div>
          <div><span className="font-semibold">Montant collecté&nbsp;:</span> {Number(stats.collecte).toLocaleString()} FCFA</div>
          <div><span className="font-semibold">Propriétaires ayant payé&nbsp;:</span> {stats.payes} / {stats.total}</div>
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-2">Propriétaires concernés</h2>
      <div className="overflow-x-auto bg-white rounded shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Montant dû</TableHead>
              <TableHead>Statut paiement</TableHead>
              <TableHead>Date paiement</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liaisons.length === 0 ? (
              <TableRow><TableCell colSpan={5}>Aucun propriétaire</TableCell></TableRow>
            ) : liaisons.map((ligne: any) => (
              <TableRow key={ligne.id}>
                <TableCell>{ligne.proprietaire ? `${ligne.proprietaire.prenom} ${ligne.proprietaire.nom}` : "-"}</TableCell>
                <TableCell>{Number(ligne.montant_du).toLocaleString()} FCFA</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${ligne.statut_paiement === "paye" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {ligne.statut_paiement === "paye" ? "Payé" : "Non payé"}
                  </span>
                </TableCell>
                <TableCell>{ligne.date_paiement ? format(new Date(ligne.date_paiement), "dd/MM/yyyy") : "-"}</TableCell>
                <TableCell>
                  {ligne.statut_paiement !== "paye" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={relanceLoading === ligne.id}
                      onClick={() => relancer.mutate(ligne)}
                    >
                      {relanceLoading === ligne.id ? "Envoi..." : "Relancer"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
