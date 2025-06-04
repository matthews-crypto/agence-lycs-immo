import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgencyContext } from '@/contexts/AgencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Banknote, Home } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1', '#f59e42', '#10b981', '#f43f5e'];

const lotsData = [
  { name: 'Appartements', value: 18 },
  { name: 'Parkings', value: 9 },
  { name: 'Commerces', value: 3 },
];

const appelsFondData = [
  { mois: 'Jan', appels: 7 },
  { mois: 'Fév', appels: 8 },
  { mois: 'Mar', appels: 6 },
  { mois: 'Avr', appels: 10 },
  { mois: 'Mai', appels: 12 },
  { mois: 'Juin', appels: 9 },
];

const CoproDashboardPage: React.FC = () => {
  const { agency, isLoading } = useAgencyContext();
  const navigate = useNavigate();

  // Vérification des droits d'accès
  useEffect(() => {
    if (!isLoading && agency && agency.isCopro !== true) {
      // Rediriger vers la page services si l'agence n'a pas accès à la gestion de copropriété
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
        <Users className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Gestion Copropriété</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 animate-fade-in-up delay-100">
        <Card className="cursor-pointer group hover:shadow-xl transition">
          <CardHeader className="flex items-center gap-2">
            <Home className="h-6 w-6 text-sidebar-primary" />
            <CardTitle className="text-lg">Lots</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Gérez les lots de copropriété et leurs caractéristiques.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer group hover:shadow-xl transition">
          <CardHeader className="flex items-center gap-2">
            <Banknote className="h-6 w-6 text-sidebar-primary" />
            <CardTitle className="text-lg">Appel de fond</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Créez et gérez les appels de fonds pour les copropriétaires.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer group hover:shadow-xl transition">
          <CardHeader className="flex items-center gap-2">
            <Users className="h-6 w-6 text-sidebar-primary" />
            <CardTitle className="text-lg">Copropriétaires</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Gérez les informations des copropriétaires et leurs contacts.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Graphique camembert répartition des lots */}
        <Card className="p-4 animate-fade-in-up delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-sidebar-primary" />
              Répartition des lots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={lotsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {lotsData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Graphique barres appels de fond */}
        <Card className="p-4 animate-fade-in-up delay-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-sidebar-primary" />
              Appels de fonds par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={appelsFondData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appels" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
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

export default CoproDashboardPage;
