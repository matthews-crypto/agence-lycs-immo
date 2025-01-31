import { Button } from "@/components/ui/button"
import { AgencyInfoDialog } from "@/components/agency/settings/AgencyInfoDialog"
import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AgencySidebar } from "@/components/agency/AgencySidebar"

export default function AgencySettingsPage() {
  const [showAgencyInfoDialog, setShowAgencyInfoDialog] = useState(false)

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">Configuration de l'agence</h1>
            
            <div className="space-y-6">
              <div className="bg-card rounded-lg p-6 border">
                <h2 className="text-lg font-semibold mb-4">Informations générales</h2>
                <p className="text-muted-foreground mb-4">
                  Gérez les informations de base de votre agence et de l'administrateur
                </p>
                <Button 
                  onClick={() => setShowAgencyInfoDialog(true)}
                >
                  Informations agence
                </Button>
              </div>
            </div>

            <AgencyInfoDialog 
              open={showAgencyInfoDialog} 
              onOpenChange={setShowAgencyInfoDialog}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}