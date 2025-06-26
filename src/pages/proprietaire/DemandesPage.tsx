import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyContext } from "@/contexts/AgencyContext";
import { useAgencyAuthStore } from "@/stores/useAgencyAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { FileText, Plus, Edit, Eye, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const DEMANDE_TYPES = [
  { value: "paiement_charge", label: "Paiement / Charge" },
  { value: "declaration_depannage", label: "Déclaration / Dépannage" },
  { value: "entretien_menuiserie", label: "Entretien Menuiserie" },
  { value: "entretien_electricite", label: "Entretien Électricité" },
  { value: "entretien_plomberie", label: "Entretien Plomberie" },
];

interface Demande {
  id: number;
  proprietaire_id: number;
  type_demande: string;
  description: string;
  date_creation: string;
  statut: "traitee" | "non_traitee";
  fichier_joint: string | null;
  date_traitement: string | null;
  agence_id: string;
}

export default function ProprietaireDemandesPage() {
  const { agency } = useAgencyContext();
  const { user } = useAgencyAuthStore();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: "", description: "", file: null as File | null });
  const [submitting, setSubmitting] = useState(false);
  const [proprietaireId, setProprietaireId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Demande | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ description: "", file: null as File | null });

  // Récupérer le proprietaire_id
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

  // Récupérer les demandes du propriétaire
  useEffect(() => {
    const fetchDemandes = async () => {
      if (!proprietaireId || !agency?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("demandes")
        .select("*")
        .eq("proprietaire_id", proprietaireId)
        .eq("agence_id", agency.id)
        .order("date_creation", { ascending: false });
      if (!error && data) setDemandes(data);
      setLoading(false);
    };
    fetchDemandes();
  }, [proprietaireId, agency]);

  // Sections par type
  const demandesPaiement = useMemo(() => demandes.filter(d => d.type_demande === "paiement_charge"), [demandes]);
  const demandesDeclaration = useMemo(() => demandes.filter(d => d.type_demande === "declaration_depannage"), [demandes]);
  const demandesEntretienMenuiserie = useMemo(() => demandes.filter(d => d.type_demande === "entretien_menuiserie"), [demandes]);
  const demandesEntretienElectricite = useMemo(() => demandes.filter(d => d.type_demande === "entretien_electricite"), [demandes]);
  const demandesEntretienPlomberie = useMemo(() => demandes.filter(d => d.type_demande === "entretien_plomberie"), [demandes]);

  // Création de demande
  const handleSubmit = async () => {
    if (!form.type || !form.description) return;
    setSubmitting(true);
    let filePath = null;
    if (form.file) {
      const ext = form.file.name.split('.').pop();
      filePath = `demandes/${proprietaireId}_${Date.now()}.${ext}`;
      await supabase.storage.from('justificatifs').upload(filePath, form.file);
    }
    await supabase.from("demandes").insert({
      proprietaire_id: proprietaireId,
      agence_id: agency.id,
      type_demande: form.type,
      description: form.description,
      fichier_joint: filePath,
      statut: "non_traitee",
      date_creation: new Date().toISOString(),
    });
    setShowModal(false);
    setForm({ type: "", description: "", file: null });
    setSubmitting(false);
    // Refresh
    const { data } = await supabase
      .from("demandes")
      .select("*")
      .eq("proprietaire_id", proprietaireId)
      .eq("agence_id", agency.id)
      .order("date_creation", { ascending: false });
    if (data) setDemandes(data);
  };

  // Edition demande
  const handleEdit = async () => {
    if (!editId || !editForm.description) return;
    setSubmitting(true);
    let filePath = null;
    if (editForm.file) {
      const ext = editForm.file.name.split('.').pop();
      filePath = `demandes/${proprietaireId}_${Date.now()}.${ext}`;
      await supabase.storage.from('justificatifs').upload(filePath, editForm.file);
    }
    await supabase.from("demandes").update({
      description: editForm.description,
      ...(filePath ? { fichier_joint: filePath } : {}),
    }).eq("id", editId);
    setEditId(null);
    setEditForm({ description: "", file: null });
    setSubmitting(false);
    // Refresh
    const { data } = await supabase
      .from("demandes")
      .select("*")
      .eq("proprietaire_id", proprietaireId)
      .eq("agence_id", agency.id)
      .order("date_creation", { ascending: false });
    if (data) setDemandes(data);
  };

  // Helpers
  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return format(parseISO(dateStr), "dd MMM yyyy", { locale: fr });
  }
  function truncate(str: string, n: number) {
    return str.length > n ? str.slice(0, n) + "..." : str;
  }

  return (
    <div className="container p-4 md:p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes demandes</h1>
          <p className="text-muted-foreground">Créez et suivez vos demandes auprès de l'agence</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-1" /> Créer une demande</Button>
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (
        <>
          {/* Section Paiements/Charges */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Demandes Paiements / Charges ({demandesPaiement.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <DemandesTable demandes={demandesPaiement} setDetail={setDetail} setEditId={setEditId} />
            </CardContent>
          </Card>
          {/* Section Déclaration/Dépannage */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Demandes Déclaration / Dépannage ({demandesDeclaration.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <DemandesTable demandes={demandesDeclaration} setDetail={setDetail} setEditId={setEditId} />
            </CardContent>
          </Card>
          {/* Section Entretien */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Demandes Entretien Menuiserie ({demandesEntretienMenuiserie.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <DemandesTable demandes={demandesEntretienMenuiserie} setDetail={setDetail} setEditId={setEditId} />
            </CardContent>
          </Card>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Demandes Entretien Électricité ({demandesEntretienElectricite.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <DemandesTable demandes={demandesEntretienElectricite} setDetail={setDetail} setEditId={setEditId} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Demandes Entretien Plomberie ({demandesEntretienPlomberie.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <DemandesTable demandes={demandesEntretienPlomberie} setDetail={setDetail} setEditId={setEditId} />
            </CardContent>
          </Card>
        </>
      )}
      {/* Modal création demande */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une demande</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Type de demande" /></SelectTrigger>
              <SelectContent>
                {DEMANDE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Décrivez votre demande..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={3} />
            <Input type="file" accept="application/pdf,image/*" onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))} />
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={submitting || !form.type || !form.description}>Soumettre demande</Button>
            <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal détail demande */}
      <Dialog open={!!detail} onOpenChange={v => !v && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail de la demande</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col gap-2">
              <div><b>Type :</b> {DEMANDE_TYPES.find(t => t.value === detail.type_demande)?.label}</div>
              <div><b>Description :</b> {detail.description}</div>
              <div><b>Date de création :</b> {formatDate(detail.date_creation)}</div>
              <div><b>Statut :</b> <Badge className={detail.statut === "traitee" ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}>{detail.statut === "traitee" ? "Traitée" : "Non traitée"}</Badge></div>
              {detail.fichier_joint && <div><b>Fichier joint :</b> <a href={supabase.storage.from('justificatifs').getPublicUrl(detail.fichier_joint).data.publicUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary flex items-center gap-1"><FileText className="h-4 w-4" /> Voir</a></div>}
              {detail.statut === "traitee" && <div><b>Date de traitement :</b> {formatDate(detail.date_traitement)}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Modal édition demande */}
      <Dialog open={!!editId} onOpenChange={v => !v && setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la demande</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Textarea placeholder="Décrivez votre demande..." value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} required rows={3} />
            <Input type="file" accept="application/pdf,image/*" onChange={e => setEditForm(f => ({ ...f, file: e.target.files?.[0] || null }))} />
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={submitting || !editForm.description}>Enregistrer</Button>
            <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tableau des demandes (sous composant)
function DemandesTable({ demandes, setDetail, setEditId }: {
  demandes: Demande[];
  setDetail: (d: Demande) => void;
  setEditId: (id: number) => void;
}) {
  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: fr });
  }
  function truncate(str: string, n: number) {
    return str.length > n ? str.slice(0, n) + "..." : str;
  }
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="p-2 text-left">Date</th>
          <th className="p-2 text-left">Type</th>
          <th className="p-2 text-left">Description</th>
          <th className="p-2 text-left">Statut</th>
          <th className="p-2 text-left">Fichier</th>
          <th className="p-2 text-left">Date traitement</th>
          <th className="p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {demandes.length === 0 ? (
          <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Aucune demande</td></tr>
        ) : demandes.map(d => (
          <tr key={d.id} className="border-b">
            <td className="p-2">{formatDate(d.date_creation)}</td>
            <td className="p-2">{DEMANDE_TYPES.find(t => t.value === d.type_demande)?.label}</td>
            <td className="p-2">{truncate(d.description, 40)}</td>
            <td className="p-2">
              <Badge className={d.statut === "traitee" ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}>{d.statut === "traitee" ? "Traitée" : "Non traitée"}</Badge>
            </td>
            <td className="p-2">
              {d.fichier_joint ? (
                <a href={supabase.storage.from('justificatifs').getPublicUrl(d.fichier_joint).data.publicUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary flex items-center gap-1"><FileText className="h-4 w-4" /> Télécharger</a>
              ) : (
                <span className="text-xs text-gray-400">Aucun</span>
              )}
            </td>
            <td className="p-2">{d.statut === "traitee" ? formatDate(d.date_traitement) : <span className="text-xs text-gray-400">-</span>}</td>
            <td className="p-2 flex gap-2">
              <Button size="icon" variant="outline" onClick={() => setDetail(d)} title="Voir détail"><Eye className="h-4 w-4" /></Button>
              {d.statut === "non_traitee" && (
                <Button size="icon" variant="secondary" onClick={() => { setEditId(d.id); setEditForm({ description: d.description, file: null }); }} title="Modifier"><Edit className="h-4 w-4" /></Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
