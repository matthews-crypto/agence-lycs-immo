import React, { useState, useEffect, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Banknote, Download, Mail, CheckCircle, AlertCircle, FileText, ExternalLink, XCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from "sonner";
import { LoadingLayout } from "@/components/LoadingLayout";
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';

// URL de l'API d'envoi d'emails déployée sur Render
const API_URL = 'https://agence-lycs-mails.onrender.com'; // À remplacer par l'URL de votre API déployée

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

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  has_paid?: boolean; // Champ local pour suivre les paiements
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

const AppelDeFondDetailPage = () => {
  const [appelDeFond, setAppelDeFond] = useState<AppelDeFond | null>(null);
  const [lot, setLot] = useState<Lot | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [montantParClient, setMontantParClient] = useState<number>(0);

  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const { agencySlug, id: appelId } = useParams();

  const fetchAppelDeFond = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Starting fetch for appel de fond ID:", appelId);
      
      // Récupérer l'appel de fond
      const { data: appelData, error: appelError } = await supabase
        .from('appel_de_fond')
        .select('*')
        .eq('id', appelId)
        .single();

      console.log("Appel de fond data:", appelData, "Error:", appelError);

      if (appelError) {
        console.error('Error fetching appel de fond:', appelError);
        toast.error('Erreur lors du chargement de l\'appel de fond');
        return;
      }

      setAppelDeFond(appelData);

      // Récupérer le lot et ses propriétés
      const { data: lotData, error: lotError } = await supabase
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
        .eq('id', appelData.lot_id)
        .single();

      if (lotError) {
        console.error('Error fetching lot:', lotError);
        toast.error('Erreur lors du chargement du lot');
        return;
      }

      setLot(lotData);

      // Calculer le montant par client basé sur le nombre de propriétés
      if (lotData.properties && lotData.properties.length > 0) {
        setMontantParClient(appelData.montant / lotData.properties.length);
      }

      // Récupérer les clients associés aux propriétés via la table locations
      if (lotData.properties && lotData.properties.length > 0) {
        const propertyIds = lotData.properties.map(property => property.id);
        
        // Pour chaque propriété, récupérer la dernière location active
        const clientsMap = new Map(); // Map pour stocker le dernier client par propriété
        
        for (const propertyId of propertyIds) {
          // Récupérer la dernière location pour cette propriété
          const { data: locationData, error: locationError } = await supabase
            .from('locations')
            .select(`
              id,
              property_id,
              client_id,
              created_at,
              clients:client_id(
                id,
                first_name,
                last_name,
                email,
                phone_number
              )
            `)
            .eq('property_id', propertyId)
            .eq('statut', 'EN COURS')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (locationError) {
            console.error(`Error fetching location for property ${propertyId}:`, locationError);
            continue;
          }
          
          // Si une location a été trouvée, ajouter le client à la map
          if (locationData && locationData.length > 0 && locationData[0].clients) {
            clientsMap.set(propertyId, locationData[0].clients);
          }
        }
        
        console.log("Clients map:", clientsMap);
        
        // Convertir la map en tableau de clients
        const clientsList: Client[] = Array.from(clientsMap.values()).map(client => ({
          id: client.id,
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          phone_number: client.phone_number,
          has_paid: false
        }));
        
        setClients(clientsList);
      }
    } catch (error) {
      console.error('Error in fetch operation:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [appelId]);

  useEffect(() => {
    if (agency?.id && appelId) {
      console.log("Fetching appel de fond with ID:", appelId);
      fetchAppelDeFond();
    } else {
      console.log("Missing data:", { agencyId: agency?.id, appelId });
    }
  }, [agency?.id, appelId, fetchAppelDeFond]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!appelDeFond) return;

    try {
      const { error } = await supabase
        .from('appel_de_fond')
        .update({ statut: newStatus })
        .eq('id', appelDeFond.id);

      if (error) {
        console.error('Error updating appel de fond status:', error);
        toast.error('Erreur lors de la mise à jour du statut');
        return;
      }

      toast.success('Statut mis à jour avec succès');
      setAppelDeFond({ ...appelDeFond, statut: newStatus });
    } catch (error) {
      console.error('Error in update operation:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const handleClientPaymentToggle = (clientId: string) => {
    const updatedClients = clients.map(client => 
      client.id === clientId 
        ? { ...client, has_paid: !client.has_paid } 
        : client
    );
    
    setClients(updatedClients);
    
    // Vérifier si tous les clients ont payé
    const allPaid = updatedClients.every(client => client.has_paid);
    
    // Mettre à jour le statut de l'appel de fond si tous les clients ont payé
    if (allPaid && appelDeFond?.statut !== 'Payé') {
      handleUpdateStatus('Payé');
    } else if (!allPaid && appelDeFond?.statut === 'Payé') {
      handleUpdateStatus('En attente');
    }
  };

  const handleOpenEmailDialog = (allClients: boolean = false) => {
    if (allClients) {
      setSelectedClientIds(clients.map(client => client.id));
    } else {
      setSelectedClientIds([]);
    }
    
    // Préremplir le sujet et le contenu de l'email
    if (lot) {
      setEmailSubject(`Appel de fond pour le lot ${lot.nom}`);
      setEmailContent(`Cher(e) propriétaire,

Nous vous informons qu'un appel de fond a été émis pour le lot "${lot.nom}" dont vous êtes propriétaire.

Montant total: ${appelDeFond?.montant} FCFA
Montant par propriétaire: ${montantParClient.toFixed(2)} FCFA
Date d'échéance: ${appelDeFond ? format(new Date(appelDeFond.date_echeance), 'dd/MM/yyyy') : ''}

Merci de bien vouloir procéder au règlement avant la date d'échéance.

Cordialement,
L'équipe de gestion`);
    }
    
    setIsEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (selectedClientIds.length === 0 || !emailSubject || !emailContent) {
      toast.error('Veuillez remplir tous les champs et sélectionner au moins un destinataire');
      return;
    }

    try {
      // Afficher un toast de chargement
      const loadingToast = toast.loading('Envoi des emails en cours...');
      
      // Récupérer les informations des clients sélectionnés
      const selectedClients = clients.filter(client => selectedClientIds.includes(client.id));
      
      // Préparer les données pour l'API
      const recipients = selectedClients.map(client => ({
        email: client.email,
        first_name: client.first_name,
        last_name: client.last_name,
        montant: formatMontant(montantParClient) + ' FCFA'
      }));

      // Personnaliser le contenu HTML avec des variables
      const htmlContent = emailContent
        .replace(/\n/g, '<br>')
        .replace(/{{MONTANT}}/g, formatMontant(montantParClient) + ' FCFA')
        .replace(/{{DATE_ECHEANCE}}/g, appelDeFond ? format(new Date(appelDeFond.date_echeance), 'dd/MM/yyyy') : '')
        .replace(/{{LOT_NOM}}/g, lot?.nom || '');

      // Envoyer les emails
      const response = await fetch(`${API_URL}/api/send-bulk-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          subject: emailSubject,
          html: htmlContent,
          from: 'Agence LYCS Immo <noreply@lycsimmo.com>'
        }),
      });

      // Fermer le toast de chargement
      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success(`${result.results.length} email(s) envoyé(s) avec succès`);
        setIsEmailDialogOpen(false);
      } else {
        toast.error(`Erreur lors de l'envoi des emails: ${result.summary}`);
        console.error('Erreurs détaillées:', result.errors);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des emails:', error);
      toast.error('Une erreur est survenue lors de l\'envoi des emails');
    }
  };

  const generatePDF = () => {
    if (!appelDeFond || !lot) return;

    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(22);
    doc.text('Détails de l\'appel de fond', 105, 20, { align: 'center' });
    
    // Informations du lot
    doc.setFontSize(14);
    doc.text(`Lot: ${lot.nom}`, 20, 40);
    
    // Informations de l'appel de fond
    doc.setFontSize(12);
    doc.text(`Montant total: ${appelDeFond.montant} FCFA`, 20, 60);
    doc.text(`Montant par propriétaire: ${montantParClient.toFixed(2)} FCFA`, 20, 70);
    doc.text(`Date d'émission: ${format(new Date(appelDeFond.date_emission), 'dd/MM/yyyy')}`, 20, 80);
    doc.text(`Date d'échéance: ${format(new Date(appelDeFond.date_echeance), 'dd/MM/yyyy')}`, 20, 90);
    doc.text(`Statut: ${appelDeFond.statut}`, 20, 100);
    
    // Document joint
    if (appelDeFond.document_url) {
      doc.text('Document joint:', 20, 110);
      doc.setTextColor(0, 0, 255);
      doc.setFontSize(10);
      doc.textWithLink('Cliquez ici pour voir le document', 20, 120, { url: appelDeFond.document_url });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
    }
    
    // Description
    const descriptionYPos = appelDeFond.document_url ? 140 : 120;
    if (appelDeFond.description) {
      doc.text('Description:', 20, descriptionYPos);
      doc.setFontSize(10);
      const splitDescription = doc.splitTextToSize(appelDeFond.description, 170);
      doc.text(splitDescription, 20, descriptionYPos + 10);
    }
    
    // Liste des propriétaires
    const clientsYPos = appelDeFond.description 
      ? descriptionYPos + 30 
      : descriptionYPos + 10;
    
    if (clients.length > 0) {
      doc.setFontSize(12);
      doc.text('Propriétaires concernés:', 20, clientsYPos);
      
      let currentY = clientsYPos + 10;
      clients.forEach((client, index) => {
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${client.first_name} ${client.last_name} - ${client.email}`, 25, currentY);
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
    doc.save(`Details_Appel_de_fond_${lot.nom}_${format(new Date(appelDeFond.date_emission), 'dd-MM-yyyy')}.pdf`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non définie';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant);
  };

  if (isLoading) {
    return <LoadingLayout />;
  }

  if (!appelDeFond || !lot) {
    return (
      <SidebarProvider>
        <div className="flex h-screen">
          <AgencySidebar />
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto py-6 px-4 max-w-full">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>
                  L'appel de fond demandé n'existe pas ou n'a pas pu être chargé.
                </AlertDescription>
              </Alert>
              <Button 
                className="mt-4"
                onClick={() => navigate(`/${agencySlug}/agency/appel-de-fond`)}
              >
                Retour à la liste des appels de fond
              </Button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AgencySidebar />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4 max-w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Button 
                  variant="outline" 
                  className="mb-2"
                  onClick={() => navigate(`/${agencySlug}/agency/appel-de-fond`)}
                >
                  Retour à la liste
                </Button>
                <h1 className="text-3xl font-bold">Détails de l'appel de fond</h1>
                <p className="text-gray-500">Lot: {lot.nom}</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={generatePDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PDF
                </Button>
                <Button onClick={() => handleOpenEmailDialog(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer à tous
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-6">
              {/* Informations de l'appel de fond */}
              <Card className="md:col-span-2 lg:col-span-3 xl:col-span-3">
                <CardHeader>
                  <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Montant total</p>
                      <p className="text-lg font-semibold">{formatMontant(appelDeFond.montant)} FCFA</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Montant par propriétaire</p>
                      <p className="text-lg font-semibold">{formatMontant(montantParClient)} FCFA</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date d'émission</p>
                      <p>{formatDate(appelDeFond.date_emission)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date d'échéance</p>
                      <p>{formatDate(appelDeFond.date_echeance)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Statut</p>
                      <Badge className={`
                        ${appelDeFond.statut === 'Payé' 
                          ? 'bg-green-100 text-green-800' 
                          : appelDeFond.statut === 'En attente' && new Date(appelDeFond.date_echeance) < new Date() 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      `}>
                        {appelDeFond.statut === 'En attente' && new Date(appelDeFond.date_echeance) < new Date() 
                          ? 'En retard' 
                          : appelDeFond.statut}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nombre de propriétaires</p>
                      <p>{clients.length}</p>
                    </div>
                  </div>

                  {appelDeFond.description && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500">Description</p>
                      <p className="mt-1">{appelDeFond.description}</p>
                    </div>
                  )}

                  {appelDeFond.document_url && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500">Document joint</p>
                      <Button 
                        variant="outline" 
                        className="mt-1"
                        onClick={() => window.open(appelDeFond.document_url, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Voir le document
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="flex space-x-2">
                    {appelDeFond.statut === 'En attente' ? (
                      <Button 
                        variant="outline" 
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleUpdateStatus('Payé')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marquer comme payé
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={() => handleUpdateStatus('En attente')}
                      >
                        Marquer comme en attente
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>

              {/* Statistiques */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Propriétaires ayant payé</p>
                      <p className="text-2xl font-bold">
                        {clients.filter(client => client.has_paid).length} / {clients.length}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${clients.length > 0 ? (clients.filter(client => client.has_paid).length / clients.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Montant collecté (estimation)</p>
                      <p className="text-2xl font-bold">
                        {formatMontant(clients.filter(client => client.has_paid).length * montantParClient)} FCFA
                      </p>
                      <p className="text-sm text-gray-500">
                        sur {formatMontant(appelDeFond.montant)} FCFA
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Jours restants</p>
                      {new Date(appelDeFond.date_echeance) > new Date() ? (
                        <p className="text-2xl font-bold">
                          {Math.ceil((new Date(appelDeFond.date_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                        </p>
                      ) : (
                        <p className="text-2xl font-bold text-red-600">
                          En retard de {Math.ceil((new Date().getTime() - new Date(appelDeFond.date_echeance).getTime()) / (1000 * 60 * 60 * 24))} jours
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Liste des propriétaires */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Propriétaires concernés</CardTitle>
                <CardDescription>
                  Liste des propriétaires concernés par cet appel de fond
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">Téléphone</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.length > 0 ? (
                        clients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.first_name} {client.last_name}</TableCell>
                            <TableCell className="hidden md:table-cell">{client.email}</TableCell>
                            <TableCell className="hidden lg:table-cell">{client.phone_number}</TableCell>
                            <TableCell>{formatMontant(montantParClient)} FCFA</TableCell>
                            <TableCell>
                              <Badge className={client.has_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {client.has_paid ? 'Payé' : 'En attente'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedClientIds([client.id]);
                                    handleOpenEmailDialog();
                                  }}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className={client.has_paid ? 'text-yellow-600' : 'text-green-600'}
                                  onClick={() => handleClientPaymentToggle(client.id)}
                                >
                                  <span className="hidden sm:inline">{client.has_paid ? 'Annuler paiement' : 'Marquer comme payé'}</span>
                                  {client.has_paid ? <XCircle className="h-4 w-4 sm:hidden" /> : <CheckCircle className="h-4 w-4 sm:hidden" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            Aucun propriétaire trouvé pour ce lot
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog pour envoyer des emails */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Envoyer un email</DialogTitle>
            <DialogDescription>
              {selectedClientIds.length > 0 
                ? `Envoi d'email à ${selectedClientIds.length} propriétaire(s)` 
                : 'Veuillez sélectionner au moins un propriétaire'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Sujet
              </label>
              <Input 
                id="subject" 
                value={emailSubject} 
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Contenu
              </label>
              <Textarea 
                id="content" 
                value={emailContent} 
                onChange={(e) => setEmailContent(e.target.value)}
                rows={10}
              />
              <p className="text-xs text-gray-500">
                Variables disponibles: {{NOM}}, {{PRENOM}}, {{MONTANT}}, {{DATE_ECHEANCE}}, {{LOT_NOM}}
              </p>
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setEmailContent(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0066FF; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 10px 20px; background-color: #0066FF; color: white; text-decoration: none; border-radius: 4px; }
    .info-box { background-color: #e6f7ff; border-left: 4px solid #0066FF; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Appel de Fond - Lot {{LOT_NOM}}</h1>
    </div>
    <div class="content">
      <p>Cher(e) {{NOM}},</p>
      
      <p>Nous vous informons qu'un appel de fond a été émis pour le lot "{{LOT_NOM}}" dont vous êtes propriétaire.</p>
      
      <div class="info-box">
        <p><strong>Montant total:</strong> ${appelDeFond?.montant} FCFA</p>
        <p><strong>Montant à payer:</strong> {{MONTANT}}</p>
        <p><strong>Date d'échéance:</strong> {{DATE_ECHEANCE}}</p>
      </div>
      
      <p>Merci de bien vouloir procéder au règlement avant la date d'échéance.</p>
      
      <p>Cordialement,<br>L'équipe de gestion</p>
    </div>
    <div class="footer">
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`);
                }}
              >
                Utiliser le modèle HTML
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={selectedClientIds.length === 0 || !emailSubject || !emailContent}
            >
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AppelDeFondDetailPage;
