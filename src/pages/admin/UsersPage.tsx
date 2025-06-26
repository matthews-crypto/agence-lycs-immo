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
      // Récupérer les admins d'agence
      const { data: agencies, error: agenciesError } = await supabase
        .from("agencies")
        .select("id, agency_name, admin_first_name, admin_last_name, admin_email, admin_phone");
      if (agenciesError) throw agenciesError;

      // Récupérer les propriétaires
      const { data: proprietaires, error: proprietairesError } = await supabase
        .from("proprietaire")
        .select("id, prenom, nom, numero_telephone, adresse_email, agenceID");
      if (proprietairesError) throw proprietairesError;

      // Formater les admins d'agence
      const admins: UserData[] = (agencies || []).map(agency => ({
        id: agency.id,
        role: 'Admin',
        agencyName: agency.agency_name,
        first_name: agency.admin_first_name || '',
        last_name: agency.admin_last_name || '',
        email: agency.admin_email || '',
        phone_number: agency.admin_phone || ''
      }));

      // Formater les propriétaires
      // On essaie de retrouver le nom de l'agence associée si possible
      const agenciesById = Object.fromEntries((agencies || []).map(a => [a.id, a.agency_name]));
      const proprietairesList: UserData[] = (proprietaires || []).map(proprio => ({
        id: proprio.id,
        role: 'Propriétaire',
        agencyName: agenciesById[proprio.agenceID] || '',
        first_name: proprio.prenom || '',
        last_name: proprio.nom || '',
        email: proprio.adresse_email || '',
        phone_number: proprio.numero_telephone || ''
      }));

      return [...admins, ...proprietairesList];
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
    <div className="min-h-screen bg-gradient-to-br from-[#f7c1e0] via-[#f5e6fa] to-[#e8d3fc] font-sans">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-[#f472b6]/30 shadow-sm mb-8">
        <div className="container mx-auto flex items-center py-7 px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#f472b6] via-[#e879f9] to-[#a21caf]">Utilisateurs</h1>
        </div>
      </div>

      <main className="container mx-auto px-2 md:px-4 pb-10">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Input
            placeholder="Rechercher par nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:max-w-xs rounded-xl border border-[#f472b6]/20 focus:border-[#a21caf] focus:ring-2 focus:ring-[#f472b6]/30 px-4 py-2 text-base transition outline-none shadow-sm"
          />
          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
          >
            <SelectTrigger className="w-full md:w-[200px] rounded-xl border border-[#f472b6]/20 focus:border-[#a21caf] focus:ring-2 focus:ring-[#f472b6]/30">
              <SelectValue placeholder="Filtrer par rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="propriétaire">Propriétaires</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-3xl shadow-lg bg-white/95 p-4 md:p-8 border border-[#f472b6]/20 hover:shadow-2xl transition-all">
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
                  <TableCell className="font-semibold text-[#a21caf]">{user.first_name || ''} {user.last_name || ''}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.agencyName}</TableCell>
                  <TableCell>{user.email || ''}</TableCell>
                  <TableCell>{user.phone_number || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}