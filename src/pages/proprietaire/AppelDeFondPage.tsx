import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgencyContext } from '@/contexts/AgencyContext';
import { useAgencyAuthStore } from '@/stores/useAgencyAuthStore';
import { supabase } from '@/integrations/supabase/client';
import { format, isAfter, parseISO, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, FileText, Search, AlertCircle, CheckCircle, Download } from 'lucide-react';

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
  statut_paiement: 'paye' | 'non_paye';
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

export default function ProprietaireAppelDeFondPage() {
  const navigate = useNavigate();
  const { agency } = useAgencyContext();
  const { user } = useAgencyAuthStore();
  const [loading, setLoading] = useState(true);
  const [proprietaire, setProprietaire] = useState<Proprietaire | null>(null);
  const [appelsDeFond, setAppelsDeFond] = useState<AppelDeFondProprietaire[]>([]);
  const [filteredAppels, setFilteredAppels] = useState<AppelDeFondProprietaire[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [dateFilter, setDateFilter] = useState('tous');

  // Récupérer les données du propriétaire et ses appels de fond
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer l'ID du propriétaire à partir de son email
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email || user?.email;
        
        if (!userEmail || !agency?.id) {
          console.error("Informations d'utilisateur ou d'agence manquantes");
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
        
        // Récupérer les appels de fond du propriétaire avec les détails
        const { data: appelsData, error: appelsError } = await supabase
          .from('appels_de_fond_proprietaires')
          .select(`
            *,
            appel_de_fond:appel_de_fond_id(*)
          `)
          .eq('proprietaire_id', currentProprietaire.id)
          .eq('agence_id', agency.id);
        
        if (appelsError) throw appelsError;
        
        setAppelsDeFond(appelsData || []);
        setFilteredAppels(appelsData || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [agency, user]);

  // Appliquer les filtres
  useEffect(() => {
    let result = [...appelsDeFond];
    
    // Filtre par statut
    if (statusFilter !== 'tous') {
      result = result.filter(appel => appel.statut_paiement === statusFilter);
    }
    
    // Filtre par date
    if (dateFilter === 'recent') {
      const oneWeekAgo = subDays(new Date(), 7);
      result = result.filter(appel => {
        const creationDate = parseISO(appel.appel_de_fond?.date_creation || '');
        return isAfter(creationDate, oneWeekAgo);
      });
    } else if (dateFilter === 'mois') {
      const oneMonthAgo = subDays(new Date(), 30);
      result = result.filter(appel => {
        const creationDate = parseISO(appel.appel_de_fond?.date_creation || '');
        return isAfter(creationDate, oneMonthAgo);
      });
    }
    
    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(appel => 
        appel.appel_de_fond?.titre.toLowerCase().includes(term) ||
        appel.appel_de_fond?.description?.toLowerCase().includes(term)
      );
    }
    
    setFilteredAppels(result);
  }, [appelsDeFond, statusFilter, dateFilter, searchTerm]);

  // Vérifier si un appel de fond est récent (moins de 7 jours)
  const isRecent = (dateStr: string) => {
    const date = parseISO(dateStr);
    const sevenDaysAgo = subDays(new Date(), 7);
    return isAfter(date, sevenDaysAgo);
  };

  // Formater la date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Non définie';
    return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <div className="container p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mes Appels de Fond</h1>
        <p className="text-muted-foreground">Consultez et gérez vos appels de fond</p>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* Filtres et recherche */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Rechercher un appel de fond..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="paye">Payés</SelectItem>
                  <SelectItem value="non_paye">Non payés</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date">Période</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="date">
                  <SelectValue placeholder="Toutes les dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes les dates</SelectItem>
                  <SelectItem value="recent">7 derniers jours</SelectItem>
                  <SelectItem value="mois">30 derniers jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Onglets */}
          <Tabs defaultValue="liste" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="liste">Liste</TabsTrigger>
              <TabsTrigger value="non_payes">Non payés ({appelsDeFond.filter(a => a.statut_paiement === 'non_paye').length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="liste" className="space-y-4">
              {filteredAppels.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <p>Aucun appel de fond trouvé avec ces critères.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAppels.map((appel) => (
                  <Card key={appel.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {appel.appel_de_fond?.titre}
                            </h3>
                            {isRecent(appel.appel_de_fond?.date_creation || '') && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                Nouveau
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Créé le {formatDate(appel.appel_de_fond?.date_creation || null)}
                          </div>
                          {appel.appel_de_fond?.date_echeance && (
                            <div className="flex items-center gap-1 text-sm mt-1">
                              <CalendarIcon className="h-3 w-3" />
                              Échéance: {formatDate(appel.appel_de_fond.date_echeance)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {appel.montant_du.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                            </span>
                            {appel.statut_paiement === 'paye' ? (
                              <Badge className="bg-green-50 text-green-600 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" /> Payé
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200">
                                <AlertCircle className="h-3 w-3 mr-1" /> Non payé
                              </Badge>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/${agency?.slug}/proprietaire/appels-de-fond/${appel.appel_de_fond_id}`)}
                          >
                            Voir les détails
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="non_payes" className="space-y-4">
              {appelsDeFond.filter(a => a.statut_paiement === 'non_paye').length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-4" />
                    <p>Félicitations ! Tous vos appels de fond sont payés.</p>
                  </CardContent>
                </Card>
              ) : (
                appelsDeFond
                  .filter(a => a.statut_paiement === 'non_paye')
                  .map((appel) => (
                    <Card key={appel.id} className="overflow-hidden border-red-100">
                      <CardContent className="p-0">
                        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                {appel.appel_de_fond?.titre}
                              </h3>
                              {isRecent(appel.appel_de_fond?.date_creation || '') && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                  Nouveau
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Créé le {formatDate(appel.appel_de_fond?.date_creation || null)}
                            </div>
                            {appel.appel_de_fond?.date_echeance && (
                              <div className="flex items-center gap-1 text-sm mt-1">
                                <CalendarIcon className="h-3 w-3" />
                                Échéance: {formatDate(appel.appel_de_fond.date_echeance)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {appel.montant_du.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                              </span>
                              <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200">
                                <AlertCircle className="h-3 w-3 mr-1" /> Non payé
                              </Badge>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/${agency?.slug}/proprietaire/appels-de-fond/${appel.appel_de_fond_id}`)}
                            >
                              Voir les détails
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
