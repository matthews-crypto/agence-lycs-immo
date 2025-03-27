import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAgencyContext } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, Search, Plus, FileText, Download, Calendar, CheckCircle, XCircle, FileUp, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from "sonner";
import { LoadingLayout } from "@/components/LoadingLayout";
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';

interface Lot {
  id: string;
  nom: string;
  created_at: string;
  properties: Property[];
}

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  type_location: string;
  property_status: string;
}

interface AppelDeFond {
  id: string;
  lot_id: string;
  montant: number;
  date_emission: string;
  date_echeance: string;
  statut: string;
  description: string;
  created_at: string;
  document_url?: string;
}

const AppelDeFondPage = () => {
  const [lots, setLots] = useState<Lot[]>([]);
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [appelsDeFond, setAppelsDeFond] = useState<AppelDeFond[]>([]);
  const [filteredAppelsDeFond, setFilteredAppelsDeFond] = useState<AppelDeFond[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAppelDeFond, setNewAppelDeFond] = useState({
    lot_id: "",
    montant: 0,
    date_emission: format(new Date(), 'yyyy-MM-dd'),
    date_echeance: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    description: "",
    statut: "En attente"
  });
  const [activeTab, setActiveTab] = useState("tous");
  const [document, setDocument] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const { agencySlug } = useParams();

  const filterAppelsByTab = useCallback((tab: string) => {
    if (tab === "tous") {
      setFilteredAppelsDeFond(appelsDeFond);
    } else if (tab === "en_attente") {
      setFilteredAppelsDeFond(appelsDeFond.filter(appel => appel.statut === "En attente"));
    } else if (tab === "payes") {
      setFilteredAppelsDeFond(appelsDeFond.filter(appel => appel.statut === "Payé"));
    } else if (tab === "en_retard") {
      const today = new Date();
      setFilteredAppelsDeFond(appelsDeFond.filter(appel => 
        appel.statut === "En attente" && new Date(appel.date_echeance) < today
      ));
    }
  }, [appelsDeFond]);

  const fetchAppelsDeFond = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('appel_de_fond')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching appels de fond:', error);
        toast.error('Erreur lors du chargement des appels de fond');
        return;
      }

      setAppelsDeFond(data || []);
      filterAppelsByTab(activeTab);
    } catch (error) {
      console.error('Error in fetch operation:', error);
      toast.error('Une erreur est survenue');
    }
  }, [activeTab, filterAppelsByTab]);

  useEffect(() => {
    if (agency?.id) {
      fetchLots();
      fetchAppelsDeFond();
    }
  }, [agency?.id]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = lots.filter(lot => 
        lot.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLots(filtered);
    } else {
      setFilteredLots(lots);
    }
  }, [searchTerm, lots]);

  useEffect(() => {
    if (selectedLot) {
      const filtered = appelsDeFond.filter(appel => 
        appel.lot_id === selectedLot.id
      );
      setFilteredAppelsDeFond(filtered);
    } else {
      filterAppelsByTab(activeTab);
    }
  }, [selectedLot, appelsDeFond, activeTab, filterAppelsByTab]);

  const fetchLots = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lot')
        .select(`
          id,
          nom,
          created_at,
          properties:properties(
            id,
            title,
            address,
            price,
            type_location,
            property_status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lots:', error);
        toast.error('Erreur lors du chargement des lots');
        return;
      }

      setLots(data || []);
      setFilteredLots(data || []);
    } catch (error) {
      console.error('Error in fetch operation:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedLot(null);
    filterAppelsByTab(tab);
  };

  const handleLotSelect = (lot: Lot) => {
    setSelectedLot(lot);
  };

  const handleCreateAppelDeFond = async () => {
    if (!newAppelDeFond.lot_id) {
      toast.error('Veuillez sélectionner un lot');
      return;
    }

    if (newAppelDeFond.montant <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }

    try {
      setIsUploading(true);
      let documentUrl = null;

      // Upload document if provided
      if (document) {
        const fileExt = document.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `appels-de-fond/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, document);

        if (uploadError) {
          console.error('Error uploading document:', uploadError);
          toast.error('Erreur lors du téléchargement du document');
          setIsUploading(false);
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        documentUrl = urlData?.publicUrl || null;
      }

      // Create appel de fond with document URL
      const { data, error } = await supabase
        .from('appel_de_fond')
        .insert([
          {
            lot_id: newAppelDeFond.lot_id,
            montant: newAppelDeFond.montant,
            date_emission: newAppelDeFond.date_emission,
            date_echeance: newAppelDeFond.date_echeance,
            description: newAppelDeFond.description,
            statut: newAppelDeFond.statut,
            document_url: documentUrl
          }
        ])
        .select();

      if (error) {
        console.error('Error creating appel de fond:', error);
        toast.error('Erreur lors de la création de l\'appel de fond');
        return;
      }

      toast.success('Appel de fond créé avec succès');
      setIsCreateDialogOpen(false);
      setNewAppelDeFond({
        lot_id: "",
        montant: 0,
        date_emission: format(new Date(), 'yyyy-MM-dd'),
        date_echeance: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
        description: "",
        statut: "En attente"
      });
      setDocument(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchAppelsDeFond();
    } catch (error) {
      console.error('Error in create operation:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateStatus = async (appelId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appel_de_fond')
        .update({ statut: newStatus })
        .eq('id', appelId);

      if (error) {
        console.error('Error updating appel de fond status:', error);
        toast.error('Erreur lors de la mise à jour du statut');
        return;
      }

      toast.success('Statut mis à jour avec succès');
      fetchAppelsDeFond();
    } catch (error) {
      console.error('Error in update operation:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const generatePDF = (appel: AppelDeFond) => {
    const lot = lots.find(l => l.id === appel.lot_id);
    if (!lot) return;

    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(22);
    doc.text('Appel de fond', 105, 20, { align: 'center' });
    
    // Informations du lot
    doc.setFontSize(14);
    doc.text(`Lot: ${lot.nom}`, 20, 40);
    
    // Informations de l'appel de fond
    doc.setFontSize(12);
    doc.text(`Montant: ${appel.montant} FCFA`, 20, 60);
    doc.text(`Date d'émission: ${format(new Date(appel.date_emission), 'dd/MM/yyyy')}`, 20, 70);
    doc.text(`Date d'échéance: ${format(new Date(appel.date_echeance), 'dd/MM/yyyy')}`, 20, 80);
    doc.text(`Statut: ${appel.statut}`, 20, 90);
    
    // Document joint
    if (appel.document_url) {
      doc.text('Document joint:', 20, 100);
      doc.setTextColor(0, 0, 255);
      doc.setFontSize(10);
      doc.textWithLink('Cliquez ici pour voir le document', 20, 110, { url: appel.document_url });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
    }
    
    // Description
    const descriptionYPos = appel.document_url ? 130 : 110;
    if (appel.description) {
      doc.text('Description:', 20, descriptionYPos);
      doc.setFontSize(10);
      const splitDescription = doc.splitTextToSize(appel.description, 170);
      doc.text(splitDescription, 20, descriptionYPos + 10);
    }
    
    // Biens immobiliers du lot
    if (lot.properties && lot.properties.length > 0) {
      const yPos = appel.description 
        ? (appel.document_url ? descriptionYPos + 30 : descriptionYPos + 20) 
        : (appel.document_url ? 130 : 110);
      
      doc.setFontSize(12);
      doc.text('Biens immobiliers concernés:', 20, yPos);
      
      let currentY = yPos + 10;
      lot.properties.forEach((property, index) => {
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${property.title} - ${property.address}`, 25, currentY);
        currentY += 10;
      });
    }
    
    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} sur ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Téléchargement du PDF
    doc.save(`Appel_de_fond_${lot.nom}_${format(new Date(appel.date_emission), 'dd-MM-yyyy')}.pdf`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non définie';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
  };

  const getLotName = (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    return lot ? lot.nom : 'Lot inconnu';
  };

  if (isLoading) {
    return <LoadingLayout />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AgencySidebar />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Gestion des appels de fond</h1>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer un appel de fond
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Liste des lots */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Lots</CardTitle>
                  <CardDescription>Sélectionnez un lot pour voir ses appels de fond</CardDescription>
                  <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un lot..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto">
                  {filteredLots.length > 0 ? (
                    <div className="space-y-2">
                      {filteredLots.map((lot) => (
                        <div
                          key={lot.id}
                          className={`p-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                            selectedLot?.id === lot.id ? 'bg-gray-100 border-l-4 border-primary' : ''
                          }`}
                          onClick={() => handleLotSelect(lot)}
                        >
                          <div className="font-medium">{lot.nom}</div>
                          <div className="text-sm text-gray-500">
                            Créé le {formatDate(lot.created_at)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lot.properties?.length || 0} bien(s)
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Aucun lot trouvé
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Liste des appels de fond */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedLot 
                      ? `Appels de fond pour ${selectedLot.nom}` 
                      : "Tous les appels de fond"}
                  </CardTitle>
                  {!selectedLot && (
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="tous">Tous</TabsTrigger>
                        <TabsTrigger value="en_attente">En attente</TabsTrigger>
                        <TabsTrigger value="payes">Payés</TabsTrigger>
                        <TabsTrigger value="en_retard">En retard</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {!selectedLot && <TableHead>Lot</TableHead>}
                        <TableHead>Montant</TableHead>
                        <TableHead>Date d'émission</TableHead>
                        <TableHead>Date d'échéance</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppelsDeFond.length > 0 ? (
                        filteredAppelsDeFond.map((appel) => (
                          <TableRow key={appel.id}>
                            {!selectedLot && <TableCell>{getLotName(appel.lot_id)}</TableCell>}
                            <TableCell>{appel.montant} FCFA</TableCell>
                            <TableCell>{formatDate(appel.date_emission)}</TableCell>
                            <TableCell>{formatDate(appel.date_echeance)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                appel.statut === 'Payé' 
                                  ? 'bg-green-100 text-green-800' 
                                  : appel.statut === 'En attente' && new Date(appel.date_echeance) < new Date() 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {appel.statut === 'En attente' && new Date(appel.date_echeance) < new Date() 
                                  ? 'En retard' 
                                  : appel.statut}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => generatePDF(appel)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-primary hover:text-primary-dark"
                                  onClick={() => navigate(`/${agency?.slug}/agency/appel-de-fond/${appel.id}`)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                {appel.document_url && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700"
                                    onClick={() => window.open(appel.document_url, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                                {appel.statut === 'En attente' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleUpdateStatus(appel.id, 'Payé')}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {appel.statut === 'Payé' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-yellow-600 hover:text-yellow-700"
                                    onClick={() => handleUpdateStatus(appel.id, 'En attente')}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={selectedLot ? 5 : 6} className="text-center py-4">
                            Aucun appel de fond trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog pour créer un appel de fond */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouvel appel de fond</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer un nouvel appel de fond.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lot">Lot</Label>
              <Select 
                value={newAppelDeFond.lot_id} 
                onValueChange={(value) => setNewAppelDeFond({...newAppelDeFond, lot_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un lot" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="montant">Montant (FCFA)</Label>
              <Input 
                id="montant" 
                type="number" 
                value={newAppelDeFond.montant} 
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  // Limiter le montant à 99,999,999.99 pour éviter le dépassement numérique
                  if (value > 99999999.99) {
                    toast.error("Le montant maximum autorisé est de 99,999,999.99 FCFA");
                    return;
                  }
                  setNewAppelDeFond({...newAppelDeFond, montant: value});
                }}
                max="99999999.99"
                step="0.01"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_emission">Date d'émission</Label>
                <Input 
                  id="date_emission" 
                  type="date" 
                  value={newAppelDeFond.date_emission} 
                  onChange={(e) => setNewAppelDeFond({...newAppelDeFond, date_emission: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_echeance">Date d'échéance</Label>
                <Input 
                  id="date_echeance" 
                  type="date" 
                  value={newAppelDeFond.date_echeance} 
                  onChange={(e) => setNewAppelDeFond({...newAppelDeFond, date_echeance: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={newAppelDeFond.description} 
                onChange={(e) => setNewAppelDeFond({...newAppelDeFond, description: e.target.value})}
                placeholder="Description de l'appel de fond..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">Document (PDF ou image)</Label>
              <Input 
                id="document" 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => setDocument(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateAppelDeFond}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AppelDeFondPage;
