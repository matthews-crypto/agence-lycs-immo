import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Home, Users, Calendar, FileSearch, DollarSign, CheckCircle, XCircle, Building, Banknote, AlertCircle } from "lucide-react";
import { ChangePasswordForm } from "@/components/agency/ChangePasswordForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AgencyDashboardPage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
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
  const [opportunitiesData, setOpportunitiesData] = useState({
    won: [],
    lost: [],
    wonCount: 0,
    lostCount: 0
  });
  const [paymentsData, setPaymentsData] = useState({
    paid: [],
    unpaid: [],
    paidCount: 0,
    unpaidCount: 0
  });
  const [propertiesData, setPropertiesData] = useState({
    available: [],
    occupied: [],
    availableCount: 0,
    occupiedCount: 0
  });

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
        .select('id, title, property_status, view_count, price, property_offer_type, type_location')
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

      // Fetch opportunities (reservations)
      await fetchOpportunities();

      // Fetch payments (locations)
      await fetchPayments();

      // Fetch properties by availability
      await fetchPropertiesByAvailability(properties);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id, 
          reservation_number, 
          client_phone, 
          status, 
          type, 
          created_at,
          properties(id, title, price)
        `)
        .eq('agency_id', agency.id);

      if (error) throw error;

      const won = reservations.filter(r => r.status === 'Fermée Gagnée');
      const lost = reservations.filter(r => r.status === 'Fermée Perdu');

      setOpportunitiesData({
        won,
        lost,
        wonCount: won.length,
        lostCount: lost.length
      });
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data: locations, error } = await supabase
        .from('locations')
        .select(`
          id, 
          statut, 
          paiement,
          rental_start_date,
          rental_end_date,
          clients(id, first_name, last_name, phone_number),
          properties(id, title, price, type_location)
        `)
        .eq('statut', 'EN COURS');

      if (error) throw error;

      const paid = locations.filter(l => l.paiement === true);
      const unpaid = locations.filter(l => l.paiement === false || l.paiement === null);

      setPaymentsData({
        paid,
        unpaid,
        paidCount: paid.length,
        unpaidCount: unpaid.length
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchPropertiesByAvailability = async (properties) => {
    if (!properties) return;
    
    try {
      const available = properties.filter(p => p.property_status === 'DISPONIBLE');
      const occupied = properties.filter(p => p.property_status === 'OCCUPEE' || p.property_status === 'VENDUE');

      setPropertiesData({
        available,
        occupied,
        availableCount: available.length,
        occupiedCount: occupied.length
      });
    } catch (error) {
      console.error("Error processing properties by availability:", error);
    }
  };

  const formatStatus = (status) => {
    const statusMap = {
      'DISPONIBLE': 'Disponible',
      'VENDUE': 'Vendu',
      'RESERVE': 'Réservé',
      'EN_LOCATION': 'En location',
      'OCCUPEE': 'Occupée',
      'UNKNOWN': 'Inconnu'
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const handleViewPropertyDetails = (propertyId) => {
    navigate(`/${agency?.slug}/properties/${propertyId}`);
  };

  const handleViewClientDetails = (clientId) => {
    navigate(`/${agency?.slug}/agency/clients/${clientId}`);
  };

  const handleViewReservationDetails = (reservationNumber) => {
    navigate(`/${agency?.slug}/agency/prospection?reservation=${reservationNumber}`);
  };

  const handleViewLocationDetails = (locationId) => {
    navigate(`/${agency?.slug}/agency/planning/${locationId}`);
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
          <div className="max-w-7xl mx-auto">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
                    title="Opportunités" 
                    value={stats.reservationCount} 
                    icon={FileSearch} 
                    color={agency?.primary_color || '#3b82f6'} 
                  />
                </div>

                <Tabs defaultValue="opportunities" className="mb-8">
                  <TabsList className="mb-4">
                    <TabsTrigger value="opportunities">Opportunités</TabsTrigger>
                    <TabsTrigger value="payments">Paiements</TabsTrigger>
                    <TabsTrigger value="properties">Biens immobiliers</TabsTrigger>
                    <TabsTrigger value="charts">Graphiques</TabsTrigger>
                  </TabsList>

                  {/* Opportunités Tab */}
                  <TabsContent value="opportunities">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Opportunités gagnées */}
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Opportunités gagnées</CardTitle>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                          <CardDescription>Total: {opportunitiesData.wonCount}</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[400px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Numéro</TableHead>
                                <TableHead>Bien</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {opportunitiesData.won.length > 0 ? (
                                opportunitiesData.won.map((opportunity) => (
                                  <TableRow key={opportunity.id}>
                                    <TableCell>{opportunity.reservation_number}</TableCell>
                                    <TableCell>{opportunity.properties?.title || 'Non disponible'}</TableCell>
                                    <TableCell>{formatDate(opportunity.created_at)}</TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleViewReservationDetails(opportunity.reservation_number)}
                                      >
                                        Détails
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4">Aucune opportunité gagnée</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      {/* Opportunités perdues */}
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Opportunités perdues</CardTitle>
                            <XCircle className="h-5 w-5 text-red-500" />
                          </div>
                          <CardDescription>Total: {opportunitiesData.lostCount}</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[400px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Numéro</TableHead>
                                <TableHead>Bien</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {opportunitiesData.lost.length > 0 ? (
                                opportunitiesData.lost.map((opportunity) => (
                                  <TableRow key={opportunity.id}>
                                    <TableCell>{opportunity.reservation_number}</TableCell>
                                    <TableCell>{opportunity.properties?.title || 'Non disponible'}</TableCell>
                                    <TableCell>{formatDate(opportunity.created_at)}</TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleViewReservationDetails(opportunity.reservation_number)}
                                      >
                                        Détails
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4">Aucune opportunité perdue</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Paiements Tab */}
                  <TabsContent value="payments">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Locations payées */}
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Locations payées</CardTitle>
                            <Banknote className="h-5 w-5 text-green-500" />
                          </div>
                          <CardDescription>Total: {paymentsData.paidCount}</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[400px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Bien</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Période</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paymentsData.paid.length > 0 ? (
                                paymentsData.paid.map((location) => (
                                  <TableRow key={location.id}>
                                    <TableCell>{location.properties?.title || 'Non disponible'}</TableCell>
                                    <TableCell>
                                      {location.clients ? 
                                        `${location.clients.first_name} ${location.clients.last_name}` : 
                                        'Non disponible'}
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(location.rental_start_date)} - {formatDate(location.rental_end_date)}
                                    </TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleViewLocationDetails(location.id)}
                                      >
                                        Détails
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4">Aucune location payée</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      {/* Locations non payées */}
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Locations non payées</CardTitle>
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          </div>
                          <CardDescription>Total: {paymentsData.unpaidCount}</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[400px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Bien</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Période</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paymentsData.unpaid.length > 0 ? (
                                paymentsData.unpaid.map((location) => (
                                  <TableRow key={location.id}>
                                    <TableCell>{location.properties?.title || 'Non disponible'}</TableCell>
                                    <TableCell>
                                      {location.clients ? 
                                        `${location.clients.first_name} ${location.clients.last_name}` : 
                                        'Non disponible'}
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(location.rental_start_date)} - {formatDate(location.rental_end_date)}
                                    </TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleViewLocationDetails(location.id)}
                                      >
                                        Détails
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4">Aucune location non payée</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Biens immobiliers Tab */}
                  <TabsContent value="properties">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Offres disponibles */}
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Offres disponibles</CardTitle>
                            <Building className="h-5 w-5 text-blue-500" />
                          </div>
                          <CardDescription>Total: {propertiesData.availableCount}</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[400px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead>Prix</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {propertiesData.available.length > 0 ? (
                                propertiesData.available.map((property) => (
                                  <TableRow key={property.id}>
                                    <TableCell>{property.title}</TableCell>
                                    <TableCell>
                                      {property.price.toLocaleString()} FCFA
                                      {property.property_offer_type === 'LOCATION' && property.type_location === 'longue_duree' && ' /mois'}
                                      {property.property_offer_type === 'LOCATION' && property.type_location === 'courte_duree' && ' /jour'}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {property.property_offer_type === 'VENTE' ? 'Vente' : 'Location'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleViewPropertyDetails(property.id)}
                                      >
                                        Détails
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4">Aucune offre disponible</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      {/* Offres occupées */}
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Offres occupées</CardTitle>
                            <Home className="h-5 w-5 text-gray-500" />
                          </div>
                          <CardDescription>Total: {propertiesData.occupiedCount}</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[400px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead>Prix</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {propertiesData.occupied.length > 0 ? (
                                propertiesData.occupied.map((property) => (
                                  <TableRow key={property.id}>
                                    <TableCell>{property.title}</TableCell>
                                    <TableCell>
                                      {property.price.toLocaleString()} FCFA
                                      {property.property_offer_type === 'LOCATION' && property.type_location === 'longue_duree' && ' /mois'}
                                      {property.property_offer_type === 'LOCATION' && property.type_location === 'courte_duree' && ' /jour'}
                                    </TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant={property.property_status === 'OCCUPEE' ? 'secondary' : 'destructive'}
                                      >
                                        {formatStatus(property.property_status)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleViewPropertyDetails(property.id)}
                                      >
                                        Détails
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4">Aucune offre occupée</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Graphiques Tab */}
                  <TabsContent value="charts">
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
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Opportunities Chart */}
                      <Card className="p-6">
                        <CardHeader className="p-0 pb-4">
                          <CardTitle className="text-lg font-semibold">Opportunités</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Gagnées', value: opportunitiesData.wonCount },
                                    { name: 'Perdues', value: opportunitiesData.lostCount }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  fill={agency?.primary_color}
                                  paddingAngle={5}
                                  dataKey="value"
                                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  <Cell fill="#22c55e" />
                                  <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Payments Chart */}
                      <Card className="p-6">
                        <CardHeader className="p-0 pb-4">
                          <CardTitle className="text-lg font-semibold">Paiements</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Payées', value: paymentsData.paidCount },
                                    { name: 'Non payées', value: paymentsData.unpaidCount }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  fill={agency?.primary_color}
                                  paddingAngle={5}
                                  dataKey="value"
                                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  <Cell fill="#22c55e" />
                                  <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
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
