import React, { useState, useEffect, useCallback } from 'react';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { useParams, useNavigate } from 'react-router-dom';

import { supabase } from '@/integrations/supabase/client';
import { useAgencyContext } from '@/contexts/AgencyContext';
import { AgencySidebar } from '@/components/agency/AgencySidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LoadingLayout } from '@/components/LoadingLayout';
import {
  ArrowLeft,
  Paperclip,
  FileText,
  Activity,
  Info,
  Home,
  User,
  Settings2,
  Save,
  Files,
  ExternalLink,
  Loader2,
  RefreshCw,
  FileSignature
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  reference_number: string;
  surface_area?: number;
  bedrooms?: number;
  // Ajoutez d'autres champs de propriété pertinents ici si nécessaire
}

interface Reservation {
  id: string;
  type: string; // 'VENTE', 'LOCATION', etc.
  status: string; // Current status of the opportunity
  client_phone?: string;
  note_rv?: string | null;
  offer_document_url?: string | null;
  promise_document_url?: string | null;
  property_id: string; // Foreign key to the 'properties' table
  property?: Property; // The related property object, fetched via join
  created_at?: string;
  updated_at?: string;
  // Add any other fields from the 'reservations' table that might be needed
}

const SALE_STATUSES = [
  'En attente',
  'Qualification',
  'Visite programmée',
  'Négociation',
  'Promesse de vente',
  'Vente conclue',
  'Annulée' // Ajout d'un statut Annulée pour plus de flexibilité
];

// Stepper component for sales process
const SaleStepper = ({ statuses, currentStatus }: { statuses: string[]; currentStatus: string }) => {
  const currentIdx = statuses.indexOf(currentStatus);
  return (
    <div className="flex items-center justify-between w-full py-2">
      {statuses.map((status, idx) => {
        const isActive = idx === currentIdx;
        const isCompleted = idx < currentIdx;
        return (
          <div key={status} className="flex items-center flex-1">
            <div className={`flex flex-col items-center text-xs font-medium ${isActive ? 'text-green-600' : isCompleted ? 'text-gray-400' : 'text-muted-foreground'}`}> 
              <div className={`rounded-full w-6 h-6 flex items-center justify-center mb-1 border-2 ${isActive ? 'bg-green-600 text-white border-green-600' : isCompleted ? 'bg-gray-300 border-gray-300' : 'bg-white border-gray-300'}`}
                style={{ transition: 'all 0.2s' }}>
                {isCompleted ? <span>&#10003;</span> : idx + 1}
              </div>
              <span className={`text-center ${isActive ? 'font-bold' : ''}`}>{status}</span>
            </div>
            {idx < statuses.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const SaleOpportunityDetailPage = () => {
  const { agencySlug, opportunityId } = useParams<{ agencySlug: string; opportunityId: string }>();
  const navigate = useNavigate();
  const { agency, isLoading: agencyLoading } = useAgencyContext();

  const [opportunity, setOpportunity] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<string>('');
const [appointmentDate, setAppointmentDate] = useState<string | null>(null);
const [showAppointmentModal, setShowAppointmentModal] = useState(false);
const [appointmentInput, setAppointmentInput] = useState<string>("");
  const [visitNote, setVisitNote] = useState<string>('');
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUploadingOffer, setIsUploadingOffer] = useState(false);
  const [isGeneratingPromise, setIsGeneratingPromise] = useState(false);
  // ... autres états pour les champs modifiables et les documents

  const handleOfferFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      toast.info('Aucun fichier sélectionné.');
      return;
    }
    const file = event.target.files[0];
    if (!opportunityId) return;

    setIsUploadingOffer(true);
    try {
      const fileName = `offers/${opportunityId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('negotiation-files') // As per memory a2fe323b-df00-418f-923e-98bd4e15e2ca
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('negotiation-files')
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        throw new Error("Impossible d'obtenir l'URL publique du fichier.");
      }

      const offerDocumentUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('reservations')
        .update({ offer_document_url: offerDocumentUrl } as Partial<Reservation>)
        .eq('id', opportunityId);

      if (updateError) {
        throw updateError;
      }

      toast.success('Document d\'offre téléversé et sauvegardé!');
      if (opportunityId) fetchOpportunityDetails(opportunityId); // Refresh data

    } catch (error: unknown) {
      console.error('Error uploading offer document:', error);
      let errorMessage = 'Une erreur inconnue est survenue lors du téléversement.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(`Erreur lors du téléversement: ${errorMessage}`);
    } finally {
      setIsUploadingOffer(false);
      if (event.target) event.target.value = ''; // Clear file input
    }
  };

  const handleGenerateAndUploadPromise = async () => {
    if (!opportunity || !opportunityId) return;

    setIsGeneratingPromise(true);
    try {
      // TODO: Implement PDF generation logic here
      // 1. Gather data for the promise document (opportunity details, client, property)
      // 2. Generate PDF using a library like jsPDF or a server-side function
      // const pdfBlob = await generatePromisePdf(opportunity);
      // For now, let's assume we have a placeholder Blob
      const placeholderContent = "Contenu du PDF de la promesse de vente pour " + opportunity.property?.title;
      const pdfBlob = new Blob([placeholderContent], { type: 'application/pdf' });
      const fileName = `sales-promises/${opportunityId}/${Date.now()}_promesse.pdf`;

      // Upload to Supabase Storage (bucket 'sales-promises' as per memory a2fe323b-df00-418f-923e-98bd4e15e2ca)
      const { error: uploadError } = await supabase.storage
        .from('sales-promises') 
        .upload(fileName, pdfBlob);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('sales-promises')
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        throw new Error("Impossible d'obtenir l'URL publique de la promesse.");
      }

      const promiseDocumentUrl = publicUrlData.publicUrl;

      // Update reservation with the new promise document URL
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ promise_document_url: promiseDocumentUrl } as Partial<Reservation>)
        .eq('id', opportunityId);

      if (updateError) {
        throw updateError;
      }

      toast.success('Promesse de vente générée, téléversée et sauvegardée!');
      if (opportunityId) fetchOpportunityDetails(opportunityId); // Refresh data

    } catch (error: unknown) {
      console.error('Error generating/uploading sales promise:', error);
      let errorMessage = 'Une erreur inconnue est survenue.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(`Erreur (promesse): ${errorMessage}`);
    } finally {
      setIsGeneratingPromise(false);
    }
  };

  const handleSaveVisitNote = async () => {
    if (!opportunity || !opportunityId) return;
    setIsSavingNote(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ note_rv: visitNote } as Partial<Reservation>)
        .eq('id', opportunityId);

      if (error) {
        toast.error('Erreur lors de la sauvegarde de la note: ' + error.message);
      } else {
        toast.success('Note de visite sauvegardée avec succès!');
        // Optionally re-fetch or update local state if needed, though not strictly necessary for note_rv
      }
    } catch (err) {
      toast.error('Une erreur inattendue est survenue.');
      console.error('Unexpected error saving note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const fetchOpportunityDetails = useCallback(async (id: string) => {
    setIsLoading(true);
    const { data, error }: PostgrestSingleResponse<Reservation> = await supabase
      .from('reservations')
      .select(`id, type, status, client_phone, note_rv, offer_document_url, promise_document_url, property:property_id(id, title, reference_number, surface_area, bedrooms)`) // Ensuring this line is clean
      .eq('id', id)
      .eq('type', 'VENTE') // S'assurer que c'est bien une vente
      .single();

    if (error) {
      toast.error("Erreur lors de la récupération de l'opportunité.");
      console.error(error);
      navigate(`/${agencySlug}/agency/prospection`);
      return;
    }
    if (data) {
      setOpportunity(data as Reservation);
      setCurrentStatus(data.status);
      setVisitNote(data.note_rv ?? '');
      // Accepts both string and Date, always store as ISO string
      if (data.appointment_date) {
        let dt = data.appointment_date;
        if (typeof dt === 'string' && !Number.isNaN(Date.parse(dt))) {
          setAppointmentDate(new Date(dt).toISOString());
        } else if (dt instanceof Date) {
          setAppointmentDate(dt.toISOString());
        } else {
          setAppointmentDate(null);
        }
      } else {
        setAppointmentDate(null);
      }
    }
    setIsLoading(false);
  }, [agencySlug, navigate]); // supabase et les setters sont stables, opportunityId est passé en argument

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunityDetails(opportunityId);
    }
  }, [opportunityId, fetchOpportunityDetails]);

  // Original fetchOpportunityDetails (sera remplacé par celui dans useCallback)
  // const fetchOpportunityDetails = async (id: string) => {


  const handleStatusChange = async (newStatus: string) => {
    if (!opportunity || !opportunityId) return;
    // If moving to 'Visite programmée', require appointment date
    if (newStatus === 'Visite programmée') {
      setShowAppointmentModal(true);
      return;
    }
    setCurrentStatus(newStatus);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus } as Partial<Reservation>)
        .eq('id', opportunityId);
      if (error) {
        toast.error('Erreur lors de la mise à jour du statut: ' + error.message);
      } else {
        toast.success(`Statut mis à jour à: ${newStatus}`);
        fetchOpportunityDetails(opportunityId); // Refresh data from DB
      }
    } catch (err) {
      toast.error('Erreur inattendue lors de la mise à jour du statut.');
      console.error(err);
    }
  };

  // Handler for confirming appointment date
  const handleConfirmAppointment = async () => {
    if (!appointmentInput || !opportunityId) {
      toast.error('Veuillez saisir une date de rendez-vous valide.');
      return;
    }
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'Visite programmée', appointment_date: appointmentInput } as Partial<Reservation>)
        .eq('id', opportunityId);
      if (error) {
        toast.error('Erreur lors de la sauvegarde de la date de rendez-vous: ' + error.message);
      } else {
        toast.success('Date de rendez-vous enregistrée et statut mis à jour.');
        setShowAppointmentModal(false);
        setAppointmentDate(appointmentInput);
        setCurrentStatus('Visite programmée');
        fetchOpportunityDetails(opportunityId);
      }
    } catch (err) {
      toast.error('Erreur inattendue lors de la sauvegarde du rendez-vous.');
      console.error(err);
    }
  };

  // Handler for editing appointment date
  const handleEditAppointment = () => {
    setAppointmentInput(appointmentDate || "");
    setShowAppointmentModal(true);
  };

  const handleOfferUpload = async () => {
    if (!opportunity || !offerFile) return;
    // TODO: Implémenter l'upload de l'offre d'achat (bucket 'negotiation-files')
    // Mettre à jour `offer_document_url` dans la table `reservations`
    toast.success('Offre d\'achat téléversée.');
  };
  
  // TODO: Ajouter les fonctions pour générer la promesse de vente, le contrat de vente, et gérer la conclusion de la vente.

  if (isLoading || agencyLoading) {
    return <LoadingLayout />;
  }

  if (!opportunity) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          <AgencySidebar />
          <div className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center">
            <p className="text-xl text-muted-foreground">Opportunité non trouvée ou ce n'est pas une vente.</p>
            <Button onClick={() => navigate(`/${agencySlug}/agency/prospection`)} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la prospection
            </Button>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AgencySidebar />
        <main className="flex-1 p-4 md:p-8 space-y-6">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-4 flex items-center space-x-2" aria-label="Breadcrumb">
            <a href={`/${agencySlug}/agency/prospection`} className="hover:underline">Accueil</a>
            <span>/</span>
            <a href={`/${agencySlug}/agency/prospection`} className="hover:underline">Prospection</a>
            <span>/</span>
            <span>Opportunités de vente</span>
            <span>/</span>
            <span className="font-semibold">Détail #{opportunity?.id?.substring(0, 8) || ''}</span>
          </nav>
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => navigate(`/${agencySlug}/agency/prospection`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la prospection
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Détail de l'Opportunité de Vente</h1>
            <div className="w-auto" /> {/* Spacer */} 
          </div>

          {/* Status Workflow Teaser - To be implemented fully later */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/> Progression de l'Opportunité</CardTitle>
            </CardHeader>
            <CardContent>
              <SaleStepper statuses={SALE_STATUSES} currentStatus={currentStatus} />
            </CardContent>
            {/* Appointment Modal */}
            {showAppointmentModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px]">
                  <h2 className="text-lg font-semibold mb-4">Choisir la date de rendez-vous</h2>
                  <input
                    type="datetime-local"
                    value={appointmentInput}
                    onChange={e => setAppointmentInput(e.target.value)}
                    className="border rounded px-2 py-1 w-full mb-4"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => setShowAppointmentModal(false)}>Annuler</Button>
                    <Button onClick={handleConfirmAppointment}>Confirmer</Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* General Opportunity Info */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Informations Générales</CardTitle>
                <CardDescription>Opportunité #{opportunity.id.substring(0, 8)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Type:</span>
                  <Badge variant="outline">{opportunity.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Statut Actuel:</span>
                  <Badge variant={currentStatus === 'Vente conclue' ? 'success' : 'default'}>{currentStatus}</Badge>
                </div>
                {/* Add more general details if available, e.g., creation date */}
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center"><Home className="mr-2 h-5 w-5 text-primary" />Détails du Bien</CardTitle>
                <CardDescription>{opportunity.property?.title || 'Non spécifié'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Référence:</span>
                  <span>{opportunity.property?.reference_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Surface:</span>
                  <span>{opportunity.property?.surface_area ? `${opportunity.property.surface_area} m²` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Chambres:</span>
                  <span>{opportunity.property?.bedrooms ?? 'N/A'}</span>
                </div>
                {/* TODO: Add link to full property page if exists */}
              </CardContent>
            </Card>

            {/* Client Details */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-primary" />Informations Client</CardTitle>
                {/* TODO: Fetch and display client name if possible */}
                <CardDescription>Contact: {opportunity.client_phone}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Téléphone:</span>
                  <span>{opportunity.client_phone}</span>
                </div>
                {/* TODO: Add email, etc. once client details are fetched */}
              </CardContent>
            </Card>
          </div>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary" />Actions sur l'Opportunité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="statusChange" className="text-sm font-medium block mb-1">Changer le statut</label>
                <Select value={currentStatus} onValueChange={handleStatusChange} name="statusChange">
                  <SelectTrigger id="statusChange">
                    <SelectValue placeholder="Sélectionner un nouveau statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALE_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Appointment Date Section for Visite programmée */}
              {currentStatus === 'Visite programmée' && (
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-4 mb-2">
                    <label className="text-sm font-medium block mb-1">Date de rendez-vous :</label>
                    {appointmentDate ? (
                      <span className="font-semibold text-green-700">{new Date(appointmentDate).toLocaleString()}</span>
                    ) : (
                      <span className="text-red-600">Non définie</span>
                    )}
                    <Button variant="outline" size="sm" onClick={handleEditAppointment}>
                      Modifier
                    </Button>
                  </div>
                </div>
              )}
              {/* Visit Note Section */}
              {(currentStatus === 'Visite programmée' || SALE_STATUSES.indexOf(currentStatus) > SALE_STATUSES.indexOf('Visite programmée')) && (
                <div className="pt-4 border-t">
                  <label htmlFor="visitNote" className="text-sm font-medium block mb-1">Note de visite</label>
                  <Textarea 
                    id="visitNote" 
                    placeholder="Saisir une note de visite..." 
                    value={visitNote ?? ''} 
                    onChange={(e) => setVisitNote(e.target.value)} 
                    rows={3}
                  />
                  <Button onClick={handleSaveVisitNote} disabled={isSavingNote || !visitNote.trim()} className="mt-2">
                    <Save className="mr-2 h-4 w-4" /> {isSavingNote ? 'Sauvegarde...' : 'Sauvegarder la note'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Documents Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Files className="mr-2 h-5 w-5 text-primary" />Documents Associés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Offer Document Section */} 
              {(currentStatus === 'Négociation' || SALE_STATUSES.indexOf(currentStatus) >= SALE_STATUSES.indexOf('Négociation') || opportunity?.offer_document_url) && (
                <div className="pt-4 border-t first:border-t-0 first:pt-0">
                  <h3 className="text-md font-semibold mb-2 flex items-center"><Paperclip className="mr-2 h-4 w-4" />Document d'offre</h3>
                  {opportunity?.offer_document_url && (
                    <div className="mb-3">
                      <a 
                        href={opportunity.offer_document_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" /> Voir l'offre actuelle
                      </a>
                    </div>
                  )}
                  {currentStatus === 'Négociation' && (
                    <div className="space-y-1">
                      <label htmlFor="offerDocumentUpload" className="text-sm font-medium">
                        {opportunity?.offer_document_url ? "Remplacer l'offre actuelle :" : "Téléverser un document d'offre :"}
                      </label>
                      <Input 
                        id="offerDocumentUpload" 
                        type="file" 
                        onChange={handleOfferFileUpload} 
                        disabled={isUploadingOffer}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.msg,.eml"
                        className="max-w-md"
                      />
                      {isUploadingOffer && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Téléversement en cours...</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Sales Promise Section */} 
              {(currentStatus === 'Promesse de vente' || SALE_STATUSES.indexOf(currentStatus) >= SALE_STATUSES.indexOf('Promesse de vente') || opportunity?.promise_document_url) && (
                <div className="pt-4 border-t first:border-t-0 first:pt-0">
                  <h3 className="text-md font-semibold mb-2 flex items-center"><FileText className="mr-2 h-4 w-4" />Promesse de Vente</h3>
                  {opportunity?.promise_document_url && (
                    <div className="mb-3">
                      <a 
                        href={opportunity.promise_document_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" /> Voir la promesse actuelle
                      </a>
                    </div>
                  )}
                  {currentStatus === 'Promesse de vente' && (
                    <Button 
                      onClick={handleGenerateAndUploadPromise} 
                      disabled={isGeneratingPromise}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> {isGeneratingPromise ? 'Génération...' : (opportunity?.promise_document_url ? 'Régénérer la promesse' : 'Générer la promesse')}
                    </Button>
                  )}
                </div>
              )}

              {/* TODO: Section for final sales contract if status is 'Vente conclue' */}
              {currentStatus === 'Vente conclue' && (
                <div className="pt-4 border-t first:border-t-0 first:pt-0">
                  <h3 className="text-md font-semibold mb-2 flex items-center"><FileSignature className="mr-2 h-4 w-4" />Contrat de Vente Final</h3>
                  <p className="text-sm text-muted-foreground">Logique pour le contrat de vente final à implémenter.</p>
                  {/* Display link to final contract if exists, and button to generate/upload */}
                </div>
              )}
            </CardContent>
          </Card>

        </main>
      </div>
    </SidebarProvider>
  );
};

export default SaleOpportunityDetailPage;
