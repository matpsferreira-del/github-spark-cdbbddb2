import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Briefcase, Trash2, Users, ExternalLink, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Company, ContactMapping } from "@/types/mentorship";

interface Props {
  company: Company;
  contacts: ContactMapping[];
  onBack: () => void;
  onRefreshData: () => void;
}

const tierColors: Record<string, string> = {
  A: "bg-yellow-600",
  B: "bg-blue-600",
  C: "bg-green-600",
};

const stageLabels: Record<string, string> = {
  identified: "Identificada",
  connection_sent: "Convite Enviado",
  connected: "Conectado",
  message_sent: "Msg Enviada",
  replied: "Respondeu",
};

export default function CompanyDetailSlide({ company, contacts, onBack, onRefreshData }: Props) {
  const [addingOpening, setAddingOpening] = useState(false);
  const [openingTitle, setOpeningTitle] = useState("");
  const [openingUrl, setOpeningUrl] = useState("");

  // Parse openings from notes JSON
  const openings: Array<{ title: string; url?: string }> = (() => {
    try {
      const parsed = company.notes ? JSON.parse(company.notes) : {};
      return parsed.openings || [];
    } catch {
      return [];
    }
  })();

  // Filter contacts linked to this company (fuzzy match)
  const linkedContacts = contacts.filter(c => {
    if (!c.company) return false;
    const contactCompany = c.company.toLowerCase().trim();
    const companyName = company.name.toLowerCase().trim();
    return contactCompany === companyName ||
      companyName.includes(contactCompany) ||
      contactCompany.includes(companyName);
  });

  const saveOpening = async () => {
    if (!openingTitle.trim()) return toast.error("Título da vaga é obrigatório");
    const currentNotes = (() => {
      try { return company.notes ? JSON.parse(company.notes) : {}; } catch { return {}; }
    })();
    const updatedOpenings = [...(currentNotes.openings || []), { title: openingTitle.trim(), url: openingUrl.trim() || undefined }];
    const hasAnyOpening = updatedOpenings.length > 0;

    const { error } = await supabase.from("companies").update({
      notes: JSON.stringify({ ...currentNotes, openings: updatedOpenings }),
      has_openings: hasAnyOpening,
    }).eq("id", company.id);

    if (error) toast.error("Erro ao salvar vaga");
    else {
      toast.success("Vaga adicionada!");
      setOpeningTitle("");
      setOpeningUrl("");
      setAddingOpening(false);
      onRefreshData();
    }
  };

  const removeOpening = async (index: number) => {
    const currentNotes = (() => {
      try { return company.notes ? JSON.parse(company.notes) : {}; } catch { return {}; }
    })();
    const updatedOpenings = [...(currentNotes.openings || [])];
    updatedOpenings.splice(index, 1);

    const { error } = await supabase.from("companies").update({
      notes: JSON.stringify({ ...currentNotes, openings: updatedOpenings }),
      has_openings: updatedOpenings.length > 0,
    }).eq("id", company.id);

    if (error) toast.error("Erro ao remover vaga");
    else onRefreshData();
  };

  return (
    <div className="p-8">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Tier
      </Button>

      <div className="flex items-center gap-3 mb-2">
        <Badge className={tierColors[company.tier]}>Tier {company.tier}</Badge>
        <Badge variant="outline">{stageLabels[company.kanban_stage] || company.kanban_stage}</Badge>
      </div>
      <h2 className="text-3xl font-bold text-foreground mb-1">{company.name}</h2>
      <p className="text-muted-foreground mb-8">{company.segment}</p>

      {/* Job Openings Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <h3 className="text-foreground font-semibold text-lg">Vagas Encontradas</h3>
          </div>
          <Button size="sm" onClick={() => setAddingOpening(!addingOpening)}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar Vaga
          </Button>
        </div>

        {addingOpening && (
          <div className="bg-card border border-border rounded-lg p-4 mb-4 flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Título da Vaga</label>
              <Input value={openingTitle} onChange={e => setOpeningTitle(e.target.value)} placeholder="Ex: Analista de Marketing Sr." />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Link da Vaga (opcional)</label>
              <Input value={openingUrl} onChange={e => setOpeningUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button onClick={saveOpening}>Salvar</Button>
          </div>
        )}

        {openings.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
            Nenhuma vaga cadastrada. Adicione vagas que você encontrar para esta empresa.
          </div>
        ) : (
          <div className="space-y-2">
            {openings.map((opening, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-green-500" />
                  <span className="text-foreground font-medium">{opening.title}</span>
                  {opening.url && (
                    <a href={opening.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeOpening(idx)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked Contacts Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-foreground font-semibold text-lg">Contatos Vinculados</h3>
          <Badge variant="secondary" className="text-xs">{linkedContacts.length}</Badge>
        </div>

        {linkedContacts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
            Nenhum contato vinculado. Ao cadastrar contatos na aba Mapeamento com o nome desta empresa, eles aparecerão aqui automaticamente.
          </div>
        ) : (
          <div className="space-y-2">
            {linkedContacts.map(contact => (
              <div key={contact.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">{contact.name}</span>
                    {contact.linkedin_url && (
                      <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="text-primary">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">{contact.current_position || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{contact.type === "decision_maker" ? "Decisor" : contact.type === "hr" ? "RH" : "Outro"}</Badge>
                  <Badge variant="outline" className="text-xs">{contact.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
