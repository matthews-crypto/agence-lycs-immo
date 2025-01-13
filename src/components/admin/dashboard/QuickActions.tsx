import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions Rapides</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button 
          onClick={() => navigate("/admin/agencies/create")}
          className="flex-1"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Agence
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate("/admin/agencies")}
          className="flex-1"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Gérer les Agences
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate("/admin/settings")}
          className="flex-1"
        >
          <Settings className="mr-2 h-4 w-4" />
          Paramètres
        </Button>
      </CardContent>
    </Card>
  )
}