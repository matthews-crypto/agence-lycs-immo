import { StatsCards } from "@/components/admin/dashboard/StatsCards"
import { RecentAgencies } from "@/components/admin/dashboard/RecentAgencies"
import { QuickActions } from "@/components/admin/dashboard/QuickActions"

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center md:justify-between py-6 px-4 gap-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-1">Tableau de bord administrateur</h1>
            <p className="text-gray-500 text-base md:text-lg">Bienvenue sur l’espace d’administration de la plateforme. Suivez l’activité des agences et accédez rapidement à toutes les fonctions clés.</p>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-10 space-y-10">
        {/* Statistiques principales */}
        <section>
          <StatsCards />
        </section>
        {/* Widgets */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-2xl shadow-xl bg-white p-4 md:p-8 border border-gray-100 flex flex-col gap-6">
            <RecentAgencies />
          </div>
          <div className="rounded-2xl shadow-xl bg-white p-4 md:p-8 border border-gray-100 flex flex-col gap-6">
            <QuickActions />
          </div>
        </section>
      </main>
    </div>
  )
}