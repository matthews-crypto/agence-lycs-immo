
import { useParams } from "react-router-dom"
import { AgencySidebar } from "@/components/agency/AgencySidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function AppointmentsPage() {
  const { agencySlug } = useParams()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AgencySidebar />
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-4">Rendez-vous</h1>
          <p>Page des rendez-vous</p>
        </div>
      </div>
    </SidebarProvider>
  )
}
