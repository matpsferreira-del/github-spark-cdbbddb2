import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Company } from "@/types/mentorship";

interface Props {
  tier: "A" | "B" | "C";
  companies: Company[];
  planId: string;
  onSelectCompany?: (company: Company) => void;
  onRefreshData: () => void;
  isMentee?: boolean;
}

const tierConfig = {
  A: {
    color: "bg-yellow-600",
    title: "Tier A — Grandes corporações e multinacionais",
    subtitle: "Empresas dos sonhos — mais difíceis de entrar, com as melhores oportunidades e remuneração.",
  },
  B: {
    color: "bg-blue-600",
    title: "Tier B — Empresas médias consolidadas",
    subtitle: "Empresas sólidas com boas oportunidades de crescimento e cultura forte.",
  },
  C: {
    color: "bg-green-600",
    title: "Tier C — Empresas estratégicas e startups",
    subtitle: "Portas de entrada estratégicas, startups e nichos com crescimento acelerado.",
  },
};

export default function CompanyTierSlide({ tier, companies, planId, onSelectCompany, onRefreshData, isMentee }: Props) {
  const config = tierConfig[tier];
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSegment, setNewSegment] = useState("");

  const addCompany = async () => {
    if (!newName.trim()) return toast.error("Nome da empresa é obrigatório");
    const { error } = await supabase.from("companies").insert({
      plan_id: planId,
      name: newName.trim(),
      segment: newSegment.trim() || "Geral",
      tier,
    });
    if (error) toast.error("Erro ao adicionar empresa");
    else {
      toast.success("Empresa adicionada!");
      setNewName("");
      setNewSegment("");
      setAdding(false);
      onRefreshData();
    }
  };

  const deleteCompany = async (e: React.MouseEvent, companyId: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;
    const { error } = await supabase.from("companies").delete().eq("id", companyId);
    if (error) toast.error("Erro ao excluir empresa");
    else onRefreshData();
  };

  if (companies.length === 0 && !adding) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground mb-4">Nenhuma empresa neste tier. Gere o plano na aba Dashboard.</p>
        {!isMentee && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar Empresa
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <Badge className={config.color}>{tier[0]}</Badge>
          <p className="text-primary text-sm tracking-[0.2em] font-medium">MAPEAMENTO DE EMPRESAS</p>
        </div>
        <div className="flex items-center gap-3">
          {!isMentee && (
            <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          )}
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">{companies.length}</p>
            <p className="text-muted-foreground text-xs">empresas</p>
          </div>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-1">{config.title}</h2>
      <p className="text-muted-foreground text-sm mb-4">{config.subtitle}</p>

      {adding && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Nome da Empresa</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Google" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Segmento</label>
            <Input value={newSegment} onChange={e => setNewSegment(e.target.value)} placeholder="Ex: Tecnologia" />
          </div>
          <Button onClick={addCompany}>Salvar</Button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <span>Progresso de abordagem</span>
        <span>{companies.filter(c => c.kanban_stage !== "identified").length}/{companies.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {companies.map((company) => (
          <button
            key={company.id}
            onClick={() => onSelectCompany?.(company)}
            className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 text-left hover:border-primary/50 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-foreground font-semibold truncate">{company.name}</h3>
              <p className="text-muted-foreground text-xs truncate">{company.segment}</p>
            </div>
            {!isMentee && (
              <button
                onClick={(e) => deleteCompany(e, company.id)}
                className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
