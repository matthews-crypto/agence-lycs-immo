import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyAuthStore } from "@/stores/useAgencyAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Building, Calendar, LogOut, Banknote, FileText, CreditCard, Bell } from "lucide-react";

// Définition des types
interface Proprietaire {
  id: number;
  prenom: string;
  nom: string;
  adresse: string;
  numero_telephone: string;
  adresse_email: string;
  agence_id?: string; // Champ pour lier le propriétaire à une agence
}

// Interface pour les propriétés immobilières telles qu'elles sont stockées dans Supabase
interface Property {
  id: string | number;
  title?: string;
  address: string;
  status?: string;
  reference_number?: string;
  proprio: number;
  is_available?: boolean;
  // Champs utilisés dans l'affichage du dashboard
  [key: string]: any; // Pour permettre d'autres champs dynamiques
}

export default function ProprietaireDashboardPage() {
  const navigate = useNavigate();
  const { agency } = useAgencyContext();
  const { logout, user } = useAgencyAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [proprietaireData, setProprietaireData] = useState<Proprietaire | null>(null);
  const [overview, setOverview] = useState({
    afCount: 0,
    totalDue: 0,
    demandes: [] as any[],
    demandesEnCours: 0,
    paiements: [] as any[],
    notificationsUnread: 0,
  });

  // Définir fetchProprietaireData avant de l'utiliser dans useEffect
  const fetchProprietaireData = async () => {
    try {
      setLoading(true);
      
      // Utiliser directement la session Supabase plutôt que le store pour plus de fiabilité
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || user?.email;
      
      if (!userEmail) {
        console.error("No user email available, cannot fetch proprietaire data");
        return;
      }
      
      console.log("Fetching proprietaire data for email:", userEmail);
      
      // Récupérer les données du propriétaire
      const { data: proprietaires, error: proprietaireError } = await supabase
        .from('proprietaire')
        .select('*')
        .eq('adresse_email', userEmail);
      
      if (proprietaireError) {
        console.error("Error fetching proprietaire:", proprietaireError);
        throw proprietaireError;
      }
      
      console.log("Proprietaires found:", proprietaires?.length || 0);
      
      // S'il y a plusieurs propriétaires avec le même email, prendre le premier
      let proprietaire = null;
      if (proprietaires && proprietaires.length > 0) {
        if (agency?.id) {
          // Utiliser le bon champ (agenceID) pour la table proprietaire
          proprietaire = proprietaires.find(p => p.agenceID === agency.id);
        }
        // Si aucun propriétaire n'est trouvé pour cette agence, prendre le premier
        if (!proprietaire) {
          proprietaire = proprietaires[0];
        }
      }
      console.log("Proprietaire sélectionné pour dashboard :", proprietaire);
      
      if (!proprietaire) {
        console.error("No proprietaire found for this email");
        return;
      }
      
      console.log("Selected proprietaire:", proprietaire);
      setProprietaireData(proprietaire);
      
      // Récupérer les biens du propriétaire
      if (proprietaire?.id) {
        const { data: props, error: propsError } = await supabase
          .from('properties')
          .select('*')
          .eq('proprio', proprietaire.id);
        
        if (propsError) {
          console.error("Error fetching properties:", propsError);
          throw propsError;
        }
        
        console.log("Properties found:", props?.length || 0);
        setProperties(props || []);
      }
    } catch (error) {
      console.error("Error fetching proprietaire data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async (proprioId: number) => {
    try {
      // Appels de fond en cours (non payés)
      const { data: afEnCours, error: afErr } = await supabase
        .from("appels_de_fond_proprietaires")
        .select("montant_du, montant_restant")
        .eq("proprietaire_id", proprioId)
        .eq("agence_id", agency?.id)
        .eq("statut_paiement", "non_paye");
      if (afErr) throw afErr;
      const afCount = afEnCours?.length || 0;
      // Utiliser montant_du si montant_restant est null ou non défini
      const totalDue = afEnCours?.reduce((acc: number, cur: any) => acc + Number(cur.montant_restant || cur.montant_du || 0), 0) || 0;

      // Demandes récentes
      const { data: demandes, error: demErr } = await supabase
        .from("demandes")
        .select("*")
        .eq("proprietaire_id", proprioId)
        .eq("agence_id", agency?.id)
        .order("date_creation", { ascending: false })
        .limit(5);
      if (demErr) throw demErr;
      const demandesEnCours = (demandes || []).filter((d: any) => d.statut === "non_traitee").length;

      // Paiements récents
      const { data: paiements, error: payErr } = await supabase
        .from("paiements")
        .select("*")
        .eq("proprietaire_id", proprioId)
        .eq("agence_id", agency?.id)
        .order("date_ajout", { ascending: false })
        .limit(5);
      if (payErr) throw payErr;

      // Notifications non lues (si la table existe)
      // Note: La table notifications n'existe pas dans le schéma actuel
      // On laisse cette partie commentée pour une implémentation future
      let notificationsUnread = 0;
      /*
      try {
        const { data: notifs } = await supabase
          .from("notifications")
          .select("lue")
          .eq("proprietaire_id", proprioId)
          .eq("agence_id", agency?.id)
          .eq("lue", false);
        notificationsUnread = notifs?.length || 0;
      } catch (_) {
        // table peut ne pas exister, ignorer
      }
      */

      setOverview({
        afCount,
        totalDue,
        demandes: demandes || [],
        demandesEnCours,
        paiements: paiements || [],
        notificationsUnread,
      });
    } catch (e) {
      console.error("Error fetching overview", e);
    }
  };

  useEffect(() => {
    console.log("Dashboard useEffect - Agency:", agency);
    console.log("Dashboard useEffect - User:", user);
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Dashboard checkAuth - Session:", session);
      
      if (!session) {
        console.log("No session in dashboard, redirecting to auth");
        if (agency?.slug) {
          navigate(`/${agency.slug}/agency/auth`);
        }
        return;
      }
      
      if (session.user?.user_metadata?.role !== 'proprietaire') {
        console.log("User is not a proprietaire, redirecting to home");
        if (agency?.slug) {
          navigate(`/${agency.slug}/agency/auth`);
        }
      }
    };
    
    // Vérifier l'authentification et charger les données seulement si l'agence est disponible
    if (agency) {
      checkAuth();
      fetchProprietaireData();
    } else {
      console.log("Agency not available yet, waiting...");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, agency, user?.email]);

  useEffect(() => {
    if (proprietaireData?.id) {
      fetchOverview(proprietaireData.id);
    }
  }, [proprietaireData?.id]);

  const handleLogout = async () => {
    await logout();
    if (agency?.slug) {
      navigate(`/${agency.slug}/agency/auth`);
    }
  };

  return (
    <div className="container p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord propriétaire</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Chargement...</p>
        </div>
      ) : (
        <>
          {proprietaireData && (
            <>
            {/* Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="cursor-pointer" onClick={() => navigate(`/${agency?.slug}/proprietaire/appels-de-fond`)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Banknote className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Appels de fond en cours</p>
                    <p className="text-2xl font-bold">{overview.afCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer" onClick={() => navigate(`/${agency?.slug}/proprietaire/demandes`)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Demandes en cours</p>
                    <p className="text-2xl font-bold">{overview.demandesEnCours}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer" onClick={() => navigate(`/${agency?.slug}/proprietaire/paiements`)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Paiements récents</p>
                    <p className="text-2xl font-bold">{overview.paiements.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Bell className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Notifications</p>
                    <p className="text-2xl font-bold">{overview.notificationsUnread}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Fin widgets */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Bienvenue, {proprietaireData.prenom} {proprietaireData.nom}</CardTitle>
                <CardDescription>
                  Voici un aperçu de vos biens immobiliers et de leurs statuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Building className="h-8 w-8 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Nombre de biens</p>
                        <p className="text-2xl font-bold">{properties.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Home className="h-8 w-8 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Biens occupés</p>
                        <p className="text-2xl font-bold">
                          {properties.filter(p => p.status === 'OCCUPEE').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-purple-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Biens disponibles</p>
                        <p className="text-2xl font-bold">
                          {properties.filter(p => p.status === 'DISPONIBLE').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mes biens immobiliers</CardTitle>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    Vous n'avez pas encore de biens enregistrés.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {properties.map((property) => (
                      <Card key={property.id}>
                        <CardContent className="p-4">
                          <h3 className="font-bold">{property.title}</h3>
                          <p className="text-sm text-gray-500">{property.address}</p>
                          <div className="mt-2">
                            <span 
                              className={`px-2 py-1 text-xs rounded-full ${
                                property.status === 'DISPONIBLE' || property.is_available === true
                                  ? 'bg-green-100 text-green-800' 
                                  : property.status === 'OCCUPEE' || property.is_available === false
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {property.status || (property.is_available ? 'DISPONIBLE' : 'OCCUPEE')}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              Réf: {property.reference_number}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
