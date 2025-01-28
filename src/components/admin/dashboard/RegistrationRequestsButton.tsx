import { Bell } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export function RegistrationRequestsButton() {
  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-registration-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demande_inscription')
        .select('id')
        .eq('status', 'EN_ATTENTE')
      
      if (error) throw error
      return data?.length || 0
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  })

  return (
    <Button
      variant="ghost"
      className="w-full justify-start relative"
      asChild
    >
      <Link to="/admin/registration-requests">
        <Bell className="h-4 w-4 mr-2" />
        Demandes d'inscription
        {pendingRequests > 0 && (
          <span className="absolute top-0 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {pendingRequests}
          </span>
        )}
      </Link>
    </Button>
  )
}