import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgencyContext } from '@/contexts/AgencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Calendar, Receipt, Users, Briefcase } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1', '#f59e42', '#10b981', '#f43f5e'];

const occupationData = [
  { name: 'Occupé', value: 28 },
  { name: 'Libre', value: 6 },
];

const paiementsData = [
  { mois: 'Jan', paiements: 12 },
  { mois: 'Fév', paiements: 15 },
  { mois: 'Mar', paiements: 11 },
  { mois: 'Avr', paiements: 18 },
  { mois: 'Mai', paiements: 19 },
  { mois: 'Juin', paiements: 16 },
];

const locationsVentesData = [
  { type: 'Locations', value: 44 },
  { type: 'Ventes', value: 13 },
];

const LocativeDashboardPage: React.FC = () => {
  const { agency, isLoading } = useAgencyContext();
  const navigate = useNavigate();

  // Vérification des droits d'accès
  useEffect(() => {
    if (!isLoading && agency && agency.isLocative !== true) {
      // Rediriger vers la page services si l'agence n'a pas accès à la gestion locative
      navigate(`/${agency.slug}/agency/services`);
    }
  }, [agency, isLoading, navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!agency) {
    return <div className="flex items-center justify-center h-screen">Agence non trouvée</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8 animate-fade-in-up">
        <Home className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Gestion Locative</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10 animate-fade-in-up delay-100">
        <Card className="cursor-pointer group hover:shadow-xl transition">
          <CardHeader className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-sidebar-primary" />
            <CardTitle className="text-lg">Planning location</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Visualisez et gérez le planning de vos locations courte et longue durée.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer group hover:shadow-xl transition">
          <CardHeader className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-sidebar-primary" />
            <CardTitle className="text-lg">Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Suivez les paiements des loyers et gérez les retards de paiement.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer group hover:shadow-xl transition">
          <CardHeader className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-sidebar-primary" />
            <CardTitle className="text-lg">Ventes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Consultez les ventes réalisées et leur statut.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer group hover:shadow-xl transition">
          <CardHeader className="flex items-center gap-2">
            <Users className="h-6 w-6 text-sidebar-primary" />
            <CardTitle className="text-lg">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Gérez vos clients locataires et leurs informations.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer group hover:shadow-xl transition">
          <CardHeader className="flex items-center gap-2">
            <Home className="h-6 w-6 text-sidebar-primary" />
            <CardTitle className="text-lg">Propriétaires</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Gérez vos propriétaires et leurs lots en location.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Graphique camembert occupation */}
        <Card className="p-4 animate-fade-in-up delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-sidebar-primary" />
              Occupation du parc locatif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={occupationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {occupationData.map((entry, idx) => (
                    <Cell key={`cell-occ-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Graphique barres paiements */}
        <Card className="p-4 animate-fade-in-up delay-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-sidebar-primary" />
              Paiements par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={paiementsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="paiements" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* Graphique rapport locations vs ventes */}
      <div className="mt-8 animate-fade-in-up delay-400">
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-sidebar-primary" />
              Rapport Locations vs Ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={locationsVentesData} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={70} label>
                  {locationsVentesData.map((entry, idx) => (
                    <Cell key={`cell-lv-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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

export default LocativeDashboardPage;
