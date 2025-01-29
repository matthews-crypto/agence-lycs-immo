import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AgencyBasicInfo } from "@/components/admin/agencies/create/AgencyBasicInfo"
import { AgencyAddress } from "@/components/admin/agencies/create/AgencyAddress"
import { AgencyCustomization } from "@/components/admin/agencies/create/AgencyCustomization"
import { AgencyAdminInfo } from "@/components/agency-registration/AgencyAdminInfo"
import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Building, MapPin, Palette, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAgencyContext } from "@/contexts/AgencyContext"

const formSchema = z.object({
  agency_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  contact_email: z.string().email("Email invalide"),
  contact_phone: z.string().regex(/^(70|75|76|77|78)[0-9]{7}$/, "Format de téléphone sénégalais invalide (ex: 771234567)"),
  license_number: z.string().min(1, "Numéro de licence requis"),
  address: z.string().min(1, "Adresse requise"),
  city: z.string().min(1, "Ville requise"),
  postal_code: z.string().regex(/^[0-9]{5}$/, "Code postal invalide"),
  logo_url: z.string().optional(),
  primary_color: z.string(),
  secondary_color: z.string(),
  admin_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  admin_email: z.string().email("Email invalide"),
  admin_phone: z.string().regex(/^(70|75|76|77|78)[0-9]{7}$/, "Format de téléphone sénégalais invalide (ex: 771234567)"),
  admin_license: z.string().min(1, "Matricule agent requis"),
})

type FormValues = z.infer<typeof formSchema>

interface AgencyInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgencyInfoDialog({ open, onOpenChange }: AgencyInfoDialogProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { agency, refetch } = useAgencyContext()
  
  const steps = [
    { title: "Informations", icon: <Building className="w-5 h-5" /> },
    { title: "Adresse", icon: <MapPin className="w-5 h-5" /> },
    { title: "Administrateur", icon: <User className="w-5 h-5" /> },
    { title: "Personnalisation", icon: <Palette className="w-5 h-5" /> }
  ]

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primary_color: "#1a365d",
      secondary_color: "#60a5fa",
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
        admin_name: agency.admin_name || "",
        admin_email: agency.admin_email || "",
        admin_phone: agency.admin_phone || "",
        admin_license: agency.admin_license || "",
      })
    }
  }, [agency, form])

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true)
      console.log("Submitting data:", data)

      const { error: updateError } = await supabase
        .from("agencies")
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
          admin_name: data.admin_name,
          admin_email: data.admin_email,
          admin_phone: data.admin_phone,
          admin_license: data.admin_license,
        })
        .eq("id", agency?.id)

      if (updateError) {
        console.error("Update error:", updateError)
        if (updateError.message.includes("duplicate key")) {
          if (updateError.message.includes("agencies_contact_email_key")) {
            toast.error("Cet email est déjà utilisé")
          } else if (updateError.message.includes("agencies_license_number_key")) {
            toast.error("Ce numéro de licence est déjà utilisé")
          }
          return
        }
        throw updateError
      }

      await refetch()
      toast.success("Informations mises à jour avec succès")
      onOpenChange(false)
      setCurrentStep(0)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la mise à jour des informations")
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = async () => {
    const fields = [
      ["agency_name", "contact_email", "contact_phone", "license_number"],
      ["address", "city", "postal_code"],
      ["admin_name", "admin_email", "admin_phone", "admin_license"],
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

  const handleCancel = () => {
    onOpenChange(false)
    setCurrentStep(0)
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
        admin_name: agency.admin_name || "",
        admin_email: agency.admin_email || "",
        admin_phone: agency.admin_phone || "",
        admin_license: agency.admin_license || "",
      })
    }
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
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-2 flex-1 justify-center py-2 px-4 transition-colors hover:text-primary ${
                  index === currentStep
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {step.icon}
                <span className="hidden md:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            {currentStep === 0 && <AgencyBasicInfo />}
            {currentStep === 1 && <AgencyAddress />}
            {currentStep === 2 && <AgencyAdminInfo />}
            {currentStep === 3 && <AgencyCustomization />}

            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
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
                  onClick={handleCancel}
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