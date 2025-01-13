import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Clock, UserCheck2, UserX2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'agencies', 'stats'],
    queryFn: async () => {
      const [totalResult, activeResult, inactiveResult, recentResult] = await Promise.all([
        supabase.from('agencies').select('*', { count: 'exact', head: true }),
        supabase.from('agencies').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('agencies').select('*', { count: 'exact', head: true }).eq('is_active', false),
        supabase.from('agencies').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ])

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        inactive: inactiveResult.count || 0,
        recent: recentResult.count || 0
      }
    }
  })

  if (isLoading) {
    return <div>Chargement des statistiques...</div>
  }

  const cards = [
    {
      title: "Total Agences",
      value: stats?.total || 0,
      icon: Building2,
      color: "text-blue-500"
    },
    {
      title: "Agences Actives",
      value: stats?.active || 0,
      icon: UserCheck2,
      color: "text-green-500"
    },
    {
      title: "Agences Inactives",
      value: stats?.inactive || 0,
      icon: UserX2,
      color: "text-red-500"
    },
    {
      title: "Nouvelles (30j)",
      value: stats?.recent || 0,
      icon: Clock,
      color: "text-purple-500"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}