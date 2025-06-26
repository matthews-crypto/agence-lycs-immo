import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgencyContext } from '@/contexts/AgencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Banknote, Home, PercentCircle, FileText, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const cardColors = [
  'bg-blue-50 text-blue-800',
  'bg-green-50 text-green-800',
  'bg-purple-50 text-purple-800',
  'bg-orange-50 text-orange-800',
  'bg-pink-50 text-pink-800',
  'bg-yellow-50 text-yellow-800',
];

const CoproDashboardPage: React.FC = () => {
  const { agency, isLoading } = useAgencyContext();
  const navigate = useNavigate();
  const agenceId = agency?.id;

  // Stats requêtes Supabase
  const {
    data: appelsDeFond,
    isLoading: loadingAppelsDeFond
  } = useQuery({
    queryKey: ['appels_de_fond', agenceId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('appels_de_fond').select('*').eq('agence_id', agenceId!);
      return data || [];
    },
    enabled: !!agenceId
  });

  const {
    data: lots,
    isLoading: loadingLots
  } = useQuery({
    queryKey: ['lots', agenceId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('lots').select('*').eq('agence_id', agenceId!);
      return data || [];
    },
    enabled: !!agenceId
  });

  const {
    data: proprietaires,
    isLoading: loadingProprietaires
  } = useQuery({
    queryKey: ['proprietaire', agenceId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('proprietaire').select('*').eq('agenceID', agenceId!);
      return data || [];
    },
    enabled: !!agenceId
  });

  const {
    data: demandes,
    isLoading: loadingDemandes
  } = useQuery({
    queryKey: ['demandes', agenceId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('demandes').select('*').eq('agence_id', agenceId!);
      return data || [];
    },
    enabled: !!agenceId
  });

  const {
    data: paiements,
    isLoading: loadingPaiements
  } = useQuery({
    queryKey: ['paiements', agenceId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('paiements').select('*').eq('agence_id', agenceId!);
      return data || [];
    },
    enabled: !!agenceId
  });

  const {
    data: appelsFondProprietaires,
    isLoading: loadingAppelsFondProp
  } = useQuery({
    queryKey: ['appels_de_fond_proprietaires', agenceId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('appels_de_fond_proprietaires').select('*').eq('agence_id', agenceId!);
      return data || [];
    },
    enabled: !!agenceId
  });

  // Calculs statistiques
  const nbAppelsEnCours = useMemo(() => appelsDeFond?.filter(a => a.statut === 'en_cours').length || 0, [appelsDeFond]);
  const nbAppelsTermines = useMemo(() => appelsDeFond?.filter(a => a.statut === 'termine').length || 0, [appelsDeFond]);
  const nbLots = lots?.length || 0;
  const nbProprietaires = proprietaires?.length || 0;
  const nbDemandesTraitees = demandes?.filter(d => d.statut === 'traitee').length || 0;
  const nbDemandesNonTraitees = demandes?.filter(d => d.statut === 'non_traitee').length || 0;

  // Taux de recouvrement sur appels en cours
  const tauxRecouvrement = useMemo(() => {
    if (!appelsFondProprietaires) return 0;
    const enCoursIds = (appelsDeFond || []).filter(a => a.statut === 'en_cours').map(a => a.id);
    const filtered = appelsFondProprietaires.filter((a: any) => enCoursIds.includes(a.appel_de_fond_id));
    const totalDu = filtered.reduce((sum: number, a: any) => sum + Number(a.montant_du || 0), 0);
    const totalPaye = filtered.filter((a: any) => a.statut_paiement === 'paye').reduce((sum: number, a: any) => sum + Number(a.montant_du || 0), 0);
    if (totalDu === 0) return 0;
    return Math.round((totalPaye / totalDu) * 100);
  }, [appelsFondProprietaires, appelsDeFond]);

  // Paiements par type
  const paiementsByType = useMemo(() => {
    if (!paiements) return { appel_de_fond: 0, travaux_entretien: 0 };
    return {
      appel_de_fond: paiements.filter((p: any) => p.type_paiement === 'appel_de_fond').length,
      travaux_entretien: paiements.filter((p: any) => p.type_paiement === 'travaux_entretien').length,
    };
  }, [paiements]);

  // Loading global
  const isStatsLoading = isLoading || loadingAppelsDeFond || loadingLots || loadingProprietaires || loadingDemandes || loadingPaiements || loadingAppelsFondProp;

  // Navigation handlers
  const go = (path: string) => navigate(path);

  if (isStatsLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement…</div>;
  }
  if (!agency) {
    return <div className="flex items-center justify-center h-screen">Agence non trouvée</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8 animate-fade-in-up">
        <Users className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Gestion Copropriété</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 animate-fade-in-up delay-100">
        {/* Appels de fond */}
        <Card className={`cursor-pointer group hover:shadow-xl transition ${cardColors[1]}`} onClick={() => go(`/${agency.slug}/copro/appels-de-fond`)}>
          <CardHeader className="flex items-center gap-2">
            <Banknote className="h-6 w-6" />
            <CardTitle className="text-lg">Appels de fond</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-2xl">{nbAppelsEnCours + nbAppelsTermines}</span>
              <span className="text-xs text-gray-600">En cours : {nbAppelsEnCours} / Terminés : {nbAppelsTermines}</span>
            </div>
          </CardContent>
        </Card>
        {/* Lots */}
        <Card className={`cursor-pointer group hover:shadow-xl transition ${cardColors[0]}`} onClick={() => go(`/${agency.slug}/copro/lots`)}>
          <CardHeader className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <CardTitle className="text-lg">Lots</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-bold text-2xl">{nbLots}</span>
          </CardContent>
        </Card>
        {/* Propriétaires */}
        <Card className={`cursor-pointer group hover:shadow-xl transition ${cardColors[2]}`} onClick={() => go(`/${agency.slug}/copro/proprietaires`)}>
          <CardHeader className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <CardTitle className="text-lg">Propriétaires</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-bold text-2xl">{nbProprietaires}</span>
          </CardContent>
        </Card>
        {/* Taux de recouvrement */}
        <Card className={`cursor-pointer group hover:shadow-xl transition ${cardColors[4]}`} onClick={() => go(`/${agency.slug}/copro/appels-de-fond`)}>
          <CardHeader className="flex items-center gap-2">
            <PercentCircle className="h-6 w-6" />
            <CardTitle className="text-lg">Taux de recouvrement</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-bold text-2xl">{tauxRecouvrement}%</span>
            <span className="text-xs text-gray-600">(appels en cours)</span>
          </CardContent>
        </Card>
        {/* Demandes */}
        <Card className={`cursor-pointer group hover:shadow-xl transition ${cardColors[3]}`} onClick={() => go(`/${agency.slug}/copro/demandes`)}>
          <CardHeader className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <CardTitle className="text-lg">Demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-2xl">{nbDemandesTraitees + nbDemandesNonTraitees}</span>
              <span className="text-xs text-gray-600">Traitées : {nbDemandesTraitees} / Non traitées : {nbDemandesNonTraitees}</span>
            </div>
          </CardContent>
        </Card>
        {/* Paiements par type */}
        <Card className={`cursor-pointer group hover:shadow-xl transition ${cardColors[5]}`} onClick={() => go(`/${agency.slug}/copro/paiements`)}>
          <CardHeader className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            <CardTitle className="text-lg">Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-2xl">{paiementsByType.appel_de_fond + paiementsByType.travaux_entretien}</span>
              <span className="text-xs text-gray-600">Appels de fond : {paiementsByType.appel_de_fond} / Travaux entretien : {paiementsByType.travaux_entretien}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(32px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.7s cubic-bezier(.4,0,.2,1) both;
        }
        .delay-100 { animation-delay: .1s; }
        .delay-200 { animation-delay: .2s; }
        .delay-300 { animation-delay: .3s; }
      `}</style>
    </div>
  );
};

export default CoproDashboardPage;
