import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/contexts/AgencyContext";

const proprietaireSchema = z.object({
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  adresse: z.string().optional(),
  numero_telephone: z.string().optional(),
  adresse_email: z.string().email("Email invalide").optional().or(z.literal("")),
});

type ProprietaireFormValues = z.infer<typeof proprietaireSchema>;

interface AddProprietaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProprietaireAdded: (proprietaire: { id: number; prenom: string; nom: string }) => void;
}

export function AddProprietaireDialog({ 
  open, 
  onOpenChange, 
  onProprietaireAdded 
}: AddProprietaireDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { agency } = useAgencyContext();

  const form = useForm<ProprietaireFormValues>({
    resolver: zodResolver(proprietaireSchema),
    defaultValues: {
      prenom: "",
      nom: "",
      adresse: "",
      numero_telephone: "",
      adresse_email: "",
    },
  });

  const onSubmit = async (data: ProprietaireFormValues) => {
    if (!agency?.id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "ID de l'agence non trouvé",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: newProprietaire, error } = await supabase
        .from("proprietaire")
        .insert({
          prenom: data.prenom,
          nom: data.nom,
          adresse: data.adresse || null,
          numero_telephone: data.numero_telephone || null,
          adresse_email: data.adresse_email || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding proprietaire:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur est survenue lors de la création du propriétaire: " + error.message,
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Succès",
        description: "Le propriétaire a été ajouté avec succès",
      });
      
      onProprietaireAdded({
        id: newProprietaire.id,
        prenom: newProprietaire.prenom,
        nom: newProprietaire.nom
      });
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error adding proprietaire:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du propriétaire",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un propriétaire</DialogTitle>
          <DialogDescription>
            Remplissez les informations du propriétaire.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Prénom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adresse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="Adresse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numero_telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="Téléphone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adresse_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
