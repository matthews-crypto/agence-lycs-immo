import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Briefcase, TrendingUp } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <div className="container space-y-8 p-8">
      {/* Header Section */}
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2 animate-fade-in">
          Tableau de bord administrateur
        </h1>
        <p className="text-gray-600">
          Gérez vos agences et suivez les performances globales
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Agences</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-gray-500">+2 ce mois</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Agents Actifs</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-gray-500">+5 cette semaine</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Propriétés Listées</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">284</div>
            <p className="text-xs text-gray-500">+28 ce mois</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <p className="text-xs text-gray-500">+2% ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="w-full animate-fade-in">
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Activity Items */}
            <div className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">Nouvelle agence ajoutée</h3>
                <p className="text-xs text-gray-500">Il y a 2 heures</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">5 nouveaux agents inscrits</h3>
                <p className="text-xs text-gray-500">Il y a 5 heures</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">28 nouvelles propriétés listées</h3>
                <p className="text-xs text-gray-500">Il y a 12 heures</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}