import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, isWithinInterval, parseISO } from "date-fns";

const STATUTS = [
  { value: "all", label: "Tous" },
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
];

const PAGE_SIZE = 10;

export default function AppelsDeFondListPage() {
  const { agency } = useAgencyContext();
  const navigate = useNavigate();
  const [statutFilter, setStatutFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Appels de fond
  const { data: appels, isLoading } = useQuery({
    queryKey: ["appels_de_fond", agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const { data } = await (supabase as any)
        .from("appels_de_fond")
        .select("*")
        .eq("agence_id", agency.id)
        .order("date_creation", { ascending: false });
      return data || [];
    },
    enabled: !!agency?.id,
  });

  // Liaisons propriétaires pour taux recouvrement
  const { data: liaisons } = useQuery({
    queryKey: ["appels_de_fond_proprietaires", agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];
      const { data } = await (supabase as any)
        .from("appels_de_fond_proprietaires")
        .select("appel_de_fond_id, montant_du, statut_paiement")
        .eq("agence_id", agency.id);
      return data || [];
    },
    enabled: !!agency?.id,
  });

  // Filtrage
  const appelsFiltres = useMemo(() => {
    let items = appels || [];
    if (statutFilter !== "all") items = items.filter((a: any) => a.statut === statutFilter);
    if (search) items = items.filter((a: any) => a.titre.toLowerCase().includes(search.toLowerCase()));
    if (dateFilter) {
      const date = parseISO(dateFilter);
      items = items.filter((a: any) => isWithinInterval(parseISO(a.date_creation), {
        start: date,
        end: date,
      }));
    }
    return items;
  }, [appels, statutFilter, search, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(appelsFiltres.length / PAGE_SIZE);
  const paginated = appelsFiltres.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Calcul taux recouvrement par appel de fond
  function getTauxRecouvrement(appelId: number, montantTotal: number) {
    if (!liaisons) return "-";
    const lignes = liaisons.filter((l: any) => l.appel_de_fond_id === appelId);
    const totalPaye = lignes.filter((l: any) => l.statut_paiement === "paye").reduce((sum: number, l: any) => sum + Number(l.montant_du || 0), 0);
    if (!montantTotal || montantTotal === 0) return "0%";
    return Math.round((totalPaye / montantTotal) * 100) + "%";
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Appels de fond</h1>
        <Button onClick={() => navigate(`/${agency?.slug}/copro/appels-de-fond/create`)}>
          Créer un appel de fond
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 mb-4">
        <Input
          placeholder="Recherche par titre..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Select value={statutFilter} onValueChange={v => { setStatutFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUTS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={e => { setDateFilter(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
      </div>
      <div className="w-full max-w-7xl mx-auto bg-gray-50 rounded-lg shadow-md p-6 mt-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Appels de fond</h1>
        <Table>
          <TableHeader className="bg-blue-100">
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Montant total</TableHead>
              <TableHead>Date création</TableHead>
              <TableHead>Date échéance</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Taux recouvrement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Chargement…</TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={6}>Aucun appel de fond</TableCell></TableRow>
            ) : paginated.map((appel: any) => (
              <TableRow
                key={appel.id}
                className="cursor-pointer hover:bg-blue-50 transition"
                onClick={() => navigate(`/${agency?.slug}/copro/appels-de-fond/${appel.id}`)}
              >
                <TableCell className="font-semibold">{appel.titre}</TableCell>
                <TableCell>{Number(appel.montant_total).toLocaleString()} FCFA</TableCell>
                <TableCell>{appel.date_creation ? format(new Date(appel.date_creation), "dd/MM/yyyy") : "-"}</TableCell>
                <TableCell>{appel.date_echeance ? format(new Date(appel.date_echeance), "dd/MM/yyyy") : "-"}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${appel.statut === "en_cours" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-800"}`}>
                    {appel.statut === "en_cours" ? "En cours" : "Terminé"}
                  </span>
                </TableCell>
                <TableCell>{getTauxRecouvrement(appel.id, Number(appel.montant_total))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span>
          Page {page} / {totalPages || 1}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
          <Button variant="outline" size="sm" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>Suivant</Button>
        </div>
      </div>
    </div>
  );
}
