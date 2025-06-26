import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAgencyContext } from '@/contexts/AgencyContext';
import { useAgencyAuthStore } from '@/stores/useAgencyAuthStore';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { User, UserRound, Phone, MapPin } from 'lucide-react';

// Type pour le propriétaire
type Proprietaire = {
  id: number;
  prenom: string;
  nom: string;
  adresse: string;
  numero_telephone: string;
  adresse_email: string;
  agence_id: string;
  // Ajout de champs optionnels pour éviter les erreurs de type
  [key: string]: any;
};

// Schéma de validation pour le changement de mot de passe
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string().min(8, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const ProprietaireProfilPage = () => {
  const [proprietaire, setProprietaire] = useState<Proprietaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const { session } = useAuth();
  const { agency } = useAgencyContext();
  const navigate = useNavigate();

  // Formulaire de changement de mot de passe
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const fetchProprietaireData = async () => {
      try {
        if (!session?.user?.email) {
          console.error("Pas d'email d'utilisateur disponible");
          setLoading(false);
          return;
        }

        // Récupérer les données du propriétaire
        const { data: proprietaires, error } = await supabase
          .from('proprietaire')
          .select('*')
          .eq('adresse_email', session.user.email);

        if (error) {
          console.error('Erreur lors de la récupération des données du propriétaire:', error);
          toast.error('Erreur lors du chargement des données du profil');
          setLoading(false);
          return;
        }
        
        // Déboguer la structure des données retournées
        console.log('Données propriétaires brutes:', proprietaires);
        if (proprietaires && proprietaires.length > 0) {
          console.log('Premier propriétaire structure:', Object.keys(proprietaires[0]));
        }

        if (proprietaires && proprietaires.length > 0) {
          // Si plusieurs propriétaires ont le même email, sélectionner celui qui correspond à l'agence actuelle
          let selectedProprietaire = proprietaires[0];
          if (proprietaires.length > 1 && agency) {
            console.log('Recherche du propriétaire pour agence:', agency.id);
            // Vérifier tous les champs pour trouver celui qui correspond à l'agence
            const matchingProprietaire = proprietaires.find(
              (p) => {
                console.log('Propriétaire candidat:', p);
                return p.agence_id === agency.id;
              }
            );
            if (matchingProprietaire) {
              selectedProprietaire = matchingProprietaire;
            }
          }
          setProprietaire(selectedProprietaire);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        toast.error('Erreur lors du chargement des données du profil');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchProprietaireData();
    }
  }, [session, agency]);

  const handlePasswordChange = async (values: PasswordFormValues) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        toast.error('Erreur lors du changement de mot de passe');
        return;
      }

      toast.success('Mot de passe modifié avec succès');
      setIsPasswordDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast.error('Erreur lors du changement de mot de passe');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!proprietaire) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h2 className="text-2xl font-bold mb-2">Profil non trouvé</h2>
        <p className="text-muted-foreground mb-4">
          Nous n'avons pas pu trouver vos informations de profil.
        </p>
        <Button onClick={() => navigate('../dashboard')}>
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Vos informations de contact et personnelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 border rounded-md">
              <UserRound className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Prénom</p>
                <p className="font-medium">{proprietaire.prenom || 'Non renseigné'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-md">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="font-medium">{proprietaire.nom || 'Non renseigné'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-md">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium">{proprietaire.adresse || 'Non renseignée'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-md">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="font-medium">{proprietaire.numero_telephone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
          <CardDescription>Gérez votre mot de passe et la sécurité de votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsPasswordDialogOpen(true)}>
            Changer mon mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Dialog pour changer le mot de passe */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer votre mot de passe</DialogTitle>
            <DialogDescription>
              Entrez votre mot de passe actuel et votre nouveau mot de passe.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe actuel</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProprietaireProfilPage;
