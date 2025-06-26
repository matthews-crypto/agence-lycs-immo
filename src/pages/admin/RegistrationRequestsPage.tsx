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
import { Database } from "@/integrations/supabase/types"

type RegistrationStatus = Database["public"]["Enums"]["registration_status"] | "all"

export default function RegistrationRequestsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus>("all")
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
    <div className="min-h-screen bg-gradient-to-br from-[#f7c1e0] via-[#f5e6fa] to-[#e8d3fc] font-sans">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-[#f472b6]/30 shadow-sm mb-8">
        <div className="container mx-auto flex items-center py-7 px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#f472b6] via-[#e879f9] to-[#a21caf]">Demandes d'inscription</h1>
        </div>
      </div>
      <main className="container mx-auto px-2 md:px-4 pb-10">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Input
            placeholder="Rechercher par nom d'agence ou d'admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:max-w-md rounded-xl border border-[#f472b6]/20 focus:border-[#a21caf] focus:ring-2 focus:ring-[#f472b6]/30 px-4 py-2 text-base transition outline-none shadow-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(value: RegistrationStatus) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full md:w-[200px] rounded-xl border border-[#f472b6]/20 focus:border-[#a21caf] focus:ring-2 focus:ring-[#f472b6]/30">
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
                className="rounded-3xl bg-white/95 p-4 border border-[#f472b6]/20 hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                onClick={() => navigate(`/admin/registration-requests/${request.id}`)}
              >
                <div>
                  <h3 className="font-semibold text-[#a21caf] text-lg">{request.agency_name}</h3>
                  <p className="text-sm text-[#a21caf]/80">
                    Admin: {request.admin_name || "Non spécifié"}
                  </p>
                  <p className="text-sm text-[#a21caf]/80">
                    Email: {request.contact_email}
                  </p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm border transition-all
                    ${request.status === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      request.status === 'VALIDEE' ? 'bg-green-100 text-green-800 border-green-200' :
                      'bg-red-100 text-red-800 border-red-200'}
                  `}>
                    {request.status === 'EN_ATTENTE' ? 'En attente' :
                      request.status === 'VALIDEE' ? 'Validée' :
                      'Rejetée'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}