import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useState } from "react"
import { RejectionReasonDialog } from "@/components/admin/registration/RejectionReasonDialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function RegistrationRequestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false)

  const { data: request, isLoading } = useQuery({
    queryKey: ['registration-request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demande_inscription')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
  })

  const approveRequest = useMutation({
    mutationFn: async () => {
      if (!request) throw new Error('No request data')

      console.log('Approving request with data:', request)

      const { error } = await supabase.functions.invoke('create-agency-user', {
        body: {
          agency_name: request.agency_name,
          contact_email: request.contact_email,
          contact_phone: request.contact_phone,
          license_number: request.license_number,
          slug: request.slug,
          address: request.address,
          city: request.city,
          postal_code: request.postal_code,
          logo_url: request.logo_url,
          primary_color: request.primary_color,
          secondary_color: request.secondary_color,
          admin_name: request.admin_name,
          admin_email: request.admin_email,
          admin_phone: request.admin_phone,
          admin_license: request.admin_license,
          password_hash: request.password_hash,
          must_change_password: false // Set to false as requested
        }
      })

      if (error) {
        console.error('Function error:', error)
        throw error
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('demande_inscription')
        .update({ status: 'VALIDEE' })
        .eq('id', id)

      if (updateError) throw updateError
    },
    onSuccess: () => {
      toast.success("Agence créée avec succès")
      queryClient.invalidateQueries({ queryKey: ['registration-requests'] })
      navigate('/admin/registration-requests')
    },
    onError: (error) => {
      console.error('Error:', error)
      if (error.message?.includes('Email already exists')) {
        toast.error("Cet email est déjà utilisé")
      } else if (error.message?.includes('License number already exists')) {
        toast.error("Ce numéro de licence est déjà utilisé")
      } else if (error.message?.includes('Slug already exists')) {
        toast.error("Ce slug est déjà utilisé")
      } else {
        toast.error("Erreur lors de la création de l'agence")
      }
    }
  })

  const rejectRequest = useMutation({
    mutationFn: async (reason: string) => {
      if (!request) throw new Error('No request data')

      // Update request status and rejection reason
      const { error: updateError } = await supabase
        .from('demande_inscription')
        .update({ 
          status: 'REJETEE',
          rejection_reason: reason
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Send rejection email
      const { error: emailError } = await supabase.functions.invoke('send-rejection-email', {
        body: {
          agency_name: request.agency_name,
          contact_email: request.contact_email,
          rejection_reason: reason
        }
      })

      if (emailError) throw emailError
    },
    onSuccess: () => {
      toast.success("Demande rejetée")
      queryClient.invalidateQueries({ queryKey: ['registration-requests'] })
      navigate('/admin/registration-requests')
    },
    onError: (error) => {
      console.error('Error:', error)
      toast.error("Erreur lors du rejet de la demande")
    }
  })

  const handleReject = (reason: string) => {
    rejectRequest.mutate(reason)
    setIsRejectionDialogOpen(false)
  }

  if (isLoading) {
    return <div>Chargement...</div>
  }

  if (!request) {
    return <div>Demande non trouvée</div>
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/admin/registration-requests')}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-tr from-[#f472b6] to-[#a21caf] text-white font-semibold shadow hover:brightness-110 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Retour aux demandes
        </button>
        <Card>
          <CardHeader>
            <CardTitle>Demande d'inscription - {request.agency_name}</CardTitle>
            <CardDescription>
              Créée le {new Date(request.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Informations de l'agence</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Nom:</span> {request.agency_name}</p>
                  <p><span className="text-gray-600">Email:</span> {request.contact_email}</p>
                  <p><span className="text-gray-600">Téléphone:</span> {request.contact_phone}</p>
                  <p><span className="text-gray-600">Licence:</span> {request.license_number}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Adresse</h3>
                <div className="space-y-2">
                  <p>{request.address}</p>
                  <p>{request.city}, {request.postal_code}</p>
                </div>
              </div>
            </div>

            {request.logo_url && (
              <div>
                <h3 className="font-semibold mb-2">Logo</h3>
                <img 
                  src={request.logo_url} 
                  alt="Logo de l'agence" 
                  className="w-32 h-32 object-contain"
                />
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Personnalisation</h3>
              <div className="flex gap-4">
                <div 
                  className="w-10 h-10 rounded"
                  style={{ backgroundColor: request.primary_color }}
                />
                <div 
                  className="w-10 h-10 rounded"
                  style={{ backgroundColor: request.secondary_color }}
                />
              </div>
            </div>

            {request.status === 'EN_ATTENTE' && (
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsRejectionDialogOpen(true)}
                  disabled={rejectRequest.isPending}
                >
                  Rejeter
                </Button>
                <Button
                  onClick={() => approveRequest.mutate()}
                  disabled={approveRequest.isPending}
                >
                  {approveRequest.isPending ? "Approbation en cours..." : "Approuver"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RejectionReasonDialog
        open={isRejectionDialogOpen}
        onOpenChange={setIsRejectionDialogOpen}
        onConfirm={handleReject}
        isSubmitting={rejectRequest.isPending}
      />
    </div>
  )
}