import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AgencyBasicInfo } from "@/components/admin/agencies/create/AgencyBasicInfo"
import { AgencyAddress } from "@/components/admin/agencies/create/AgencyAddress"
import { AgencyCustomization } from "@/components/admin/agencies/create/AgencyCustomization"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAgencyContext } from "@/contexts/AgencyContext"
import { Building, MapPin, Palette } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const formSchema = z.object({
  agency_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  contact_email: z.string().email("Email invalide"),
  contact_phone: z.string().regex(/^(70|75|76|77|78)[0-9]{7}$/, "Format de téléphone sénégalais invalide (ex: 771234567)"),
  license_number: z.string().min(1, "Numéro de licence requis"),
  password: z.string().optional(),
  address: z.string().min(1, "Adresse requise"),
  city: z.string().min(1, "Ville requise"),
  postal_code: z.string().regex(/^[0-9]{5}$/, "Code postal invalide"),
  logo_url: z.string().optional(),
  primary_color: z.string(),
  secondary_color: z.string(),
})

type FormValues = z.infer<typeof formSchema>

interface AgencySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgencySettingsDialog({ open, onOpenChange }: AgencySettingsDialogProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { agency, refetch } = useAgencyContext()
  
  const steps = [
    { title: "Informations", icon: <Building className="w-5 h-5" /> },
    { title: "Adresse", icon: <MapPin className="w-5 h-5" /> },
    { title: "Personnalisation", icon: <Palette className="w-5 h-5" /> }
  ]

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agency_name: agency?.agency_name || "",
      contact_email: agency?.contact_email || "",
      contact_phone: agency?.contact_phone || "",
      license_number: agency?.license_number || "",
      address: agency?.address || "",
      city: agency?.city || "",
      postal_code: agency?.postal_code || "",
      logo_url: agency?.logo_url || "",
      primary_color: agency?.primary_color || "#1a365d",
      secondary_color: agency?.secondary_color || "#60a5fa",
    },
  })

  useEffect(() => {
    if (agency) {
      form.reset({
        agency_name: agency.agency_name || "",
        contact_email: agency.contact_email || "",
        contact_phone: agency.contact_phone || "",
        license_number: agency.license_number || "",
        address: agency.address || "",
        city: agency.city || "",
        postal_code: agency.postal_code || "",
        logo_url: agency.logo_url || "",
        primary_color: agency.primary_color || "#1a365d",
        secondary_color: agency.secondary_color || "#60a5fa",
      })
    }
  }, [agency, form])

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true)
      
      const { error } = await supabase
        .from('agencies')
        .update({
          agency_name: data.agency_name,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          license_number: data.license_number,
          address: data.address,
          city: data.city,
          postal_code: data.postal_code,
          logo_url: data.logo_url,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
        })
        .eq('id', agency?.id)

      if (error) {
        console.error("Update error:", error)
        if (error.message.includes('agencies_contact_email_key')) {
          toast.error("Cet email est déjà utilisé")
          return
        }
        if (error.message.includes('agencies_license_number_key')) {
          toast.error("Ce numéro de licence est déjà utilisé")
          return
        }
        throw error
      }

      await refetch()
      toast.success("Informations mises à jour avec succès")
      onOpenChange(false)
      setCurrentStep(0)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = async () => {
    const fields = [
      ["agency_name", "contact_email", "contact_phone", "license_number"],
      ["address", "city", "postal_code"],
      ["primary_color", "secondary_color"],
    ][currentStep]

    const isValid = await form.trigger(fields as Array<keyof FormValues>)
    
    if (isValid) {
      if (currentStep === steps.length - 1) {
        await form.handleSubmit(onSubmit)()
      } else {
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
      }
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleStepClick = (index: number) => {
    setCurrentStep(index)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4">
            Modifier les informations de l'agence
          </DialogTitle>
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <button
                key={step.title}
                onClick={() => handleStepClick(index)}
                className={`flex-1 text-center p-2 transition-colors hover:text-primary ${
                  index === currentStep
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                }`}
              >
                <span className="hidden md:inline">{step.title}</span>
                <span className="md:hidden flex justify-center">{step.icon}</span>
              </button>
            ))}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            {currentStep === 0 && <AgencyBasicInfo />}
            {currentStep === 1 && <AgencyAddress />}
            {currentStep === 2 && <AgencyCustomization />}

            <div className="flex justify-between pt-4">
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0 || isSubmitting}
                >
                  Précédent
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
              </div>
              
              <Button 
                type="button" 
                onClick={nextStep}
                disabled={isSubmitting}
              >
                {currentStep === steps.length - 1 
                  ? (isSubmitting ? "Mise à jour en cours..." : "Mettre à jour")
                  : "Suivant"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}