import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgencyContext } from '@/contexts/AgencyContext';
import { useAgencyAuthStore } from '@/stores/useAgencyAuthStore';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertCircle, 
  ArrowLeft, 
  CalendarIcon, 
  CheckCircle, 
  Download, 
  FileText,
  Info,
  Receipt,
  Users
} from 'lucide-react';

// Types
interface AppelDeFond {
  id: number;
  titre: string;
  description: string | null;
  montant_total: number;
  date_creation: string;
  date_echeance: string | null;
  statut: 'en_cours' | 'termine';
  fichiers_joints: string | null;
  agence_id: string;
}

interface AppelDeFondProprietaire {
  id: number;
  appel_de_fond_id: number;
  proprietaire_id: number;
  montant_du: number;
  statut_paiement: string;
  date_paiement: string | null;
  date_relance: string | null;
  agence_id: string;
  bien_concerne: string | null;
  montant_restant: number | null;
  appel_de_fond?: AppelDeFond;
}

interface Proprietaire {
  id: number;
  prenom: string;
  nom: string;
  adresse_email: string;
}

interface Paiement {
  id: number;
  proprietaire_id: number;
  type_paiement: string;
  appel_de_fond_id: number | null;
  montant: number;
  description: string | null;
  date_ajout: string;
  statut: 'paye' | 'non_paye';
  fichier_facture_recu: string | null;
  agence_id: string;
}

interface ProprietaireInfo {
  id: number;
  nom: string;
  prenom: string;
  appel_proprietaire: AppelDeFondProprietaire;
}

export default function AppelDeFondDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agency } = useAgencyContext();
  const { user } = useAgencyAuthStore();
  const [loading, setLoading] = useState(true);
  const [proprietaire, setProprietaire] = useState<Proprietaire | null>(null);
  const [appelDeFond, setAppelDeFond] = useState<AppelDeFond | null>(null);
  const [appelProprietaire, setAppelProprietaire] = useState<AppelDeFondProprietaire | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [notificationRead, setNotificationRead] = useState(false);
  const [fichiers, setFichiers] = useState<string[]>([]);
  const [proprietairesConcernes, setProprietairesConcernes] = useState<ProprietaireInfo[]>([]);

  // Récupérer les données de l'appel de fond
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id || !agency?.id) return;
        setLoading(true);
        
        // Récupérer l'ID du propriétaire à partir de son email
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email || user?.email;
        
        if (!userEmail) {
          console.error("Informations d'utilisateur manquantes");
          return;
        }
        
        // Récupérer les données du propriétaire
        const { data: proprietaires, error: proprietaireError } = await supabase
          .from('proprietaire')
          .select('*')
          .eq('adresse_email', userEmail)
          .eq('agenceID', agency.id);
        
        if (proprietaireError) throw proprietaireError;
        
        if (!proprietaires || proprietaires.length === 0) {
          console.error("Aucun propriétaire trouvé avec cet email");
          return;
        }
        
        const currentProprietaire = proprietaires[0];
        setProprietaire(currentProprietaire);
        
        // Récupérer les détails de l'appel de fond
        const { data: appelData, error: appelError } = await supabase
          .from('appels_de_fond')
          .select('*')
          .eq('id', id)
          .eq('agence_id', agency.id)
          .single();
        
        if (appelError) throw appelError;
        setAppelDeFond(appelData);
        
        // Vérifier si cet appel de fond concerne le propriétaire
        const { data: appelProprio, error: appelProprioError } = await supabase
          .from('appels_de_fond_proprietaires')
          .select('*')
          .eq('appel_de_fond_id', id)
          .eq('proprietaire_id', currentProprietaire.id)
          .eq('agence_id', agency.id)
          .single();
        
        if (appelProprioError) {
          console.error("Cet appel de fond ne concerne pas ce propriétaire");
          navigate(`/${agency.slug}/proprietaire/appels-de-fond`);
          return;
        }
        
        setAppelProprietaire(appelProprio);
        
        // Récupérer les paiements liés à cet appel de fond pour ce propriétaire
        const { data: paiementsData, error: paiementsError } = await supabase
          .from('paiements')
          .select('*')
          .eq('appel_de_fond_id', id)
          .eq('proprietaire_id', currentProprietaire.id)
          .eq('agence_id', agency.id)
          .order('date_ajout', { ascending: false });
        
        if (paiementsError) throw paiementsError;
        setPaiements(paiementsData || []);
        
        // Récupérer tous les propriétaires concernés par cet appel de fond
        try {
          // Utiliser any pour contourner les problèmes de typage avec Supabase
          const { data: tousAppelsProprios, error: tousAppelsError } = await supabase
            .from('appels_de_fond_proprietaires' as any)
            .select('*')
            .eq('appel_de_fond_id', id)
            .eq('agence_id', agency.id);
            
          if (!tousAppelsError && tousAppelsProprios) {
            // Pour chaque propriétaire concerné, récupérer ses informations
            const proprietairesInfoPromises = tousAppelsProprios.map(async (appelProprio: any) => {
              const { data: proprietaireData } = await supabase
                .from('proprietaire' as any)
                .select('id, nom, prenom')
                .eq('id', appelProprio.proprietaire_id)
                .single();
                
              if (proprietaireData) {
                return {
                  id: proprietaireData.id,
                  nom: proprietaireData.nom,
                  prenom: proprietaireData.prenom,
                  appel_proprietaire: appelProprio as AppelDeFondProprietaire
                } as ProprietaireInfo;
              }
              return null;
            });
            
            const proprietairesInfo = await Promise.all(proprietairesInfoPromises);
            setProprietairesConcernes(proprietairesInfo.filter(Boolean) as ProprietaireInfo[]);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des propriétaires concernés:", error);
        }
        
        // Marquer les notifications comme lues (si la table existe)
        // Vérifier d'abord si la table notifications existe et la structure des colonnes
        try {
          // Récupérer d'abord les notifications pour vérifier leur structure
          const { data: notificationsData, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('appel_de_fond_id', id)
            .eq('proprietaire_id', currentProprietaire.id)
            .eq('agence_id', agency.id);
            
          if (!notifError && notificationsData && notificationsData.length > 0) {
            // Vérifier si la colonne s'appelle 'lue' ou 'lu' ou autre chose
            const firstNotif = notificationsData[0];
            const updateObj = {};
            
            // Déterminer le nom de la colonne pour le statut de lecture
            if ('lue' in firstNotif) updateObj['lue'] = true;
            else if ('lu' in firstNotif) updateObj['lu'] = true;
            else if ('is_read' in firstNotif) updateObj['is_read'] = true;
            else if ('read' in firstNotif) updateObj['read'] = true;
            else if ('status' in firstNotif) updateObj['status'] = 'read';
            
            // Mettre à jour seulement si on a identifié la bonne colonne
            if (Object.keys(updateObj).length > 0) {
              await supabase
                .from('notifications')
                .update(updateObj)
                .eq('appel_de_fond_id', id)
                .eq('proprietaire_id', currentProprietaire.id)
                .eq('agence_id', agency.id);
            }
          }
          
          setNotificationRead(true);
        } catch (e) {
          // La table peut ne pas exister ou avoir une structure différente, ignorer l'erreur
          console.log("Impossible de mettre à jour les notifications:", e)
        }
        
        // Traiter les fichiers joints s'ils existent
        if (appelData.fichiers_joints) {
          try {
            const fichiersArray = JSON.parse(appelData.fichiers_joints);
            setFichiers(Array.isArray(fichiersArray) ? fichiersArray : []);
          } catch (e) {
            console.error("Erreur lors du parsing des fichiers joints", e);
            setFichiers([]);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, agency, user, navigate]);

  // Formater la date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Non définie';
    return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: fr });
  };

  // Télécharger un fichier
  const handleDownload = async (filePath: string) => {
    try {
      const fileName = filePath.split('/').pop() || 'document';
      
      // Récupérer l'URL de téléchargement depuis Supabase Storage
      const { data, error } = await supabase.storage
        .from('appels-de-fond')
        .createSignedUrl(filePath, 60); // URL valide 60 secondes
      
      if (error) throw error;
      
      // Créer un lien temporaire pour le téléchargement
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier:", error);
    }
  };

  return (
    <div className="container p-4 md:p-6">
      {/* Bouton de retour */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4"
        onClick={() => navigate(`/${agency?.slug}/proprietaire/appels-de-fond`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux appels de fond
      </Button>
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : appelDeFond && appelProprietaire ? (
        <>
          {/* En-tête */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{appelDeFond.titre}</h1>
                <p className="text-muted-foreground">
                  Créé le {formatDate(appelDeFond.date_creation)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  {appelProprietaire.montant_du.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                </span>
                {appelProprietaire.statut_paiement === 'paye' ? (
                  <Badge className="bg-green-50 text-green-600 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Payé
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200">
                    <AlertCircle className="h-3 w-3 mr-1" /> Non payé
                  </Badge>
                )}
              </div>
            </div>
            
            {appelDeFond.date_echeance && (
              <div className="flex items-center gap-1 mt-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>Échéance: <strong>{formatDate(appelDeFond.date_echeance)}</strong></span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Détails de l'appel de fond */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Détails
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appelDeFond.description ? (
                    <div className="prose max-w-none">
                      <p>{appelDeFond.description}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Aucune description disponible</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Fichiers joints */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                  </CardTitle>
                  <CardDescription>
                    Documents joints à cet appel de fond
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fichiers.length > 0 ? (
                    <div className="space-y-2">
                      {fichiers.map((fichier, index) => (
                        <div 
                          key={`fichier-${index}`} 
                          className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{fichier && typeof fichier === 'string' ? fichier.split('/').pop() : 'Fichier joint'}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDownload(fichier)}
                            disabled={!fichier || typeof fichier !== 'string'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Aucun document joint</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Historique des paiements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Historique des paiements
                  </CardTitle>
                  <CardDescription>
                    Vos paiements pour cet appel de fond
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paiements.length > 0 ? (
                    <div className="space-y-4">
                      {paiements.map((paiement) => (
                        <div 
                          key={paiement.id} 
                          className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-md"
                        >
                          <div>
                            <div className="font-medium">
                              {paiement.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                              {' '}
                              <Badge variant="outline" className="ml-2">
                                {paiement.type_paiement}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(paiement.date_ajout)}
                            </div>
                            {paiement.description && (
                              <p className="text-sm mt-1">{paiement.description}</p>
                            )}
                          </div>
                          
                          {paiement.fichier_facture_recu && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mt-2 md:mt-0"
                              onClick={() => handleDownload(paiement.fichier_facture_recu || '')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Reçu
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Aucun paiement enregistré</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Liste des propriétaires concernés */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Propriétaires concernés
                  </CardTitle>
                  <CardDescription>
                    Liste de tous les propriétaires concernés par cet appel de fond
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {proprietairesConcernes.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 font-medium text-sm text-muted-foreground mb-2">
                        <div>Propriétaire</div>
                        <div>Montant dû</div>
                        <div>Montant restant</div>
                        <div>Statut</div>
                      </div>
                      <Separator />
                      {proprietairesConcernes.map((proprio) => (
                        <div key={`proprio-${proprio.id}`} className="grid grid-cols-4 items-center py-2">
                          <div className="font-medium">{proprio.prenom} {proprio.nom}</div>
                          <div>{proprio.appel_proprietaire.montant_du.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</div>
                          <div>{(proprio.appel_proprietaire.montant_restant || proprio.appel_proprietaire.montant_du).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</div>
                          <div>
                            {proprio.appel_proprietaire.statut_paiement === 'paye' ? (
                              <Badge className="bg-green-50 text-green-600 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" /> Payé
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200">
                                <AlertCircle className="h-3 w-3 mr-1" /> Non payé
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Aucun autre propriétaire concerné</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Résumé et actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Résumé</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant total dû:</span>
                    <span className="font-medium">{appelProprietaire.montant_du.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant restant:</span>
                    <span className="font-medium">
                      {(appelProprietaire.montant_restant || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut:</span>
                    <span>
                      {appelProprietaire.statut_paiement === 'paye' ? (
                        <Badge className="bg-green-50 text-green-600 border-green-200">
                          Payé
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200">
                          Non payé
                        </Badge>
                      )}
                    </span>
                  </div>
                  
                  {appelProprietaire.date_paiement && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date de paiement:</span>
                      <span>{formatDate(appelProprietaire.date_paiement)}</span>
                    </div>
                  )}
                  
                  {appelDeFond.date_echeance && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date d'échéance:</span>
                      <span>{formatDate(appelDeFond.date_echeance)}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Separator className="mb-4" />
                </CardFooter>
              </Card>
              

            </div>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <p>Cet appel de fond n'existe pas ou vous n'y avez pas accès.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate(`/${agency?.slug}/proprietaire/appels-de-fond`)}
            >
              Retour aux appels de fond
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
