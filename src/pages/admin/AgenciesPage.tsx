import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AgenciesTable } from "@/components/admin/agencies/AgenciesTable"

import { useState } from "react"

export default function AdminAgenciesPage() {
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="container mx-auto flex items-center justify-between py-6 px-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-1">Gestion des agences</h1>
            <p className="text-gray-500 text-base md:text-lg">Administration centralisée de toutes les agences immobilières de la plateforme.</p>
          </div>
          <Button size="lg" className="bg-primary text-white shadow-lg hover:bg-primary/90" onClick={() => navigate("/admin/agencies/create")}> 
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle agence
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 space-y-8">
        {/* Zone d'information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-md flex flex-col gap-2">
            <h2 className="font-semibold text-lg text-blue-700 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Astuce
            </h2>
            <p className="text-gray-700">
              Utilisez le bouton <span className="font-bold">Nouvelle agence</span> pour ajouter rapidement une nouvelle structure. Vous pouvez activer/désactiver les services Immo, Locative ou Copro directement dans la liste.
            </p>
          </div>
          {/* Préparation d'une future zone de recherche/filtre */}
          <div className="rounded-2xl bg-white p-6 shadow-md flex flex-col gap-2 border border-gray-100">
            <label htmlFor="search-agency" className="font-semibold text-gray-700 mb-1">Recherche agence</label>
            <input
              id="search-agency"
              type="text"
              placeholder="Nom, email ou téléphone..."
              className="input input-bordered w-full rounded-lg border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Table des agences dans une carte */}
        <div className="rounded-2xl shadow-xl bg-white p-4 md:p-8 border border-gray-100">
          <AgenciesTable searchTerm={searchTerm} />
        </div>
      </main>
    </div>
  )
}