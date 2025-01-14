import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { AgencyBasicInfo } from "@/components/admin/agencies/create/AgencyBasicInfo"
import { AgencyAddress } from "@/components/admin/agencies/create/AgencyAddress"
import { AgencyCustomization } from "@/components/admin/agencies/create/AgencyCustomization"
import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"

const formSchema = z.object({
  // Basic Info
  agency_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  contact_email: z.string().email("Email invalide"),
  contact_phone: z.string().regex(/^(70|75|76|77|78)[0-9]{7}$/, "Format de téléphone sénégalais invalide (ex: 771234567)"),
  license_number: z.string().min(1, "Numéro de licence requis"),
  slug: z.string().min(2, "Slug invalide"),
  
  // Address
  address: z.string().min(1, "Adresse requise"),
  city: z.string().min(1, "Ville requise"),
  postal_code: z.string().regex(/^[0-9]{5}$/, "Code postal invalide"),
  
  // Customization
  logo_url: z.string().optional(),
  primary_color: z.string(),
  secondary_color: z.string(),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateAgencyPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const steps = ["Informations", "Adresse", "Personnalisation"]

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

      const { data: result, error: fnError } = await supabase.rpc(
        'create_agency_user_and_profile',
        {
          email: data.contact_email,
          agency_name: data.agency_name,
          agency_slug: data.slug,
          license_number: data.license_number,
          contact_phone: data.contact_phone,
          address: data.address,
          city: data.city,
          postal_code: data.postal_code,
          logo_url: data.logo_url || '',
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
        }
      )

      if (fnError) {
        console.error("Function error:", fnError)
        if (fnError.message.includes('Email already exists')) {
          toast.error("Cet email est déjà utilisé")
          return
        } else if (fnError.message.includes('License number already exists')) {
          toast.error("Ce numéro de licence est déjà utilisé")
          return
        } else if (fnError.message.includes('Slug already exists')) {
          toast.error("Ce slug est déjà utilisé")
          return
        } else {
          toast.error("Erreur lors de la création de l'agence")
          return
        }
      }

      console.log("Agency created successfully:", result)
      toast.success("Agence créée avec succès")
      navigate("/admin/agencies")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la création de l'agence")
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = async () => {
    const fields = [
      // Step 1 fields
      ["agency_name", "contact_email", "contact_phone", "license_number", "slug"],
      // Step 2 fields
      ["address", "city", "postal_code"],
      // Step 3 fields
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
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">Créer une nouvelle agence</h1>
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`flex-1 text-center ${
                  index === currentStep
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            {currentStep === 0 && <AgencyBasicInfo />}
            {currentStep === 1 && <AgencyAddress />}
            {currentStep === 2 && <AgencyCustomization />}

            <div className="flex justify-between pt-4">
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
                onClick={nextStep} 
                disabled={isSubmitting}
              >
                {currentStep === steps.length - 1 
                  ? (isSubmitting ? "Création en cours..." : "Créer l'agence")
                  : "Suivant"
                }
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  )
}