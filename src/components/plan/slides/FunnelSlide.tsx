import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PlanSlideProps } from "../types";

const stages = [
  { key: "identified", label: "Identificada" },
  { key: "connection_sent", label: "Convite Enviado" },
  { key: "connected", label: "Conectado" },
  { key: "message_sent", label: "Mensagem Enviada" },
  { key: "replied", label: "Respondeu" },
] as const;

const tierColors: Record<string, string> = {
  A: "bg-yellow-600",
  B: "bg-blue-600",
  C: "bg-green-600",
};

export default function FunnelSlide({ companies, onRefreshData }: PlanSlideProps) {
  const moveCompany = async (companyId: string, direction: "forward" | "back") => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    const currentIdx = stages.findIndex(s => s.key === company.kanban_stage);
    const newIdx = direction === "forward" ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0 || newIdx >= stages.length) return;

    const { error } = await supabase
      .from("companies")
      .update({ kanban_stage: stages[newIdx].key })
      .eq("id", companyId);

    if (error) {
      toast.error("Erro ao mover empresa");
    } else {
      onRefreshData();
    }
  };

  if (companies.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">Nenhuma empresa mapeada. Gere o plano na aba Capa.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">CONTROLE DE PROCESSO</p>
      <h2 className="text-3xl font-bold text-foreground mb-1">Funil de Empresas</h2>
      <p className="text-muted-foreground text-sm mb-6">
        {companies.length} empresas mapeadas · Use os botões {"< >"} para mover entre etapas
      </p>

      <div className="flex gap-3 overflow-x-auto">
        {stages.map((stage) => {
          const stageCompanies = companies.filter(c => c.kanban_stage === stage.key);
          return (
            <div key={stage.key} className="min-w-[220px] flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-foreground font-semibold text-sm">{stage.label}</h3>
                <Badge variant="secondary" className="text-xs">{stageCompanies.length}</Badge>
              </div>
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {stageCompanies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Building2 className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">Nenhuma empresa nesta etapa</p>
                  </div>
                ) : (
                  stageCompanies.map((company) => {
                    const currentIdx = stages.findIndex(s => s.key === stage.key);
                    return (
                      <div key={company.id} className="bg-card border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-foreground font-semibold text-sm">{company.name}</h4>
                          <Badge className={`${tierColors[company.tier] || "bg-muted"} text-white text-xs px-1.5`}>
                            T{company.tier}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs mb-2">{company.segment}</p>
                        <div className="flex gap-1">
                          {currentIdx > 0 && (
                            <Button variant="outline" size="sm" className="text-xs h-7 flex-1" onClick={() => moveCompany(company.id, "back")}>
                              <ChevronLeft className="w-3 h-3 mr-0.5" /> Voltar
                            </Button>
                          )}
                          {currentIdx < stages.length - 1 && (
                            <Button variant="outline" size="sm" className="text-xs h-7 flex-1 text-primary border-primary/30" onClick={() => moveCompany(company.id, "forward")}>
                              Avançar <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
