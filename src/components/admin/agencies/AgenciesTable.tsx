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
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"

export function AgenciesTable() {
  const { data: agencies, isLoading } = useQuery({
    queryKey: ["admin", "agencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead>Thème</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agencies?.map((agency) => (
            <TableRow key={agency.id}>
              <TableCell className="font-medium">
                {agency.agency_name}
              </TableCell>
              <TableCell>{agency.contact_email}</TableCell>
              <TableCell>{agency.city}</TableCell>
              <TableCell>{agency.slug}</TableCell>
              <TableCell>
                <Badge
                  variant={agency.is_active ? "success" : "destructive"}
                >
                  {agency.is_active ? "Actif" : "Inactif"}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(agency.created_at), "Pp", {
                  locale: fr,
                })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: agency.primary_color || "#000000",
                    }}
                  />
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: agency.secondary_color || "#ffffff",
                    }}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}