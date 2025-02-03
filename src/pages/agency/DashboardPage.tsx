import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChangePasswordForm } from "@/components/agency/ChangePasswordForm";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PROPERTY_STATUS_DATA = [
  { name: 'Disponible', value: 35 },
  { name: 'Vendu', value: 25 },
  { name: 'En attente', value: 15 },
  { name: 'Réservé', value: 25 },
];

const MONTHLY_VIEWS_DATA = [
  { name: 'Jan', views: 400 },
  { name: 'Fév', views: 300 },
  { name: 'Mar', views: 600 },
  { name: 'Avr', views: 800 },
  { name: 'Mai', views: 700 },
  { name: 'Juin', views: 900 },
];

export default function AgencyDashboardPage() {
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const { agency } = useAgencyContext();

  useEffect(() => {
    if (agency?.must_change_password) {
      setMustChangePassword(true);
    }
  }, [agency]);

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
  };

  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ChangePasswordForm onPasswordChanged={handlePasswordChanged} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">Tableau de bord de l'agence</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Graphique des vues mensuelles */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Vues mensuelles</h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MONTHLY_VIEWS_DATA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" fill={agency?.primary_color || '#2563eb'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Graphique des statuts des propriétés */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Statut des propriétés</h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PROPERTY_STATUS_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill={agency?.primary_color}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {PROPERTY_STATUS_DATA.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index % 2 === 0 ? agency?.primary_color : agency?.secondary_color} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}