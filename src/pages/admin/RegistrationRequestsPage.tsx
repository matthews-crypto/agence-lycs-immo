import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useNavigate } from "react-router-dom"

export default function RegistrationRequestsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const navigate = useNavigate()

  const { data: requests, isLoading } = useQuery({
    queryKey: ['registration-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('demande_inscription')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
  })

  const filteredRequests = requests?.filter(request => {
    const searchLower = search.toLowerCase()
    return (
      !search ||
      request.agency_name.toLowerCase().includes(searchLower) ||
      (request.admin_name && request.admin_name.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Demandes d'inscription</h1>
      
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Rechercher par nom d'agence ou d'admin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="EN_ATTENTE">En attente</SelectItem>
            <SelectItem value="VALIDEE">Validée</SelectItem>
            <SelectItem value="REJETEE">Rejetée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div>Chargement...</div>
      ) : (
        <div className="space-y-4">
          {filteredRequests?.map((request) => (
            <div
              key={request.id}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/admin/registration-requests/${request.id}`)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{request.agency_name}</h3>
                  <p className="text-sm text-gray-600">
                    Admin: {request.admin_name || "Non spécifié"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: {request.contact_email}
                  </p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    request.status === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'VALIDEE' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {request.status === 'EN_ATTENTE' ? 'En attente' :
                     request.status === 'VALIDEE' ? 'Validée' :
                     'Rejetée'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}