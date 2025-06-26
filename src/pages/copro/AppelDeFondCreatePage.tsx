import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AppelDeFondCreatePage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [montantTotal, setMontantTotal] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [selectedProprietaires, setSelectedProprietaires] = useState<any[]>([]);
  const [montantsIndividuels, setMontantsIndividuels] = useState<{[key:number]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Typage amélioré pour lotsList et biensProprietairesList
  interface Lot {
    id: number;
    numero_lot?: string;
    nom?: string;
  }
  interface BienProprietaire {
    bien_id: string;
    bien_nom: string;
    lot_id: string;
    proprietaire_id: number;
    proprietaire_nom: string;
  }
  const [biensProprietairesList, setBiensProprietairesList] = useState<BienProprietaire[]>([]);
  // Ajout de l'état pour les lots sélectionnés
  const [selectedLots, setSelectedLots] = useState<string[]>([]);
  // État pour suivre le chargement des biens/propriétaires
  const [loadingBiensProprietaires, setLoadingBiensProprietaires] = useState(false);

  // Gestion de la saisie des montants individuels par couple bien/propriétaire
  const handleMontantBienProprioChange = (bienId: number, proprioId: number, value: string) => {
    setMontantsIndividuels(prev => ({ ...prev, [`${bienId}-${proprioId}`]: value }));
    validateMontantTotal({ ...montantsIndividuels, [`${bienId}-${proprioId}`]: value });
  };

  // Validation stricte de la somme des montants
  const [montantErreur, setMontantErreur] = useState<string>("");
  const validateMontantTotal = (montants: {[key: string]: string}) => {
    const somme = Object.values(montants).reduce((acc, val) => acc + Number(val || 0), 0);
    if (Number(montantTotal) !== somme) {
      setMontantErreur(`La somme des montants individuels (${somme}) doit être strictement égale au montant total (${montantTotal})`);
    } else {
      setMontantErreur("");
    }
  };



  // Récupérer tous les lots
  const { data: lotsList, isLoading: loadingLots } = useQuery({
    queryKey: ["lots", agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const { data } = await (supabase as any)
        .from("lot")
        .select("id, nom, numero");
      return data || [];
    },
    enabled: !!agency?.id,
  });

  // Récupérer les propriétaires
  const { data: proprietaires, isLoading: loadingProprietaires } = useQuery({
    queryKey: ["proprietaires", agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const { data } = await (supabase as any)
        .from("proprietaire")
        .select("id, prenom, nom")
        .eq("agenceID", agency.id);
      return data || [];
    },
    enabled: !!agency?.id,
  });
  
  // Ajouter un lot à la sélection
  const handleAddLot = (lotId: string) => {
    if (!selectedLots.includes(lotId)) {
      const newSelectedLots = [...selectedLots, lotId];
      setSelectedLots(newSelectedLots);
      
      if (newSelectedLots.length > 0) {
        loadBiensProprietaires(newSelectedLots);
      }
    }
  };
  
  // Retirer un lot de la sélection
  const handleRemoveLot = (lotId: string) => {
    const newSelectedLots = selectedLots.filter(id => id !== lotId);
    setSelectedLots(newSelectedLots);
    
    if (newSelectedLots.length > 0) {
      loadBiensProprietaires(newSelectedLots);
    } else {
      setBiensProprietairesList([]);
    }
  };
  
  // Fonction pour charger les biens et propriétaires associés aux lots sélectionnés
  const loadBiensProprietaires = async (lotIds: string[]) => {
    setLoadingBiensProprietaires(true);
    try {
      // Récupérer les biens liés aux lots sélectionnés avec leurs propriétaires
      const { data: properties } = await supabase
        .from("properties")
        .select("id, title, lot, proprio, proprietaire:proprio(id, prenom, nom)")
        .in("lot", lotIds)
        .eq("agency_id", agency.id);
      
      if (properties && properties.length > 0) {
        // Transformer les données pour l'affichage
        const biensProprietaires = properties.map((property: any) => ({
          bien_id: property.id,
          bien_nom: property.title, // 'title' est bien le nom du bien selon le schéma
          lot_id: property.lot,
          proprietaire_id: property.proprietaire?.id,
          proprietaire_nom: property.proprietaire ? `${property.proprietaire.prenom} ${property.proprietaire.nom}` : ""
        })).filter((bp: any) => bp.proprietaire_id); // filtrer les biens sans propriétaire
        
        setBiensProprietairesList(biensProprietaires);
      } else {
        setBiensProprietairesList([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des biens et propriétaires:", error);
      setBiensProprietairesList([]);
    } finally {
      setLoadingBiensProprietaires(false);
    }
  };
  
  // Calcul automatique du montant par tantième
  const totalTantiemes = useMemo(() => {
    if (!biensProprietairesList) return 0;
    // Nous n'avons plus accès aux tantièmes directement, il faudrait les récupérer via une requête séparée
    return 0; // À implémenter si nécessaire
  }, [biensProprietairesList]);

  const handleProprietaireCheck = (proprietaire: any, checked: boolean) => {
    if (checked) {
      setSelectedProprietaires(prev => [...prev, proprietaire]);
    } else {
      setSelectedProprietaires(prev => prev.filter(p => p.id !== proprietaire.id));
      setMontantsIndividuels(prev => {
        const copy = { ...prev };
        delete copy[proprietaire.id];
        return copy;
      });
    }
  };

  // Gestion upload fichiers (Supabase Storage)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFichiers(Array.from(e.target.files));
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier que tous les champs obligatoires sont remplis
    if (!titre || !montantTotal || !dateEcheance || biensProprietairesList.length === 0) {
      toast.error("Veuillez remplir tous les champs obligatoires et sélectionner au moins un lot avec des biens/propriétaires.");
      return;
    }
    
    // Vérifier que tous les montants individuels sont saisis
    const montantsManquants = biensProprietairesList.some(bp => 
      !montantsIndividuels[`${bp.bien_id}-${bp.proprietaire_id}`] || 
      Number(montantsIndividuels[`${bp.bien_id}-${bp.proprietaire_id}`]) <= 0
    );
    
    if (montantsManquants) {
      toast.error("Veuillez saisir tous les montants individuels pour chaque bien/propriétaire.");
      return;
    }
    
    // Vérifier que la somme des montants individuels correspond au montant total
    if (montantErreur) {
      toast.error("La somme des montants individuels doit être égale au montant total.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Upload fichiers dans le bucket 'documents' si besoin
      const fichiersUrls: string[] = [];
      if (fichiers.length > 0) {
        for (const fichier of fichiers) {
          const { data, error } = await supabase.storage.from("documents").upload(
            `${agency.id}/appels-de-fond/${Date.now()}_${fichier.name}`,
            fichier
          );
          if (error) throw error;
          // Récupérer l'URL publique du fichier
          const { data: urlData } = supabase.storage.from("documents").getPublicUrl(data.path);
          if (urlData && urlData.publicUrl) {
            fichiersUrls.push(urlData.publicUrl);
          }
        }
      }
      
      // 2. Insérer l'appel de fond principal
      const { data: appelDeFond, error: appelError } = await supabase
        .from("appels_de_fond")
        .insert({
          titre,
          description,
          montant_total: Number(montantTotal),
          date_echeance: dateEcheance,
          fichiers_joints: fichiersUrls,
          agence_id: agency.id,
          date_creation: new Date().toISOString()
        })
        .select()
        .single();
        
      if (appelError) throw appelError;
      
      // 3. Insérer les couples bien/propriétaire dans appels_de_fond_proprietaires
      const proprietairesPayload = biensProprietairesList.map((bp) => ({
        appel_de_fond_id: appelDeFond.id,
        bien_concerne: bp.bien_id, // Correction: bien_id -> bien_concerne pour correspondre au schéma SQL
        proprietaire_id: bp.proprietaire_id,
        montant_du: Number(montantsIndividuels[`${bp.bien_id}-${bp.proprietaire_id}`] || 0),
        montant_restant: Number(montantsIndividuels[`${bp.bien_id}-${bp.proprietaire_id}`] || 0),
        agence_id: agency.id
      }));
      
      const { error: liaisonError } = await supabase
        .from("appels_de_fond_proprietaires")
        .insert(proprietairesPayload);
        
      if (liaisonError) throw liaisonError;
      
      toast.success("Appel de fond créé avec succès !");
      navigate(`/${agency.slug}/copro/appels-de-fond/${appelDeFond.id}`);
    } catch (error) {
      const err = error as Error;
      toast.error("Erreur lors de la création : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 w-full bg-white">
      <h1 className="text-3xl font-bold mb-8 text-center">Créer un appel de fond</h1>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={handleSubmit}>
        {/* Colonne gauche - Informations générales */}
        <div className="space-y-6 bg-gray-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Informations générales</h2>
          
          <div className="space-y-2">
            <label className="font-semibold text-gray-700">Titre *</label>
            <Input 
              value={titre} 
              onChange={e => setTitre(e.target.value)} 
              required 
              className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-gray-700">Description</label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[120px]" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-semibold text-gray-700">Montant total (FCFA) *</label>
              <Input 
                type="number" 
                value={montantTotal} 
                onChange={e => setMontantTotal(e.target.value)} 
                required 
                min={0} 
                className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="font-semibold text-gray-700">Date d'échéance *</label>
              <Input 
                type="date" 
                value={dateEcheance} 
                onChange={e => setDateEcheance(e.target.value)} 
                required 
                className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-gray-700">Fichiers joints (images/PDF)</label>
            <Input 
              type="file" 
              multiple 
              accept="image/*,application/pdf" 
              onChange={handleFileChange} 
              className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
            />
          </div>
        </div>
        
        {/* Colonne droite - Sélection des lots et propriétaires */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Sélection des lots *</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Liste des lots disponibles */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Lots disponibles</h3>
                <div className="border rounded-md bg-white h-64 overflow-y-auto">
                  {lotsList?.filter(lot => !selectedLots.includes(String(lot.id))).map((lot: any) => (
                    <div key={lot.id} className="flex justify-between items-center p-2 hover:bg-gray-100 border-b last:border-b-0">
                      <span>{lot.numero_lot || lot.nom}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAddLot(String(lot.id))}
                        className="text-green-600 hover:text-green-800 hover:bg-green-100"
                      >
                        + Ajouter
                      </Button>
                    </div>
                  ))}
                  {lotsList?.filter(lot => !selectedLots.includes(String(lot.id))).length === 0 && (
                    <div className="p-4 text-center text-gray-500">Tous les lots sont sélectionnés</div>
                  )}
                </div>
              </div>
              
              {/* Liste des lots sélectionnés */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Lots sélectionnés</h3>
                <div className="border rounded-md bg-white h-64 overflow-y-auto">
                  {selectedLots.length > 0 ? (
                    lotsList?.filter(lot => selectedLots.includes(String(lot.id))).map((lot: any) => (
                      <div key={lot.id} className="flex justify-between items-center p-2 hover:bg-gray-100 border-b last:border-b-0">
                        <span>{lot.numero_lot || lot.nom}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveLot(String(lot.id))}
                          className="text-red-600 hover:text-red-800 hover:bg-red-100"
                        >
                          - Retirer
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">Aucun lot sélectionné</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Biens et propriétaires associés */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Montants par propriétaire</h2>
            
            {loadingBiensProprietaires ? (
              <div className="p-4 text-center">Chargement des biens et propriétaires...</div>
            ) : biensProprietairesList.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Aucun bien/propriétaire trouvé pour les lots sélectionnés.</div>
            ) : (
              <div className="border rounded-md bg-white overflow-y-auto max-h-80">
                {biensProprietairesList.map((bp: any) => (
                  <div key={bp.bien_id + '-' + bp.proprietaire_id} className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">{bp.proprietaire_nom}</div>
                      <div className="text-sm text-gray-500">Bien: {bp.bien_nom || "Non spécifié"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={montantsIndividuels[`${bp.bien_id}-${bp.proprietaire_id}`] || ""}
                        min={0}
                        step="0.01"
                        onChange={e => handleMontantBienProprioChange(bp.bien_id, bp.proprietaire_id, e.target.value)}
                        className="w-32 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        required
                        placeholder="Montant"
                      />
                      <span className="text-sm text-gray-600">FCFA</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {montantErreur && (
              <div className="text-red-600 text-sm mt-2 font-semibold bg-red-50 p-2 rounded">{montantErreur}</div>
            )}
          </div>
          
          {/* Boutons d'action */}
          <div className="flex justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)} 
              disabled={isSubmitting}
              className="border-gray-300 hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Création en cours..." : "Créer l'appel de fond"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
