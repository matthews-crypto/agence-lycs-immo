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
import { Edit, Trash, CheckSquare, XSquare, Home, Key, Building2 } from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

interface Agency {
  id: string;
  agency_name: string;
  contact_email: string;
  city: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  primary_color?: string;
  secondary_color?: string;
  isImmo?: boolean;
  isLocative?: boolean;
  isCopro?: boolean;
  [key: string]: any;
}

/**
 * Table des agences avec filtrage côté front
 * @param searchTerm string - filtre par nom, email ou téléphone
 */
export function AgenciesTable({ searchTerm = "" }: { searchTerm?: string }) {
  const navigate = useNavigate()
  const { data: agencies, isLoading, refetch } = useQuery<Agency[]>({
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

  const handleEdit = (id: string) => {
    navigate(`/admin/agencies/${id}/edit`)
  }

  // Toggle service activation for Immo, Locative, Copro
  const handleToggleService = async (id: string, field: 'isImmo' | 'isLocative' | 'isCopro', value: boolean) => {
    try {
      const { error } = await supabase
        .from('agencies')
        .update({ [field]: !value })
        .eq('id', id)
      if (error) throw error
      toast.success(`Service ${
        field === 'isImmo' ? 'Immo' : field === 'isLocative' ? 'Locative' : 'Copropriété'
      } ${!value ? 'activé' : 'désactivé'} avec succès`)
      refetch()
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du service")
    }
  }

  // Filtrage côté front sur nom, email ou téléphone
  const filteredAgencies = agencies?.filter((agency) => {
    if (!searchTerm?.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      agency.agency_name?.toLowerCase().includes(term) ||
      agency.contact_email?.toLowerCase().includes(term) ||
      agency.contact_phone?.replace(/\s+/g, '').includes(term.replace(/\s+/g, ''))
    );
  });

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
          {filteredAgencies?.map((agency) => (
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
                  {/* Toggle Immo */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleService(agency.id, 'isImmo', agency.isImmo)}
                    title={agency.isImmo ? "Désactiver Immo" : "Activer Immo"}
                  >
                    <Home className={agency.isImmo ? "h-4 w-4 text-green-500" : "h-4 w-4 text-gray-400"} />
                  </Button>
                  {/* Toggle Locative */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleService(agency.id, 'isLocative', agency.isLocative)}
                    title={agency.isLocative ? "Désactiver Locative" : "Activer Locative"}
                  >
                    <Key className={agency.isLocative ? "h-4 w-4 text-green-500" : "h-4 w-4 text-gray-400"} />
                  </Button>
                  {/* Toggle Copro */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleService(agency.id, 'isCopro', agency.isCopro)}
                    title={agency.isCopro ? "Désactiver Copropriété" : "Activer Copropriété"}
                  >
                    <Building2 className={agency.isCopro ? "h-4 w-4 text-green-500" : "h-4 w-4 text-gray-400"} />
                  </Button>
                  {/* Statut général */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStatusChange(agency.id, agency.is_active)}
                    title={agency.is_active ? "Désactiver" : "Activer"}
                  >
                    {agency.is_active ? (
                      <XSquare className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckSquare className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                  {/* Edit */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(agency.id)}
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4 text-blue-500" />
                  </Button>
                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(agency.id)}
                    title="Supprimer"
                  >
                    <Trash className="h-4 w-4 text-red-500" />
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