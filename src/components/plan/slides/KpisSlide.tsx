import { Badge } from "@/components/ui/badge";
import type { PlanSlideProps } from "../types";

export default function KpisSlide({ plan, companies, companyTiers, templates, schedule, jobTitles, contacts }: PlanSlideProps) {
  const linkedinGoals = plan.linkedin_goals as any;

  return (
    <div className="p-8">
      <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">MÉTRICAS & ACOMPANHAMENTO</p>
      <h2 className="text-3xl font-bold text-foreground mb-6">KPIs do Plano</h2>

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
