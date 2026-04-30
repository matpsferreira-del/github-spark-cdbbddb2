import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Plus, Trash2, Upload, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
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
    title: "Tier A — Grandes corporações",
    subtitle: "Empresas dos sonhos — mais difíceis de entrar, com as melhores oportunidades.",
  },
  B: {
    color: "bg-blue-600",
    title: "Tier B — Empresas médias consolidadas",
    subtitle: "Empresas sólidas com boas oportunidades de crescimento e cultura forte.",
  },
  C: {
    color: "bg-green-600",
    title: "Tier C — Estratégicas e startups",
    subtitle: "Portas de entrada estratégicas, startups e nichos com crescimento acelerado.",
  },
};

export default function CompanyTierSlide({ tier, companies, planId, onSelectCompany, onRefreshData, isMentee }: Props) {
  const config = tierConfig[tier];
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSegment, setNewSegment] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addCompany = async () => {
    if (!newName.trim()) return toast.error("Nome da empresa é obrigatório");
    const { error } = await supabase.from("companies").insert({
      plan_id: planId, name: newName.trim(), segment: newSegment.trim() || "Geral", tier,
    });
    if (error) toast.error("Erro ao adicionar empresa");
    else {
      toast.success("Empresa adicionada!");
      setNewName(""); setNewSegment(""); setAdding(false); onRefreshData();
    }
  };

  const deleteCompany = async (e: React.MouseEvent, companyId: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;
    const { error } = await supabase.from("companies").delete().eq("id", companyId);
    if (error) toast.error("Erro ao excluir empresa");
    else onRefreshData();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["nome", "segmento"], ["Google", "Tecnologia"], ["Ambev", "Bebidas"]]);
    ws["!cols"] = [{ wch: 30 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Tier ${tier}`);
    XLSX.writeFile(wb, `modelo_tier_${tier.toLowerCase()}.xlsx`);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<{ nome?: string; name?: string; segmento?: string; segment?: string }>(ws);
      const parsed = rows
        .map(r => ({ name: (r.nome || r.name || "").toString().trim(), segment: (r.segmento || r.segment || "Geral").toString().trim() }))
        .filter(r => r.name);
      if (parsed.length === 0) { toast.error("Planilha vazia ou sem coluna 'nome'"); return; }
      if (!confirm(`Isso substituirá todas as ${companies.length} empresas do Tier ${tier} por ${parsed.length} novas. Continuar?`)) return;
      if (companies.length > 0) {
        const { error: delErr } = await supabase.from("companies").delete().eq("plan_id", planId).eq("tier", tier);
        if (delErr) throw delErr;
      }
      const { error: insErr } = await supabase.from("companies").insert(parsed.map(c => ({ plan_id: planId, name: c.name, segment: c.segment, tier })));
      if (insErr) throw insErr;
      toast.success(`${parsed.length} empresas importadas!`);
      onRefreshData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao importar planilha");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (companies.length === 0 && !adding) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 md:p-12">
        <p className="text-muted-foreground mb-4 text-sm text-center">Nenhuma empresa neste tier. Gere o plano na aba Dashboard.</p>
        {!isMentee && (
          <div className="flex flex-wrap gap-2 justify-center">
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
            <Button size="sm" variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-1" /> Modelo
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4 mr-1" /> Importar
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header — stack on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-3">
          <Badge className={config.color}>{tier[0]}</Badge>
          <p className="text-primary text-sm tracking-[0.2em] font-medium">MAPEAMENTO</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {!isMentee && (
            <>
              <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
              <Button size="sm" variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-1" /> Modelo
              </Button>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="w-4 h-4 mr-1" /> {uploading ? "..." : "Importar"}
              </Button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
            </>
          )}
          <div className="text-right ml-1">
            <p className="text-2xl md:text-3xl font-bold text-foreground leading-none">{companies.length}</p>
            <p className="text-muted-foreground text-xs">empresas</p>
          </div>
        </div>
      </div>

      <h2 className="text-lg md:text-2xl font-bold text-foreground mb-1">{config.title}</h2>
      <p className="text-muted-foreground text-xs md:text-sm mb-4">{config.subtitle}</p>

      {adding && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full sm:w-auto">
            <label className="text-xs text-muted-foreground mb-1 block">Nome da Empresa</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Google" />
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <label className="text-xs text-muted-foreground mb-1 block">Segmento</label>
            <Input value={newSegment} onChange={e => setNewSegment(e.target.value)} placeholder="Ex: Tecnologia" />
          </div>
          <Button onClick={addCompany} className="w-full sm:w-auto">Salvar</Button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <span>Progresso de abordagem</span>
        <span>{companies.filter(c => c.kanban_stage !== "identified").length}/{companies.length}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {companies.map((company) => (
          <button
            key={company.id}
            onClick={() => onSelectCompany?.(company)}
            className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 text-left hover:border-primary/50 active:bg-secondary/50 transition-colors group min-h-[60px]"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-foreground font-semibold truncate text-sm md:text-base">{company.name}</h3>
              <p className="text-muted-foreground text-xs truncate">{company.segment}</p>
            </div>
            {!isMentee && (
              <button
                onClick={(e) => deleteCompany(e, company.id)}
                className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1"
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
