
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Home, Users, Calendar, FileSearch } from "lucide-react";

export default function AgentDashboardPage() {
  const { agency } = useAgencyContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    propertyCount: 0,
    clientCount: 0,
    appointmentCount: 0,
    reservationCount: 0
  });
  const [propertyStatusData, setPropertyStatusData] = useState([]);
  const [monthlyAppointmentsData, setMonthlyAppointmentsData] = useState([]);

  useEffect(() => {
    if (agency?.id) {
      fetchDashboardData();
    }
  }, [agency?.id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch property counts by status
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('property_status')
        .eq('agency_id', agency.id);

      if (propertiesError) throw propertiesError;

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
        reservationCount: reservationCount || 0
      });

      // Generate monthly data for appointments (last 6 months)
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const currentDate = new Date();
      const monthlyData = [];

      // Get the current month and 5 previous months
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = monthNames[month.getMonth()];
        const monthNumber = month.getMonth() + 1;
        const year = month.getFullYear();
        
        // Fetch appointment counts for this month
        const startDate = `${year}-${String(monthNumber).padStart(2, '0')}-01`;
        const endDate = new Date(year, monthNumber, 0);
        const endDateStr = `${year}-${String(monthNumber).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        
        const { count } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('agency_id', agency.id)
          .gte('appointment_time', startDate)
          .lte('appointment_time', endDateStr);
        
        monthlyData.push({
          name: monthName,
          appointments: count || 0
        });
      }

      setMonthlyAppointmentsData(monthlyData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    const statusMap = {
      'DISPONIBLE': 'Disponible',
      'VENDU': 'Vendu',
      'RESERVE': 'Réservé',
      'EN_LOCATION': 'En location',
      'UNKNOWN': 'Inconnu'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Monthly Appointments Chart */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-semibold">Rendez-vous mensuels</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyAppointmentsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="appointments" fill={agency?.primary_color || '#3b82f6'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Property Status Chart */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-semibold">Statut des biens</CardTitle>
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
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="rounded-full p-2" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-6 w-6" style={{ color: color }} />
        </div>
      </CardContent>
    </Card>
  );
}
