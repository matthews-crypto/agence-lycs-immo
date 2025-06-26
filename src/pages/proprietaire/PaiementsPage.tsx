import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useAgencyAuthStore } from "@/stores/useAgencyAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Upload, Download, FileText, Search } from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

interface Paiement {
  id: number;
  proprietaire_id: number;
  type_paiement: string;
  appel_de_fond_id: number | null;
  montant: number;
  description: string | null;
  date_ajout: string;
  statut: "paye" | "non_paye";
  fichier_facture_recu: string | null;
  agence_id: string;
}

export default function ProprietairePaiementsPage() {
  const { agency } = useAgencyContext();
  const { user } = useAgencyAuthStore();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [filtered, setFiltered] = useState<Paiement[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("tous");
  const [statutFilter, setStatutFilter] = useState<string>("tous");
  const [search, setSearch] = useState("");
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [fileMap, setFileMap] = useState<{ [k: number]: File | null }>({});
  const [loading, setLoading] = useState(true);

  // Récupérer le proprietaire_id
  const [proprietaireId, setProprietaireId] = useState<number | null>(null);
  useEffect(() => {
    const fetchProprio = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || user?.email;
      if (!email || !agency?.id) return;
      const { data: proprietaires } = await supabase
        .from("proprietaire")
        .select("id")
        .eq("adresse_email", email)
        .eq("agenceID", agency.id);
      if (proprietaires && proprietaires.length > 0) {
        setProprietaireId(proprietaires[0].id);
      }
    };
    fetchProprio();
  }, [user, agency]);

  // Récupérer les paiements du propriétaire
  useEffect(() => {
    const fetchPaiements = async () => {
      if (!proprietaireId || !agency?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("paiements")
        .select("*")
        .eq("proprietaire_id", proprietaireId)
        .eq("agence_id", agency.id)
        .order("date_ajout", { ascending: false });
      if (!error && data) {
        setPaiements(data);
        setFiltered(data);
      }
      setLoading(false);
    };
    fetchPaiements();
  }, [proprietaireId, agency]);

  // Filtres et recherche
  useEffect(() => {
    let result = [...paiements];
    if (typeFilter !== "tous") result = result.filter(p => p.type_paiement === typeFilter);
    if (statutFilter !== "tous") result = result.filter(p => p.statut === statutFilter);
    if (dateStart && dateEnd) {
      result = result.filter(p => {
        const d = parseISO(p.date_ajout);
        return isWithinInterval(d, { start: parseISO(dateStart), end: parseISO(dateEnd) });
      });
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        (p.description?.toLowerCase().includes(s) || "".includes(s)) ||
        (p.type_paiement?.toLowerCase().includes(s))
      );
    }
    setFiltered(result);
  }, [paiements, typeFilter, statutFilter, dateStart, dateEnd, search]);

  // Upload justificatif
  const handleFileChange = (id: number, file: File | null) => {
    setFileMap(prev => ({ ...prev, [id]: file }));
  };
  const handleUpload = async (id: number) => {
    if (!fileMap[id]) return;
    setUploadingId(id);
    const file = fileMap[id]!;
    const ext = file.name.split('.').pop();
    const path = `paiements/${id}_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('justificatifs').upload(path, file);
    if (!uploadError) {
      // Update paiement
      await supabase.from("paiements").update({ fichier_facture_recu: path, statut: "paye" }).eq("id", id);
      // Refresh
      const updated = paiements.map(p => p.id === id ? { ...p, fichier_facture_recu: path, statut: "paye" } : p);
      setPaiements(updated);
      setFiltered(updated);
      setFileMap(prev => ({ ...prev, [id]: null }));
    }
    setUploadingId(null);
  };

  // Export PDF/Excel (simple CSV export)
  const handleExport = (format: "csv" | "excel") => {
    let content = "Date;Type;Description;Montant;Statut\n";
    filtered.forEach(p => {
      content += `${formatDate(p.date_ajout)};${p.type_paiement};${p.description || ""};${p.montant} ${"FCFA"};${p.statut}\n`;
    });
    const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paiements_${formatDate(new Date().toISOString())}.${format === "csv" ? "csv" : "xls"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helpers
  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return format(parseISO(dateStr), "dd MMM yyyy", { locale: fr });
  }

  // Séparation sections
  const paiementsAppels = useMemo(() => filtered.filter(p => p.type_paiement === "appel_de_fond"), [filtered]);
  const paiementsTravaux = useMemo(() => filtered.filter(p => p.type_paiement === "travaux_entretien"), [filtered]);

  return (
    <div className="container p-4 md:p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes paiements</h1>
          <p className="text-muted-foreground">Consultez et gérez vos paiements et justificatifs</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Recherche..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type de paiement" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous types</SelectItem>
              <SelectItem value="appel_de_fond">Appel de fond</SelectItem>
              <SelectItem value="travaux_entretien">Travaux d'entretien</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous statuts</SelectItem>
              <SelectItem value="paye">Payé</SelectItem>
              <SelectItem value="non_paye">Non payé</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-36" />
          <span>au</span>
          <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-36" />
          <Button variant="outline" onClick={() => handleExport("csv")}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (
        <>
          {/* Section Appels de fond */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Paiements liés aux appels de fond ({paiementsAppels.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <PaiementsTable paiements={paiementsAppels} onFileChange={handleFileChange} onUpload={handleUpload} uploadingId={uploadingId} fileMap={fileMap} />
            </CardContent>
          </Card>
          {/* Section Travaux d'entretien */}
          <Card>
            <CardHeader>
              <CardTitle>Paiements liés aux travaux d'entretien ({paiementsTravaux.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <PaiementsTable paiements={paiementsTravaux} onFileChange={handleFileChange} onUpload={handleUpload} uploadingId={uploadingId} fileMap={fileMap} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Tableau des paiements (sous composant)
function PaiementsTable({ paiements, onFileChange, onUpload, uploadingId, fileMap }: {
  paiements: Paiement[];
  onFileChange: (id: number, file: File | null) => void;
  onUpload: (id: number) => void;
  uploadingId: number | null;
  fileMap: { [k: number]: File | null };
}) {
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="p-2 text-left">Date</th>
          <th className="p-2 text-left">Type</th>
          <th className="p-2 text-left">Description</th>
          <th className="p-2 text-left">Montant</th>
          <th className="p-2 text-left">Statut</th>
          <th className="p-2 text-left">Justificatif</th>
          <th className="p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {paiements.length === 0 ? (
          <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Aucun paiement</td></tr>
        ) : paiements.map(p => (
          <tr key={p.id} className="border-b">
            <td className="p-2">{format(parseISO(p.date_ajout), "dd/MM/yyyy")}</td>
            <td className="p-2">{p.type_paiement === "appel_de_fond" ? "Appel de fond" : "Travaux d'entretien"}</td>
            <td className="p-2">{p.description}</td>
            <td className="p-2 font-semibold">{p.montant.toLocaleString("fr-FR", { style: "currency", currency: "XAF" })}</td>
            <td className="p-2">
              <Badge className={p.statut === "paye" ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}>
                {p.statut === "paye" ? "Payé" : "Non payé"}
              </Badge>
            </td>
            <td className="p-2">
              {p.fichier_facture_recu ? (
                <a href={supabase.storage.from('justificatifs').getPublicUrl(p.fichier_facture_recu).data.publicUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary flex items-center gap-1"><FileText className="h-4 w-4" /> Voir</a>
              ) : (
                <span className="text-xs text-gray-400">Aucun</span>
              )}
            </td>
            <td className="p-2">
              {p.statut === "non_paye" && (
                <div className="flex flex-col gap-1">
                  <Input type="file" accept="application/pdf,image/*" className="w-40" onChange={e => onFileChange(p.id, e.target.files?.[0] || null)} />
                  <Button size="sm" variant="secondary" disabled={uploadingId === p.id || !fileMap[p.id]} onClick={() => onUpload(p.id)}>
                    {uploadingId === p.id ? "Envoi..." : <><Upload className="h-4 w-4 mr-1" /> Joindre justificatif</>}
                  </Button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
