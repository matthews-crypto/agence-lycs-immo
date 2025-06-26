import { StatsCards } from "@/components/admin/dashboard/StatsCards"
import { RecentAgencies } from "@/components/admin/dashboard/RecentAgencies"
import { QuickActions } from "@/components/admin/dashboard/QuickActions"

import { Flame } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7c1e0] via-[#f5e6fa] to-[#e8d3fc] font-sans">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-[#f472b6]/30 shadow-sm">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center md:justify-between py-7 px-4 gap-2">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-gradient-to-tr from-[#f472b6] to-[#a21caf] p-2 shadow-lg">
              <Flame className="h-7 w-7 text-white" />
            </span>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 text-transparent bg-clip-text bg-gradient-to-r from-[#f472b6] via-[#e879f9] to-[#a21caf]">Tableau de bord administrateur</h1>
              <p className="text-[#a21caf] text-base md:text-lg font-medium">Bienvenue sur l’espace d’administration de la plateforme. Suivez l’activité des agences et accédez rapidement à toutes les fonctions clés.</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-2 md:px-4 py-10 space-y-12">
        {/* Statistiques principales */}
        <section>
          <div className="rounded-3xl bg-white/90 shadow-lg border border-[#f472b6]/30 p-4 md:p-8 hover:shadow-2xl transition-all">
            <StatsCards />
          </div>
        </section>
        {/* Widgets */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-3xl shadow-lg bg-white/95 p-4 md:p-8 border border-[#f472b6]/20 flex flex-col gap-6 hover:shadow-2xl transition-all">
            <RecentAgencies />
          </div>
          <div className="rounded-3xl shadow-lg bg-white/95 p-4 md:p-8 border border-[#f472b6]/20 flex flex-col gap-6 hover:shadow-2xl transition-all">
            <QuickActions />
          </div>
        </section>
      </main>
    </div>
  )
}