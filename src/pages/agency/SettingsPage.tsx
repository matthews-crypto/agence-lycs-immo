import { useState } from "react"
import { AgencySidebar } from "@/components/agency/AgencySidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { AgencyInfoDialog } from "@/components/agency/settings/AgencyInfoDialog"

export default function SettingsPage() {
  const [showAgencyInfo, setShowAgencyInfo] = useState(false)

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">Configuration</h1>
            
            <div className="space-y-6">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
                <Button 
                  onClick={() => setShowAgencyInfo(true)}
                  className="w-full sm:w-auto"
                >
                  Informations agence
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <AgencyInfoDialog 
        open={showAgencyInfo} 
        onOpenChange={setShowAgencyInfo}
      />
    </SidebarProvider>
  )
}