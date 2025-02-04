import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { AgencyBasicInfo } from "@/components/admin/agencies/create/AgencyBasicInfo"
import { AgencyAddress } from "@/components/admin/agencies/create/AgencyAddress"
import { AgencyCustomization } from "@/components/admin/agencies/create/AgencyCustomization"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

const formSchema = z.object({
  agency_name: z.string().min(2, "Le nom de l'agence doit contenir au moins 2 caractères"),
  contact_email: z.string().email("Email invalide"),
  contact_phone: z.string().min(9, "Le numéro de téléphone doit contenir au moins 9 chiffres"),
  license_number: z.string().min(3, "Le numéro de licence doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  slug: z.string(),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  postal_code: z.string().min(4, "Le code postal doit contenir au moins 4 caractères"),
  logo_url: z.string().optional(),
  primary_color: z.string().default("#000000"),
  secondary_color: z.string().default("#ffffff"),
})

interface AgencyRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgencyRegistrationDialog({
  open,
  onOpenChange,
}: AgencyRegistrationDialogProps) {
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primary_color: "#000000",
      secondary_color: "#ffffff",
    },
  })

  const steps = [
    {
      title: "Informations de base",
      description: "Informations de base de l'agence",
      component: <AgencyBasicInfo showPassword={true} />,
    },
    {
      title: "Adresse",
      description: "Adresse physique de l'agence",
      component: <AgencyAddress />,
    },
    {
      title: "Personnalisation",
      description: "Personnalisez l'apparence de l'agence",
      component: <AgencyCustomization />,
    },
  ]

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.contact_email,
        password: values.password,
      })

      if (authError) throw authError

      // Create agency
      const { error: agencyError } = await supabase.from("agencies").insert({
        ...values,
        user_id: authData.user?.id,
        is_active: false,
      })

      if (agencyError) throw agencyError

      toast.success(
        "Votre demande d'inscription a été envoyée avec succès. Nous vous contacterons prochainement."
      )
      onOpenChange(false)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Inscrire mon agence</DialogTitle>
          <DialogDescription>
            Remplissez le formulaire ci-dessous pour inscrire votre agence
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-8">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">{steps[step].title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {steps[step].description}
                  </p>
                </div>
                {steps[step].component}
              </div>
            </div>

            <DialogFooter className="gap-4 sm:gap-0">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Précédent
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Suivant
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Inscription en cours..." : "S'inscrire"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}