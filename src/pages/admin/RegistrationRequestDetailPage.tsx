import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
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
          password_hash: request.password_hash
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
    mutationFn: async () => {
      const { error } = await supabase
        .from('demande_inscription')
        .update({ status: 'REJETEE' })
        .eq('id', id)

      if (error) throw error
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

  if (isLoading) {
    return <div>Chargement...</div>
  }

  if (!request) {
    return <div>Demande non trouvée</div>
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-3xl mx-auto">
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
                  onClick={() => rejectRequest.mutate()}
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
    </div>
  )
}