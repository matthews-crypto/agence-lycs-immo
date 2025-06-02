import { useEffect, useState, useCallback, useMemo } from "react";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { format, parse, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Calendar as CalendarIcon, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Type pour les messages de contact
type ContactMessage = {
  id: string;
  agency_id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  updated_at: string;
  firstname: string | null;
  phone: string | null;
};

// Type pour le stockage local des messages vus
type ViewedMessagesStore = {
  lastViewedTimestamp: number;
  messageIds: string[];
};

// Type pour les options de filtrage
type FilterOptions = {
  startDate: Date | null;
  endDate: Date | null;
};

export default function ContactRequestsPage() {
  const { agency } = useAgencyContext();
  
  // États pour les messages et le chargement
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isMessageDetailsOpen, setIsMessageDetailsOpen] = useState(false);
  
  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: null,
    endDate: null
  });
  
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const messagesPerPage = 10;

  // Fonction pour récupérer les messages de contact depuis la base de données
  const fetchContactMessages = useCallback(async () => {
    if (!agency?.id) return;
    
    setIsLoading(true);
    try {
      // Calculer l'offset pour la pagination
      const offset = (currentPage - 1) * messagesPerPage;
      
      // Récupérer les messages de contact pour l'agence connectée
      const { data, error, count } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact' })
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + messagesPerPage - 1);

      if (error) {
        throw error;
      }

      if (data) {
        setContactMessages(data as ContactMessage[]);
        
        // Calculer le nombre total de pages
        if (count) {
          setTotalPages(Math.ceil(count / messagesPerPage));
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des messages de contact:", error);
      toast.error("Erreur lors du chargement des messages de contact");
    } finally {
      setIsLoading(false);
    }
  }, [agency?.id, currentPage, messagesPerPage]);

  // Charger les messages au chargement de la page et lorsque la pagination change
  useEffect(() => {
    fetchContactMessages();
  }, [agency?.id, currentPage, fetchContactMessages]);

  // Réinitialiser le compteur de nouveaux messages lorsque la page est visitée
  useEffect(() => {
    if (!agency?.id) return;
    
    // Marquer tous les messages comme vus dans le localStorage
    const markMessagesAsViewed = () => {
      try {
        // Stocker la date actuelle comme dernier timestamp de consultation
        const viewedStore: ViewedMessagesStore = {
          lastViewedTimestamp: Date.now(),
          messageIds: contactMessages.map(msg => msg.id)
        };
        
        localStorage.setItem(`contact_messages_viewed_${agency.id}`, JSON.stringify(viewedStore));
        
        // Informer la sidebar que les messages ont été vus (via un événement personnalisé)
        const event = new CustomEvent('contact-messages-viewed', { detail: { agencyId: agency.id } });
        window.dispatchEvent(event);
      } catch (error) {
        console.error("Erreur lors du stockage des messages vus:", error);
      }
    };

    if (contactMessages.length > 0) {
      markMessagesAsViewed();
    }
  }, [agency?.id, contactMessages]);

  // Fonction pour ouvrir le dialogue de détails du message
  const handleMessageDetailsClick = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsMessageDetailsOpen(true);
  };

  // Fonction pour filtrer les messages en fonction des critères de recherche
  const filteredMessages = useMemo(() => {
    return contactMessages.filter(message => {
      // Filtrer par terme de recherche (nom, email, téléphone)
      const searchMatch = 
        searchTerm === "" || 
        message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (message.phone && message.phone.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtrer par intervalle de dates
      let dateMatch = true;
      if (filters.startDate && filters.endDate) {
        const messageDate = new Date(message.created_at);
        dateMatch = isWithinInterval(messageDate, {
          start: filters.startDate,
          end: filters.endDate
        });
      }
      
      return searchMatch && dateMatch;
    });
  }, [contactMessages, searchTerm, filters]);

  // Fonction pour naviguer entre les pages
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AgencySidebar />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Demandes de contact</h1>
                <p className="text-muted-foreground">
                  Gérez les messages reçus via le formulaire de contact
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Messages de contact</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtres */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Rechercher par nom, email ou téléphone..."
                        className="pl-8 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="justify-start text-left font-normal bg-white"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {filters.startDate ? (
                              format(filters.startDate, "dd/MM/yyyy")
                            ) : (
                              <span className="text-muted-foreground">Date début</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.startDate}
                            onSelect={(date) => 
                              setFilters(prev => ({ ...prev, startDate: date }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="justify-start text-left font-normal bg-white"
                            disabled={!filters.startDate}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {filters.endDate ? (
                              format(filters.endDate, "dd/MM/yyyy")
                            ) : (
                              <span className="text-muted-foreground">Date fin</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.endDate}
                            onSelect={(date) => 
                              setFilters(prev => ({ ...prev, endDate: date }))
                            }
                            initialFocus
                            disabled={(date) => 
                              !filters.startDate || date < filters.startDate
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setFilters({ startDate: null, endDate: null })}
                      disabled={!filters.startDate && !filters.endDate}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                </div>

                {/* Tableau des messages */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date d'envoi</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Chargement des messages...
                          </TableCell>
                        </TableRow>
                      ) : filteredMessages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Aucun message trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMessages.map((message) => (
                          <TableRow key={message.id}>
                            <TableCell className="font-medium">{message.name}</TableCell>
                            <TableCell>{message.email}</TableCell>
                            <TableCell>{message.phone || "-"}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {message.message}
                            </TableCell>
                            <TableCell>
                              {format(new Date(message.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleMessageDetailsClick(message)}
                              >
                                Voir détails
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} sur {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogue de détails du message */}
      <Dialog open={isMessageDetailsOpen} onOpenChange={setIsMessageDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails du message</DialogTitle>
            <DialogDescription>
              Message envoyé le {selectedMessage && format(new Date(selectedMessage.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Nom</h3>
                  <p className="text-sm">{selectedMessage.name}</p>
                </div>
                {selectedMessage.firstname && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Prénom</h3>
                    <p className="text-sm">{selectedMessage.firstname}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Email</h3>
                <p className="text-sm">{selectedMessage.email}</p>
              </div>
              
              {selectedMessage.phone && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Téléphone</h3>
                  <p className="text-sm">{selectedMessage.phone}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium mb-1">Message</h3>
                <div className="bg-muted/20 p-3 rounded-md text-sm whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-end">
            <Button 
              variant="default" 
              onClick={() => setIsMessageDetailsOpen(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
