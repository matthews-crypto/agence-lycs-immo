import { Button } from "@/components/ui/button"
import { AgencyInfoDialog } from "@/components/agency/settings/AgencyInfoDialog"
import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AgencySidebar } from "@/components/agency/AgencySidebar"
import { useAgencyContext } from "@/contexts/AgencyContext"
import { useNavigate } from "react-router-dom"
import { FileEdit } from "lucide-react"

export default function AgencySettingsPage() {
  const [showAgencyInfoDialog, setShowAgencyInfoDialog] = useState(false)
  const { agency } = useAgencyContext()
  const navigate = useNavigate()

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
                  style={{ backgroundColor: agency?.primary_color }}
                >
                  Informations agence
                </Button>
              </div>
              
              <div className="bg-card rounded-lg p-6 border">
                <h2 className="text-lg font-semibold mb-4">🧾 Éditer contrat</h2>
                <p className="text-muted-foreground mb-4">
                  Créez et personnalisez votre modèle de contrat avec mise en page libre et champs dynamiques
                </p>
                <Button 
                  onClick={() => navigate(`/${agency?.slug}/agency/contract-editor`)}
                  style={{ backgroundColor: agency?.primary_color }}
                  className="flex items-center gap-2"
                >
                  <FileEdit className="w-4 h-4" />
                  Éditeur de contrat
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