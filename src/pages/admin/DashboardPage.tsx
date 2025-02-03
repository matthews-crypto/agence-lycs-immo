import { StatsCards } from "@/components/admin/dashboard/StatsCards"
import { RecentAgencies } from "@/components/admin/dashboard/RecentAgencies"
import { QuickActions } from "@/components/admin/dashboard/QuickActions"

export default function AdminDashboardPage() {
  return (
    <div className="container space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Tableau de bord administrateur
        </h1>
        <p className="text-muted-foreground">
          Gérez vos agences et suivez les performances globales de votre agence
        </p>
      </div>

      <StatsCards />
      
      <div className="grid gap-8 grid-cols-1">
        <RecentAgencies />
        <QuickActions />
      </div>
    </div>
  )
}