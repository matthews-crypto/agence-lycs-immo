import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { z } from "zod"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { AgencyBasicInfo } from "@/components/admin/agencies/create/AgencyBasicInfo"
import { AgencyAddress } from "@/components/admin/agencies/create/AgencyAddress"
import { AgencyCustomization } from "@/components/admin/agencies/create/AgencyCustomization"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  agency_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  contact_email: z.string().email("Email invalide"),
  contact_phone: z.string().regex(/^(70|75|76|77|78)[0-9]{7}$/, "Format de téléphone sénégalais invalide (ex: 771234567)"),
  license_number: z.string().min(1, "Numéro de licence requis"),
  slug: z.string().min(2, "Slug invalide"),
  address: z.string().min(1, "Adresse requise"),
  city: z.string().min(1, "Ville requise"),
  postal_code: z.string().regex(/^[0-9]{5}$/, "Code postal invalide"),
  logo_url: z.string().optional(),
  primary_color: z.string(),
  secondary_color: z.string(),
})

type FormValues = z.infer<typeof formSchema>

export default function EditAgencyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const steps = ["Informations", "Adresse", "Personnalisation"]

  const { data: agency, isLoading } = useQuery({
    queryKey: ["admin", "agencies", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      if (error) throw error
      return data
    },
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agency_name: agency?.agency_name || "",
      contact_email: agency?.contact_email || "",
      contact_phone: agency?.contact_phone || "",
      license_number: agency?.license_number || "",
      slug: agency?.slug || "",
      address: agency?.address || "",
      city: agency?.city || "",
      postal_code: agency?.postal_code || "",
      logo_url: agency?.logo_url || "",
      primary_color: agency?.primary_color || "#1a365d",
      secondary_color: agency?.secondary_color || "#60a5fa",
    },
  })

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
          slug: data.slug,
          address: data.address,
          city: data.city,
          postal_code: data.postal_code,
          logo_url: data.logo_url,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
        })
        .eq("id", id)

      if (updateError) {
        console.error("Update error:", updateError)
        if (updateError.message.includes("duplicate key")) {
          if (updateError.message.includes("agencies_contact_email_key")) {
            toast.error("Cet email est déjà utilisé")
          } else if (updateError.message.includes("agencies_license_number_key")) {
            toast.error("Ce numéro de licence est déjà utilisé")
          } else if (updateError.message.includes("agencies_slug_key")) {
            toast.error("Ce slug est déjà utilisé")
          }
          return
        }
        toast.error("Erreur lors de la mise à jour de l'agence")
        return
      }

      toast.success("Agence mise à jour avec succès")
      navigate("/admin/agencies")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Erreur lors de la mise à jour de l'agence")
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!agency) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Agence non trouvée</h1>
        <p className="text-muted-foreground">
          L'agence que vous cherchez n'existe pas ou a été supprimée.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">
            Modifier l'agence : {agency.agency_name}
          </h1>
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
                  ? (isSubmitting ? "Mise à jour en cours..." : "Mettre à jour l'agence")
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