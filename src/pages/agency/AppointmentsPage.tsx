
import { useParams } from "react-router-dom"
import { AgencySidebar } from "@/components/agency/AgencySidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAgencyContext } from "@/contexts/AgencyContext"
import { Button } from "@/components/ui/button"
import { CalendarIcon, FilterIcon, PlusIcon } from "lucide-react"
import { format } from "date-fns"

export default function AppointmentsPage() {
  const { agencySlug } = useParams()
  const { agency } = useAgencyContext()

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["agency-appointments", agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          properties (
            id,
            title,
            zone_id,
            zone (
              id,
              nom
            )
          ),
          clients (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          agents (
            id,
            first_name,
            last_name
          )
        `)
        .eq("agency_id", agency.id)
        .order("appointment_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!agency?.id,
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AgencySidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Rendez-vous</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FilterIcon className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
              <Button 
                style={{ backgroundColor: agency?.primary_color }}
                size="sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Nouveau rendez-vous
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">Chargement des rendez-vous...</div>
          ) : appointments && appointments.length > 0 ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bien immobilier
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {format(new Date(appointment.appointment_date), 'dd/MM/yyyy')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(appointment.appointment_date), 'HH:mm')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.clients?.first_name} {appointment.clients?.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {appointment.clients?.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {appointment.clients?.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {appointment.properties?.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {appointment.properties?.zone?.nom}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {appointment.agents?.first_name} {appointment.agents?.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                            appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {appointment.status === 'CONFIRMED' ? 'Confirmé' : 
                           appointment.status === 'PENDING' ? 'En attente' : 'Annulé'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-white shadow rounded-lg">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun rendez-vous</h3>
              <p className="text-gray-500 mb-4">Vous n'avez pas encore de rendez-vous programmés.</p>
              <Button 
                style={{ backgroundColor: agency?.primary_color }}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Créer un rendez-vous
              </Button>
            </div>
          )}
        </div>
      </div>
    </SidebarProvider>
  )
}
