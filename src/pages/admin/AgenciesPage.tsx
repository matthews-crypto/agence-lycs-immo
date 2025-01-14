import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AgenciesTable } from "@/components/admin/agencies/AgenciesTable"

export default function AdminAgenciesPage() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Agences</h1>
          <p className="text-muted-foreground">
            Gérez les agences immobilières de la plateforme
          </p>
        </div>
        <Button onClick={() => navigate("/admin/agencies/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Créer une agence
        </Button>
      </div>

      <AgenciesTable />
    </div>
  )
}