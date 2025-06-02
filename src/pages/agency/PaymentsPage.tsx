import { useEffect, useState, useMemo } from "react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { format, parse, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Calendar as CalendarIcon, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type PaymentMethod = 'wave' | 'espece' | 'carte_bancaire' | 'orange_money';

type PaymentDetails = {
  id: string;
  location_id: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  months_covered: number;
  created_at: string;
};

type PaymentWithDetails = PaymentDetails & {
  client: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
  };
  property: {
    id: string;
    title: string;
    reference_number: string;
    price: number;
    type_location: string | null;
  };
  months_paid: string[];
};

type FilterOptions = {
  month: string | null;
  paymentMethod: PaymentMethod | 'all';
  startDate: Date | null;
  endDate: Date | null;
};

export default function PaymentsPage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  
  // États pour les paiements et le chargement
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<PaymentWithDetails | null>(null);
  const [isPaymentDetailsOpen, setIsPaymentDetailsOpen] = useState(false);
  
  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    month: null,
    paymentMethod: 'all',
    startDate: null,
    endDate: null
  });
  
  // États pour l'exportation CSV
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date | null>(null);
  const [exportEndDate, setExportEndDate] = useState<Date | null>(null);

  // Fonction pour récupérer les paiements depuis la base de données
  const fetchPayments = async () => {
    if (!agency?.id) return;
    
    setIsLoading(true);
    try {
      // Récupérer les détails de paiement avec les informations du client et de la propriété
      const { data, error } = await supabase
        .from('payment_details')
        .select(`
          id,
          location_id,
          payment_date,
          amount,
          payment_method,
          months_covered,
          created_at,
          locations!inner (
            client:client_id (id, first_name, last_name, email, phone_number),
            property:property_id (id, title, reference_number, price, type_location)
          )
        `)
        .order('payment_date', { ascending: false });

      if (error) {
        throw error;
      }

      // Transformer les données pour correspondre au type PaymentWithDetails
      const paymentsData = data.map((payment: any) => {
        // Générer un mois formaté à partir de la date de paiement (format MM/YYYY)
        const paymentDate = new Date(payment.payment_date);
        const paymentMonth = `${String(paymentDate.getMonth() + 1).padStart(2, '0')}/${paymentDate.getFullYear()}`;
        
        return {
          id: payment.id,
          location_id: payment.location_id,
          payment_date: payment.payment_date,
          amount: payment.amount,
          payment_method: payment.payment_method,
          months_covered: payment.months_covered,
          created_at: payment.created_at,
          client: payment.locations?.client,
          property: payment.locations?.property,
          // Créer un tableau avec le mois du paiement
          months_paid: [paymentMonth]
        };
      });

      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Erreur lors du chargement des paiements");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les paiements au chargement de la page
  useEffect(() => {
    fetchPayments();
  }, [agency?.id]);

  // Filtrer les paiements en fonction des critères de recherche et de filtrage
  const filteredPayments = useMemo(() => {
    if (!payments.length) return [];

    return payments.filter(payment => {
      // Filtrer par terme de recherche (nom du client ou référence du bien)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const clientName = `${payment.client?.first_name || ''} ${payment.client?.last_name || ''}`.toLowerCase();
        const propertyRef = payment.property?.reference_number?.toLowerCase() || '';
        const propertyTitle = payment.property?.title?.toLowerCase() || '';
        
        if (!clientName.includes(searchLower) && 
            !propertyRef.includes(searchLower) &&
            !propertyTitle.includes(searchLower)) {
          return false;
        }
      }
      
      // Filtrer par méthode de paiement
      if (filters.paymentMethod !== 'all' && payment.payment_method !== filters.paymentMethod) {
        return false;
      }
      
      // Filtrer par mois spécifique
      if (filters.month && filters.month !== 'all' && payment.months_paid) {
        const hasPaidForMonth = payment.months_paid.includes(filters.month);
        if (!hasPaidForMonth) {
          return false;
        }
      }
      
      // Filtrer par plage de dates
      if (filters.startDate && filters.endDate) {
        const paymentDate = new Date(payment.payment_date);
        if (!isWithinInterval(paymentDate, { 
          start: startOfMonth(filters.startDate), 
          end: endOfMonth(filters.endDate) 
        })) {
          return false;
        }
      }
      
      return true;
    });
  }, [payments, searchTerm, filters]);

  // Fonction pour ouvrir le dialogue de détails de paiement
  const handlePaymentDetailsClick = (payment: PaymentWithDetails) => {
    setPaymentDetails(payment);
    setIsPaymentDetailsOpen(true);
  };

  // Fonction pour formater la méthode de paiement
  const formatPaymentMethod = (method: PaymentMethod) => {
    switch (method) {
      case 'wave': return 'Wave';
      case 'espece': return 'Espèces';
      case 'carte_bancaire': return 'Carte bancaire';
      case 'orange_money': return 'Orange Money';
      default: return method;
    }
  };

  // Fonction pour exporter les paiements en CSV
  const exportToCSV = () => {
    if (!filteredPayments.length) {
      toast.error("Aucun paiement à exporter");
      return;
    }

    // Filtrer les paiements par date si nécessaire
    let paymentsToExport = filteredPayments;
    if (exportStartDate && exportEndDate) {
      paymentsToExport = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return isWithinInterval(paymentDate, { 
          start: startOfMonth(exportStartDate), 
          end: endOfMonth(exportEndDate) 
        });
      });
    }

    // Créer le contenu CSV
    const headers = ["Client", "Bien", "Référence", "Montant", "Méthode de paiement", "Date de paiement", "Mois couverts", "Nombre de mois"];
    const csvContent = [
      headers.join(","),
      ...paymentsToExport.map(payment => [
        `"${payment.client?.first_name || ''} ${payment.client?.last_name || ''}"`,
        `"${payment.property?.title || ''}"`,
        `"${payment.property?.reference_number || ''}"`,
        payment.amount,
        `"${formatPaymentMethod(payment.payment_method)}"`,
        format(new Date(payment.payment_date), "dd/MM/yyyy"),
        `"${payment.months_paid?.join(', ') || ''}"`,
        payment.months_covered || 1,
      ].join(","))
    ].join("\n");

    // Créer un blob et un lien pour télécharger le fichier
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `paiements_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Fermer le dialogue d'exportation
    setIsExportDialogOpen(false);
    toast.success("Export CSV réussi");
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <AgencySidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Historique des paiements</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsExportDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter en CSV
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Filtres</CardTitle>
              <CardDescription>Filtrez les paiements par différents critères</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/5 p-4 rounded-lg border mb-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary/70" />
                    <Input
                      type="search"
                      placeholder="Rechercher un client, un bien..."
                      className="w-full sm:w-[300px] pl-8 border-primary/20 focus-visible:ring-primary/30"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-row gap-2 flex-wrap">
                    <Select
                      value={filters.month || 'all'}
                      onValueChange={(value) => setFilters({ ...filters, month: value === 'all' ? null : value })}
                    >
                      <SelectTrigger className="w-[180px] border-primary/20 focus:ring-primary/30">
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary/70" />
                        <SelectValue placeholder="Mois" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les mois</SelectItem>
                        {Array.from(new Set(payments.flatMap(p => p.months_paid || []))).sort().map((month) => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.paymentMethod}
                      onValueChange={(value) => setFilters({ ...filters, paymentMethod: value as PaymentMethod | 'all' })}
                    >
                      <SelectTrigger className="w-[180px] border-primary/20 focus:ring-primary/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4 text-primary/70"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                        <SelectValue placeholder="Méthode de paiement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les méthodes</SelectItem>
                        <SelectItem value="wave">Wave</SelectItem>
                        <SelectItem value="espece">Espèces</SelectItem>
                        <SelectItem value="carte_bancaire">Carte bancaire</SelectItem>
                        <SelectItem value="orange_money">Orange Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsExportDialogOpen(true)} 
                      className="bg-white hover:bg-primary/5 hover:text-primary border-primary/20"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exporter
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {filteredPayments.length} paiement{filteredPayments.length !== 1 ? 's' : ''} trouvé{filteredPayments.length !== 1 ? 's' : ''}
                  </div>
                  {(searchTerm || filters.month || filters.paymentMethod !== 'all') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setSearchTerm('');
                        setFilters({
                          month: null,
                          paymentMethod: 'all',
                          startDate: null,
                          endDate: null
                        });
                      }}
                      className="text-xs h-8 px-2 text-muted-foreground hover:text-primary"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
              <CardDescription>
                {filteredPayments.length} paiement(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <p>Chargement des paiements...</p>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun paiement trouvé</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Bien</TableHead>
                        <TableHead className="font-semibold">Référence</TableHead>
                        <TableHead className="font-semibold">Montant</TableHead>
                        <TableHead className="font-semibold">Méthode</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Mois</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment, index) => (
                        <TableRow 
                          key={payment.id} 
                          className={index % 2 === 0 ? 'bg-white' : 'bg-muted/20 hover:bg-muted/30'}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                {payment.client?.first_name?.[0] || ''}{payment.client?.last_name?.[0] || ''}
                              </div>
                              <div>
                                <div className="font-medium">{payment.client?.first_name} {payment.client?.last_name}</div>
                                <div className="text-xs text-muted-foreground">{payment.client?.phone_number}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium truncate max-w-[150px]" title={payment.property?.title || ''}>
                              {payment.property?.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-mono bg-muted/30 px-2 py-1 rounded inline-block">
                              {payment.property?.reference_number}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-primary">
                              {payment.amount.toLocaleString()} FCFA
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`
                                ${payment.payment_method === 'wave' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                ${payment.payment_method === 'espece' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                ${payment.payment_method === 'carte_bancaire' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                ${payment.payment_method === 'orange_money' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                              `}
                            >
                              {formatPaymentMethod(payment.payment_method)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(payment.payment_date), "dd/MM/yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {payment.months_paid?.map((month, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-primary/5 border-primary/20">
                                  {month}
                                </Badge>
                              ))}
                              {payment.months_covered > 1 && (
                                <Badge variant="secondary" className="text-xs ml-1">
                                  +{payment.months_covered - 1}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-primary/10 hover:text-primary"
                              onClick={() => handlePaymentDetailsClick(payment)}
                            >
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Dialogue de détails de paiement */}
      <Dialog open={isPaymentDetailsOpen} onOpenChange={setIsPaymentDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Détails du paiement
            </DialogTitle>
            <DialogDescription>
              Informations détaillées sur le paiement sélectionné
            </DialogDescription>
          </DialogHeader>
          {paymentDetails && (
            <div className="space-y-6">
              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold">
                    {paymentDetails.client?.first_name?.[0] || ''}{paymentDetails.client?.last_name?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{paymentDetails.client?.first_name} {paymentDetails.client?.last_name}</h3>
                    <p className="text-sm text-muted-foreground">{paymentDetails.client?.phone_number}</p>
                  </div>
                </div>
                
                <div className="mt-3 bg-white p-3 rounded-md border">
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Bien immobilier</h4>
                  <p className="font-medium">{paymentDetails.property?.title}</p>
                  <div className="mt-1 inline-block text-sm font-mono bg-muted/30 px-2 py-1 rounded">
                    {paymentDetails.property?.reference_number}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-muted/10 p-3 rounded-md">
                  <Label className="text-sm text-muted-foreground mb-1 block">Montant</Label>
                  <p className="font-semibold text-xl text-primary">{paymentDetails.amount.toLocaleString()} FCFA</p>
                </div>
                <div className="bg-muted/10 p-3 rounded-md">
                  <Label className="text-sm text-muted-foreground mb-1 block">Méthode de paiement</Label>
                  <Badge 
                    variant="outline" 
                    className={`
                      text-base font-medium px-3 py-1
                      ${paymentDetails.payment_method === 'wave' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                      ${paymentDetails.payment_method === 'espece' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      ${paymentDetails.payment_method === 'carte_bancaire' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                      ${paymentDetails.payment_method === 'orange_money' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                    `}
                  >
                    {formatPaymentMethod(paymentDetails.payment_method)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-muted/10 p-3 rounded-md">
                  <Label className="text-sm text-muted-foreground mb-1 block">Date de paiement</Label>
                  <p className="font-medium">{format(new Date(paymentDetails.payment_date), "dd MMMM yyyy", { locale: fr })}</p>
                </div>
                <div className="bg-muted/10 p-3 rounded-md">
                  <Label className="text-sm text-muted-foreground mb-1 block">
                    Mois couverts ({paymentDetails.months_covered || 1})
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {paymentDetails.months_paid?.map((month, index) => (
                      <Badge key={index} variant="outline" className="bg-primary/5 border-primary/20">
                        {month}
                      </Badge>
                    ))}
                    {paymentDetails.months_covered > 1 && (
                      <Badge variant="secondary" className="ml-1">
                        +{paymentDetails.months_covered - 1} mois
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="default" onClick={() => setIsPaymentDetailsOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue d'exportation CSV */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Exporter les paiements
            </DialogTitle>
            <DialogDescription>
              Sélectionnez une période pour l'exportation (optionnel)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="bg-muted/10 p-4 rounded-lg border border-muted">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Période d'exportation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="export-start-date" className="text-xs mb-1 block">Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="export-start-date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-white border-muted-foreground/20"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {exportStartDate ? (
                          format(exportStartDate, "MMMM yyyy", { locale: fr })
                        ) : (
                          <span className="text-muted-foreground">Sélectionner</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={exportStartDate}
                        onSelect={setExportStartDate}
                        initialFocus
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="export-end-date" className="text-xs mb-1 block">Date de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="export-end-date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-white border-muted-foreground/20"
                        disabled={!exportStartDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {exportEndDate ? (
                          format(exportEndDate, "MMMM yyyy", { locale: fr })
                        ) : (
                          <span className="text-muted-foreground">Sélectionner</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={exportEndDate}
                        onSelect={setExportEndDate}
                        initialFocus
                        disabled={(date) => date > new Date() || (exportStartDate && date < exportStartDate)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/5 p-3 rounded-md border border-dashed border-muted">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                <p>Le fichier CSV contiendra tous les paiements filtrés dans la période sélectionnée.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}