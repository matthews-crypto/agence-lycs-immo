import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Home, Users, Calendar, FileSearch, DollarSign } from "lucide-react";
import { ChangePasswordForm } from "@/components/agency/ChangePasswordForm";

export default function AgencyDashboardPage() {
  const { agency } = useAgencyContext();
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    propertyCount: 0,
    clientCount: 0,
    appointmentCount: 0,
    reservationCount: 0,
    revenue: 0
  });
  const [propertyStatusData, setPropertyStatusData] = useState([]);
  const [monthlyViewsData, setMonthlyViewsData] = useState([]);

  useEffect(() => {
    if (agency?.must_change_password) {
      setMustChangePassword(true);
    }
  }, [agency]);

  useEffect(() => {
    if (agency?.id && !mustChangePassword) {
      fetchDashboardData();
    }
  }, [agency?.id, mustChangePassword]);

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch property counts by status
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('property_status, view_count, price')
        .eq('agency_id', agency.id);

      if (propertiesError) throw propertiesError;

      // Calculate total revenue (for sold properties)
      const soldProperties = properties.filter(p => p.property_status === 'VENDUE');
      const totalRevenue = soldProperties.reduce((sum, prop) => sum + (Number(prop.price) || 0), 0);

      // Count properties by status
      const statusCounts = properties.reduce((acc, property) => {
        const status = property.property_status || 'UNKNOWN';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Format for chart
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name: formatStatus(name),
        value: value
      }));

      setPropertyStatusData(statusData);
      
      // Fetch counts for cards
      const [
        { count: propertyCount }, 
        { count: clientCount }, 
        { count: appointmentCount },
        { count: reservationCount }
      ] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id)
      ]);

      setStats({
        propertyCount: propertyCount || 0,
        clientCount: clientCount || 0,
        appointmentCount: appointmentCount || 0,
        reservationCount: reservationCount || 0,
        revenue: totalRevenue
      });

      // Generate simulated monthly views data (since we don't have historical view data)
      // In real application, this would come from a proper analytics table
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
      const viewsData = monthNames.map(name => {
        // Use real view count totals divided across months for a realistic simulation
        const totalViews = properties.reduce((sum, prop) => sum + (prop.view_count || 0), 0);
        const viewScale = Math.random() * 0.5 + 0.75; // Random factor between 0.75 and 1.25
        return {
          name,
          views: Math.round((totalViews / 6) * viewScale)
        };
      });

      setMonthlyViewsData(viewsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    const statusMap = {
      'DISPONIBLE': 'Disponible',
      'VENDUE': 'Vendu',
      'RESERVE': 'Réservé',
      'EN_LOCATION': 'En location',
      'UNKNOWN': 'Inconnu'
    };
    return statusMap[status] || status;
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
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-12 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  <StatCard 
                    title="Biens immobiliers" 
                    value={stats.propertyCount} 
                    icon={Home} 
                    color={agency?.primary_color || '#3b82f6'} 
                  />
                  <StatCard 
                    title="Clients" 
                    value={stats.clientCount} 
                    icon={Users} 
                    color={agency?.primary_color || '#3b82f6'} 
                  />
                  <StatCard 
                    title="Rendez-vous" 
                    value={stats.appointmentCount} 
                    icon={Calendar} 
                    color={agency?.primary_color || '#3b82f6'} 
                  />
                  <StatCard 
                    title="Opportunités" 
                    value={stats.reservationCount} 
                    icon={FileSearch} 
                    color={agency?.primary_color || '#3b82f6'} 
                  />
                  <StatCard 
                    title="Chiffre d'affaires" 
                    value={`${(stats.revenue / 1000000).toFixed(1)}M FCFA`} 
                    icon={DollarSign} 
                    color={agency?.primary_color || '#3b82f6'} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Monthly Views Chart */}
                  <Card className="p-6">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-lg font-semibold">Vues mensuelles</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyViewsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="views" fill={agency?.primary_color || '#2563eb'} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Property Status Chart */}
                  <Card className="p-6">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-lg font-semibold">Statut des propriétés</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={propertyStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill={agency?.primary_color}
                              paddingAngle={5}
                              dataKey="value"
                              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {propertyStatusData.map((entry, index) => (
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
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{typeof value === 'string' ? value : value.toLocaleString()}</p>
        </div>
        <div className="rounded-full p-2" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-6 w-6" style={{ color: color }} />
        </div>
      </CardContent>
    </Card>
  );
}
