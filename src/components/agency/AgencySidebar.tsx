import { Link } from "react-router-dom"
import { useAgencyContext } from "@/contexts/AgencyContext"
import { Button } from "@/components/ui/button"
import {
  Building2,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react"

export function AgencySidebar() {
  const { agency } = useAgencyContext()

  return (
    <div className="h-full border-r bg-background lg:w-64">
      <div className="flex h-16 items-center border-b px-4">
        <Link to={`/${agency?.slug}`} className="flex items-center gap-2 font-semibold">
          {agency?.logo_url ? (
            <img
              src={agency.logo_url}
              alt={agency.agency_name}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <Building2 className="h-6 w-6" />
          )}
          <span className="hidden lg:inline">{agency?.agency_name}</span>
        </Link>
      </div>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Link to={`/${agency?.slug}/agency/dashboard`}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden lg:inline-block">
                  Tableau de bord
                </span>
              </Button>
            </Link>
            <Link to={`/${agency?.slug}/agency/agents`}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden lg:inline-block">Agents</span>
              </Button>
            </Link>
            <Link to={`/${agency?.slug}/agency/settings`}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden lg:inline-block">Configuration</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}