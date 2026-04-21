import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import type { PlanSlideProps } from "../types";
import type { Company } from "@/types/mentorship";
import CompanyMatchDialog from "../CompanyMatchDialog";

const statusLabels: Record<string, string> = {
  identified: "Identificado",
  connection_sent: "Convite Enviado",
  connected: "Conectado",
  message_sent: "Msg Enviada",
  replied: "Respondeu",
  meeting_scheduled: "Reunião Agendada",
};

const typeLabels: Record<string, string> = {
  decision_maker: "Decisor",
  hr: "RH",
  other: "Outro",
};

function fuzzyMatch(input: string, target: string): boolean {
  const a = input.toLowerCase().trim();
  const b = target.toLowerCase().trim();
  if (a === b) return true;
  if (a.length < 3) return false;
  // Check containment
  if (b.includes(a) || a.includes(b)) return true;
  // Check similarity (shared words)
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);
  const shared = wordsA.filter(w => w.length > 2 && wordsB.some(wb => wb.includes(w) || w.includes(wb)));
  return shared.length >= 1 && shared.length / Math.max(wordsA.length, wordsB.length) >= 0.5;
}

export default function MappingSlide({ plan, contacts, companies, onRefreshData }: PlanSlideProps) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", current_position: "", company: "", type: "decision_maker", tier: "A", linkedin_url: "" });
  const [matchDialog, setMatchDialog] = useState<{ open: boolean; contactCompany: string; matched: Company | null; pendingForm: typeof form | null }>({
    open: false, contactCompany: "", matched: null, pendingForm: null,
  });

  const findMatchingCompany = useCallback((companyName: string): Company | null => {
    if (!companyName.trim()) return null;
    // Exact match first
    const exact = companies.find(c => c.name.toLowerCase().trim() === companyName.toLowerCase().trim());
    if (exact) return exact;
    // Fuzzy match
    const fuzzy = companies.find(c => fuzzyMatch(companyName, c.name));
    return fuzzy || null;
  }, [companies]);

  const doAddContact = async (formData: typeof form, companyOverride?: string) => {
    if (!formData.name) return toast.error("Nome é obrigatório");

    // Check for duplicate by LinkedIn URL
    if (formData.linkedin_url?.trim()) {
      const normalizedUrl = formData.linkedin_url.trim().replace(/\/$/, "").toLowerCase();
      const duplicate = contacts.find(c => {
        if (!c.linkedin_url) return false;
        return c.linkedin_url.trim().replace(/\/$/, "").toLowerCase() === normalizedUrl;
      });
      if (duplicate) {
        toast.info(`Perfil já mapeado: ${duplicate.name}`);
        setForm({ name: "", current_position: "", company: "", type: "decision_maker", tier: "A", linkedin_url: "" });
        setAdding(false);
        return;
      }
    }

    const { error } = await supabase.from("contact_mappings").insert({
      plan_id: plan.id,
      name: formData.name,
      current_position: formData.current_position || null,
      company: companyOverride || formData.company || null,
      type: formData.type,
      tier: formData.tier,
      linkedin_url: formData.linkedin_url || null,
    });
    if (error) toast.error("Erro ao adicionar contato");
    else {
      toast.success("Contato adicionado!");
      setForm({ name: "", current_position: "", company: "", type: "decision_maker", tier: "A", linkedin_url: "" });
      setAdding(false);
      onRefreshData();
    }
  };

  const addContact = async () => {
    if (!form.name) return toast.error("Nome é obrigatório");

    if (form.company.trim()) {
      const matched = findMatchingCompany(form.company);
      if (matched && matched.name.toLowerCase().trim() !== form.company.toLowerCase().trim()) {
        // Fuzzy match found - ask user
        setMatchDialog({ open: true, contactCompany: form.company, matched, pendingForm: { ...form } });
        return;
      }
    }

    doAddContact(form);
  };

  const handleMatchConfirm = () => {
    if (matchDialog.pendingForm && matchDialog.matched) {
      doAddContact(matchDialog.pendingForm, matchDialog.matched.name);
    }
    setMatchDialog({ open: false, contactCompany: "", matched: null, pendingForm: null });
  };

  const handleMatchCancel = () => {
    if (matchDialog.pendingForm) {
      doAddContact(matchDialog.pendingForm);
    }
    setMatchDialog({ open: false, contactCompany: "", matched: null, pendingForm: null });
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from("contact_mappings").delete().eq("id", id);
    if (error) toast.error("Erro ao remover contato");
    else onRefreshData();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("contact_mappings").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else onRefreshData();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-1">
        <p className="text-primary text-sm tracking-[0.2em] font-medium">CONTROLE DE NETWORKING</p>
        <Button onClick={() => setAdding(!adding)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Adicionar Contato
        </Button>
      </div>
      <h2 className="text-3xl font-bold text-foreground mb-2">Mapeamento de Contatos</h2>
      <p className="text-muted-foreground text-sm mb-6">Registre decisores e recrutadores que você está abordando.</p>

      {adding && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6 grid grid-cols-6 gap-3 items-end">
          <Input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Cargo" value={form.current_position} onChange={e => setForm({ ...form, current_position: e.target.value })} />
          <Input placeholder="Empresa" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="decision_maker">Decisor</SelectItem>
              <SelectItem value="hr">RH</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={form.tier} onValueChange={v => setForm({ ...form, tier: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addContact}>Salvar</Button>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-muted-foreground text-xs font-semibold tracking-wider uppercase">Nome</th>
              <th className="text-left px-4 py-3 text-muted-foreground text-xs font-semibold tracking-wider uppercase">Cargo</th>
              <th className="text-left px-4 py-3 text-muted-foreground text-xs font-semibold tracking-wider uppercase">Empresa</th>
              <th className="text-left px-4 py-3 text-muted-foreground text-xs font-semibold tracking-wider uppercase">Tipo</th>
              <th className="text-left px-4 py-3 text-muted-foreground text-xs font-semibold tracking-wider uppercase">Tier</th>
              <th className="text-left px-4 py-3 text-muted-foreground text-xs font-semibold tracking-wider uppercase">Status</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                  Nenhum contato mapeado ainda.
                </td>
              </tr>
            ) : (
              contacts.map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-foreground text-sm font-medium">{c.name}</span>
                      {c.linkedin_url && (
                        <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="text-primary">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{c.current_position || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{c.company || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">{typeLabels[c.type] || c.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{c.tier}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={c.status} onValueChange={v => updateStatus(c.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteContact(c.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CompanyMatchDialog
        open={matchDialog.open}
        contactCompanyName={matchDialog.contactCompany}
        matchedCompany={matchDialog.matched}
        onConfirm={handleMatchConfirm}
        onCancel={handleMatchCancel}
      />
    </div>
  );
}
