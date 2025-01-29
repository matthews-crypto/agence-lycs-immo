import { useState } from "react"
import { AgencyRegistrationDialog } from "@/components/agency-registration/AgencyRegistrationDialog"
import { Button } from "@/components/ui/button"

export default function IndexPage() {
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Bienvenue sur notre plateforme</h1>
        <p className="text-muted-foreground">
          Inscrivez votre agence immobilière et commencez à gérer vos biens
        </p>
        <Button 
          onClick={() => setShowRegistrationDialog(true)}
          style={{
            backgroundColor: '#aa1ca0',
          }}
        >
          Inscrire mon agence
        </Button>
      </div>

      <AgencyRegistrationDialog
        open={showRegistrationDialog}
        onOpenChange={setShowRegistrationDialog}
      />
    </div>
  )
}