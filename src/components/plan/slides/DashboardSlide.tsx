import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Building2, CheckCircle2, BarChart3 } from "lucide-react";
import type { PlanSlideProps } from "../types";

export default function DashboardSlide({ plan, companies, companyTiers, templates, schedule, jobTitles, contacts, generating, hasAIContent, onGenerate }: PlanSlideProps) {
  const date = new Date(plan.created_at).toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="p-8">
      {/* Cover Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-primary text-sm tracking-[0.3em] font-medium mb-1">ORION RECRUITMENT</p>
          <h1 className="text-3xl font-bold text-foreground mb-1">Plano Estratégico</h1>
          <p className="text-muted-foreground">de Recolocação Profissional</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
          <Building2 className="w-7 h-7 text-primary-foreground" />
        </div>
      </div>

      {/* Mentee Card */}
      <div className="bg-card rounded-xl p-6 border border-border mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{plan.mentee_name}</h2>
            <p className="text-muted-foreground text-sm">{plan.current_position} · {plan.current_area}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{plan.city}, {plan.state}</span>
              <span>•</span>
              <span>{plan.current_situation === "employed" ? "Empregado" : "Desempregado"}</span>
              <span>•</span>
              <Badge variant="outline" className="text-foreground text-xs">{plan.work_model === "remoto" ? "Remoto" : plan.work_model === "presencial" ? "Presencial" : "Híbrido"}</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">{date}</p>
            {!hasAIContent && (
              <Button onClick={() => onGenerate("all")} disabled={generating} className="mt-2" size="sm">
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Gerar Plano Completo
              </Button>
            )}
            {hasAIContent && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Plano gerado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-foreground font-semibold">Dashboard</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-primary">{companies.length}</p>
          <p className="text-muted-foreground text-sm">Empresas Mapeadas</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-primary">{companies.filter(c => c.has_openings).length}</p>
          <p className="text-muted-foreground text-sm">Com Vagas Abertas</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-primary">{templates.length}</p>
          <p className="text-muted-foreground text-sm">Templates Prontos</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-primary">{jobTitles.length}</p>
          <p className="text-muted-foreground text-sm">Variações de Cargo</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-primary">{schedule.filter(a => a.is_completed).length}/{schedule.length}</p>
          <p className="text-muted-foreground text-sm">Atividades Concluídas</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-primary">{contacts.length}</p>
          <p className="text-muted-foreground text-sm">Contatos Mapeados</p>
        </div>
      </div>

      {/* Tier Distribution */}
      <h3 className="text-foreground font-semibold mb-3">Distribuição por Tier</h3>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(["A", "B", "C"] as const).map(tier => (
          <div key={tier} className="bg-card border border-border rounded-lg p-5 text-center">
            <Badge className={tier === "A" ? "bg-yellow-600 mb-2" : tier === "B" ? "bg-blue-600 mb-2" : "bg-green-600 mb-2"}>
              Tier {tier}
            </Badge>
            <p className="text-2xl font-bold text-foreground">{companyTiers[tier].length}</p>
          </div>
        ))}
      </div>

      {/* Funnel Progress */}
      <h3 className="text-foreground font-semibold mb-3">Progresso do Funil</h3>
      <div className="grid grid-cols-5 gap-3">
        {[
          { key: "identified", label: "Identificadas" },
          { key: "connection_sent", label: "Convite Enviado" },
          { key: "connected", label: "Conectados" },
          { key: "message_sent", label: "Msg Enviada" },
          { key: "replied", label: "Responderam" },
        ].map(stage => (
          <div key={stage.key} className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-xl font-bold text-foreground">{companies.filter(c => c.kanban_stage === stage.key).length}</p>
            <p className="text-muted-foreground text-xs">{stage.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
