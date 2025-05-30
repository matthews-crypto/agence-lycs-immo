import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AgencyBasicInfo } from "@/components/admin/agencies/create/AgencyBasicInfo"
import { AgencyAddress } from "@/components/admin/agencies/create/AgencyAddress"
import { AgencyCustomization } from "@/components/admin/agencies/create/AgencyCustomization"
import { AgencyAdminInfo } from "./AgencyAdminInfo"
import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Building, MapPin, User, Palette } from "lucide-react"
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
  license_number: z.string().min(1, "NINEA ou RCC requis"),
  slug: z.string().min(2, "Slug invalide"),
  
  address: z.string().min(1, "Adresse requise"),
  city: z.string().min(1, "Ville requise"),
  postal_code: z.string().regex(/^[0-9]{5}$/, "Code postal invalide"),
  
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  admin_email: z.string().email("Email invalide"),
  admin_phone: z.string().regex(/^(70|75|76|77|78)[0-9]{7}$/, "Format de téléphone sénégalais invalide (ex: 771234567)"),
  admin_license: z.string().optional(),
  
  logo_url: z.string().optional(),
  primary_color: z.string(),
  secondary_color: z.string(),
})

type FormValues = z.infer<typeof formSchema>

interface AgencyRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgencyRegistrationDialog({ open, onOpenChange }: AgencyRegistrationDialogProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true)
      console.log("Submitting data:", data)

      const { error } = await supabase
        .from('demande_inscription')
        .insert({
          agency_name: data.agency_name,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          license_number: data.license_number,
          slug: data.slug,
          address: data.address,
          city: data.city,
          postal_code: data.postal_code,
          admin_first_name: data.first_name,
          admin_last_name: data.last_name,
          admin_email: data.admin_email,
          admin_phone: data.admin_phone,
          admin_license: data.admin_license,
          logo_url: data.logo_url,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color
        })

      if (error) {
        console.error("Insert error:", error)
        if (error.message.includes('duplicate key')) {
          if (error.message.includes('slug')) {
            toast.error("Ce slug est déjà utilisé")
          } else if (error.message.includes('license_number')) {
            toast.error("Ce numéro de licence est déjà utilisé")
          } else {
            toast.error("Une erreur est survenue")
          }
          return
        }
        throw error
      }

      toast.success("Demande d'inscription envoyée avec succès")
      onOpenChange(false)
      form.reset()
      setCurrentStep(0)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de l'envoi de la demande")
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = async () => {
    const fields = [
      ["agency_name", "contact_email", "contact_phone", "license_number", "slug"],
      ["address", "city", "postal_code"],
      ["first_name", "last_name", "admin_email", "admin_phone"],
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle 
            className="text-2xl font-bold mb-4"
            style={{ color: '#aa1ca0' }}
          >
            Inscrire mon agence
          </DialogTitle>
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`flex-1 text-center cursor-pointer transition-colors hover:text-primary ${
                  index === currentStep
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                }`}
                onClick={async () => {
                  // Si on va en avant, valider les étapes intermédiaires
                  if (index > currentStep) {
                    for (let i = currentStep; i < index; i++) {
                      const fields = [
                        ["agency_name", "contact_email", "contact_phone", "license_number", "slug"],
                        ["address", "city", "postal_code"],
                        ["first_name", "last_name", "admin_email", "admin_phone"],
                        ["primary_color", "secondary_color"],
                      ][i];
                      
                      const isValid = await form.trigger(fields as Array<keyof FormValues>);
                      if (!isValid) return; // Arrêter si une étape n'est pas valide
                    }
                  }
                  
                  // Changer l'étape
                  setCurrentStep(index);
                }}
              >
                <span className="hidden md:inline">{step.title}</span>
                <span className="md:hidden flex justify-center">{step.icon}</span>
              </div>
            ))}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            {currentStep === 0 && <AgencyBasicInfo isPublicRegistration={true} />}
            {currentStep === 1 && <AgencyAddress />}
            {currentStep === 2 && <AgencyAdminInfo />}
            {currentStep === 3 && <AgencyCustomization />}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0 || isSubmitting}
                className="w-[120px] md:w-auto"
              >
                Précédent
              </Button>
              
              <Button 
                type="button" 
                onClick={nextStep}
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#aa1ca0',
                }}
                className="w-[120px] md:w-auto"
              >
                {currentStep === steps.length - 1 
                  ? (isSubmitting ? "Envoi en cours..." : "Envoyer la demande")
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