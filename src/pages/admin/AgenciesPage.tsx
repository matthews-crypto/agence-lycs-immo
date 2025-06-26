import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AgenciesTable } from "@/components/admin/agencies/AgenciesTable"

import { useState } from "react"

export default function AdminAgenciesPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7c1e0] via-[#f5e6fa] to-[#e8d3fc] font-sans">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-[#f472b6]/30 shadow-sm">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center md:justify-between py-7 px-4 gap-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 text-transparent bg-clip-text bg-gradient-to-r from-[#f472b6] via-[#e879f9] to-[#a21caf]">Gestion des agences</h1>
            <p className="text-[#a21caf] text-base md:text-lg font-medium">Administration centralisée de toutes les agences immobilières de la plateforme.</p>
          </div>
          <Button size="lg" className="bg-gradient-to-tr from-[#f472b6] to-[#a21caf] text-white shadow-lg hover:brightness-110 transition-all" onClick={() => navigate("/admin/agencies/create")}> 
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle agence
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-2 md:px-4 py-10 space-y-10">
        {/* Zone d'information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-gradient-to-br from-[#fdf2f8] to-[#f3e8ff] p-6 shadow-lg flex flex-col gap-2 border border-[#f472b6]/20">
            <h2 className="font-semibold text-lg text-[#a21caf] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#f472b6]" />
              Astuce
            </h2>
            <p className="text-[#a21caf]">
              Utilisez le bouton <span className="font-bold">Nouvelle agence</span> pour ajouter rapidement une nouvelle structure. Vous pouvez activer/désactiver les services Immo, Locative ou Copro directement dans la liste.
            </p>
          </div>
          {/* Zone de recherche/filtre */}
          <div className="rounded-3xl bg-white/95 p-6 shadow-lg flex flex-col gap-2 border border-[#f472b6]/20">
            <label htmlFor="search-agency" className="font-semibold text-[#a21caf] mb-1">Recherche agence</label>
            <input
              id="search-agency"
              type="text"
              placeholder="Nom, email ou téléphone..."
              className="w-full rounded-xl border border-[#f472b6]/20 focus:border-[#a21caf] focus:ring-2 focus:ring-[#f472b6]/30 px-4 py-2 text-base transition outline-none shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Table des agences dans une carte */}
        <div className="rounded-3xl shadow-lg bg-white/95 p-4 md:p-8 border border-[#f472b6]/20 hover:shadow-2xl transition-all">
          <AgenciesTable searchTerm={searchTerm} />
        </div>
      </main>
    </div>
  )
}