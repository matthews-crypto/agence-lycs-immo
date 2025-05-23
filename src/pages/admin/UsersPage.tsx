import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

type UserData = {
  id: string
  role: 'Agent' | 'Client'
  agencyName?: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone_number?: string | null
  agencies?: {
    agency_name: string
  } | null
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      // Fetch agents with their user data and agency info
      const { data: agents, error: agentsError } = await supabase
        .from("real_estate_agents")
        .select(`
          *,
          agencies (
            agency_name
          )
        `)
      
      if (agentsError) throw agentsError

      // Fetch clients with their user data and agency info
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          *,
          agencies (
            agency_name
          )
        `)
      
      if (clientsError) throw clientsError

      // Format agents data
      const formattedAgents: UserData[] = (agents || []).map(agent => ({
        id: agent.id,
        role: 'Agent',
        agencyName: agent.agencies?.agency_name,
        first_name: null, // These will come from your profile data if needed
        last_name: null,
        email: null,
        phone_number: null
      }))

      // Format clients data
      const formattedClients: UserData[] = (clients || []).map(client => ({
        id: client.id,
        role: 'Client',
        agencyName: client.agencies?.agency_name,
        first_name: client.first_name,
        last_name: client.last_name,
        email: null,
        phone_number: client.phone_number
      }))

      return [...formattedAgents, ...formattedClients]
    },
  })

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      ((user.first_name || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
      ((user.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase()

    return matchesSearch && matchesRole
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Utilisateurs</h1>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Rechercher par nom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={roleFilter}
          onValueChange={setRoleFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="agent">Agents</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Agence</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.first_name || ''} {user.last_name || ''}
                </TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.agencyName}</TableCell>
                <TableCell>{user.email || ''}</TableCell>
                <TableCell>{user.phone_number || ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}