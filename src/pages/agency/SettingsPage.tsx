import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AgencySettingsDialog } from "@/components/agency/settings/AgencySettingsDialog"

export default function SettingsPage() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Configuration</h1>
      
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Informations agence</h2>
          <p className="text-muted-foreground mb-4">
            Gérez les informations de votre agence, comme le nom, les coordonnées et l'apparence.
          </p>
          <Button onClick={() => setShowDialog(true)}>
            Modifier les informations
          </Button>
        </Card>
      </div>

      <AgencySettingsDialog 
        open={showDialog} 
        onOpenChange={setShowDialog} 
      />
    </div>
  )
}