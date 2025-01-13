import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

export function RecentAgencies() {
  const { data: agencies, isLoading } = useQuery({
    queryKey: ['admin', 'agencies', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      return data
    }
  })

  if (isLoading) {
    return <div>Chargement des agences récentes...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agences Récentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date création</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agencies?.map((agency) => (
              <TableRow key={agency.id}>
                <TableCell className="font-medium">{agency.agency_name}</TableCell>
                <TableCell>{agency.contact_email}</TableCell>
                <TableCell>{agency.city}</TableCell>
                <TableCell>
                  <Badge variant={agency.is_active ? "success" : "destructive"}>
                    {agency.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(agency.created_at), "Pp", { locale: fr })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}