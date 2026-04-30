import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Building2, CheckCircle2, BarChart3 } from "lucide-react";
import type { PlanSlideProps } from "../types";

export default function DashboardSlide({ plan, companies, companyTiers, templates, schedule, jobTitles, contacts, generating, hasAIContent, onGenerate, isMentee }: PlanSlideProps) {
  const date = new Date(plan.created_at).toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="p-4 md:p-8">
      {/* Cover Section */}
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground mb-1">Plano Estratégico</h1>
          <p className="text-muted-foreground text-sm">de Recolocação Profissional</p>
        </div>
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
        </div>
      </div>

      {/* Mentee Card */}
      <div className="bg-card rounded-xl p-4 md:p-6 border border-border mb-4 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">{plan.mentee_name}</h2>
            <p className="text-muted-foreground text-sm">{plan.current_position} · {plan.current_area}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
              <span>{plan.city}, {plan.state}</span>
              <span>•</span>
              <span>{plan.current_situation === "employed" ? "Empregado" : "Desempregado"}</span>
              <span>•</span>
              <Badge variant="outline" className="text-foreground text-xs">{plan.work_model === "remoto" ? "Remoto" : plan.work_model === "presencial" ? "Presencial" : "Híbrido"}</Badge>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <p className="text-muted-foreground text-xs">{date}</p>
            {!isMentee && !hasAIContent && (
              <Button onClick={() => onGenerate("all")} disabled={generating} className="mt-2" size="sm">
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Gerar Plano Completo
              </Button>
            )}
            {!isMentee && hasAIContent && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Plano gerado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-foreground font-semibold">Dashboard</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-8">
        {[
          { value: companies.length, label: "Empresas Mapeadas" },
          { value: companies.filter(c => c.has_openings).length, label: "Com Vagas Abertas" },
          { value: templates.length, label: "Templates Prontos" },
          { value: jobTitles.length, label: "Variações de Cargo" },
          { value: `${schedule.filter(a => a.is_completed).length}/${schedule.length}`, label: "Atividades Concluídas" },
          { value: contacts.length, label: "Contatos Mapeados" },
        ].map((kpi, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-3 md:p-5 text-center">
            <p className="text-2xl md:text-3xl font-bold text-primary">{kpi.value}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Tier Distribution */}
      <h3 className="text-foreground font-semibold mb-3">Distribuição por Tier</h3>
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8">
        {(["A", "B", "C"] as const).map(tier => (
          <div key={tier} className="bg-card border border-border rounded-lg p-3 md:p-5 text-center">
            <Badge className={`${tier === "A" ? "bg-yellow-600" : tier === "B" ? "bg-blue-600" : "bg-green-600"} mb-2`}>
              Tier {tier}
            </Badge>
            <p className="text-xl md:text-2xl font-bold text-foreground">{companyTiers[tier].length}</p>
          </div>
        ))}
      </div>

      {/* Funnel Progress — horizontal scroll on mobile */}
      <h3 className="text-foreground font-semibold mb-3">Progresso do Funil</h3>
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="grid grid-cols-5 gap-2 md:gap-3 min-w-[360px] px-4 md:px-0">
          {[
            { key: "identified", label: "Identificadas" },
            { key: "connection_sent", label: "Convite" },
            { key: "connected", label: "Conectados" },
            { key: "message_sent", label: "Msg Enviada" },
            { key: "replied", label: "Responderam" },
          ].map(stage => (
            <div key={stage.key} className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-foreground">{companies.filter(c => c.kanban_stage === stage.key).length}</p>
              <p className="text-muted-foreground text-xs leading-tight mt-0.5">{stage.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
