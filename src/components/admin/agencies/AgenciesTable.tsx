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
import { Button } from "@/components/ui/button"
import { Edit, Trash, CheckSquare, XSquare } from "lucide-react"
import { toast } from "sonner"

export function AgenciesTable() {
  const { data: agencies, isLoading, refetch } = useQuery({
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

  const handleStatusChange = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("agencies")
        .update({ is_active: !currentStatus })
        .eq("id", id)

      if (error) throw error

      toast.success("Statut de l'agence mis à jour avec succès")
      refetch()
    } catch (error) {
      console.error("Error updating agency status:", error)
      toast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette agence ?")) return

    try {
      const { error } = await supabase
        .from("agencies")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast.success("Agence supprimée avec succès")
      refetch()
    } catch (error) {
      console.error("Error deleting agency:", error)
      toast.error("Erreur lors de la suppression de l'agence")
    }
  }

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
            <TableHead>Actions</TableHead>
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
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStatusChange(agency.id, agency.is_active)}
                    title={agency.is_active ? "Désactiver" : "Activer"}
                  >
                    {agency.is_active ? (
                      <XSquare className="text-destructive" />
                    ) : (
                      <CheckSquare className="text-success" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => console.log("Edit agency:", agency.id)}
                    title="Modifier"
                  >
                    <Edit className="text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(agency.id)}
                    title="Supprimer"
                  >
                    <Trash className="text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}