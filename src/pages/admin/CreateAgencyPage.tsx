import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AgencyBasicInfo } from "@/components/admin/agencies/create/AgencyBasicInfo"
import { AgencyAddress } from "@/components/admin/agencies/create/AgencyAddress"
import { AgencyCustomization } from "@/components/admin/agencies/create/AgencyCustomization"
import { supabase } from "@/integrations/supabase/client"

const formSchema = z.object({
  agency_name: z.string().min(2, "Le nom de l'agence doit contenir au moins 2 caractères"),
  contact_email: z.string().email("Email invalide"),
  contact_phone: z.string().min(9, "Le numéro de téléphone doit contenir au moins 9 chiffres"),
  license_number: z.string().min(3, "Le numéro de licence doit contenir au moins 3 caractères"),
  slug: z.string(),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  postal_code: z.string().min(4, "Le code postal doit contenir au moins 4 caractères"),
  logo_url: z.string().optional(),
  primary_color: z.string().default("#000000"),
  secondary_color: z.string().default("#ffffff"),
})

export default function CreateAgencyPage() {
  const navigate = useNavigate()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primary_color: "#000000",
      secondary_color: "#ffffff",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { error } = await supabase.from("agencies").insert(values)
      if (error) throw error

      toast.success("Agence créée avec succès")
      navigate("/admin/agencies")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la création de l'agence")
    }
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Créer une nouvelle agence</h1>
        <p className="text-muted-foreground">
          Remplissez le formulaire ci-dessous pour créer une nouvelle agence
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-8">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Informations</h2>
                <p className="text-sm text-muted-foreground">
                  Informations de base de l'agence
                </p>
              </div>
              <AgencyBasicInfo showPassword={false} />
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Adresse</h2>
                <p className="text-sm text-muted-foreground">
                  Adresse physique de l'agence
                </p>
              </div>
              <AgencyAddress />
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Personnalisation</h2>
                <p className="text-sm text-muted-foreground">
                  Personnalisez l'apparence de l'agence
                </p>
              </div>
              <AgencyCustomization />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/agencies")}
            >
              Annuler
            </Button>
            <Button type="submit">Créer l'agence</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}