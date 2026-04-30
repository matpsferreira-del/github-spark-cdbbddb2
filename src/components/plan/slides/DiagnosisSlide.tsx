import { parseDiagnosisData } from "../types";
import type { PlanSlideProps } from "../types";
import { Clock } from "lucide-react";

export default function DiagnosisSlide({ plan }: PlanSlideProps) {
  const data = parseDiagnosisData(plan.general_notes);
  const swot = data.swot;

  if (!swot) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 md:p-12">
        <Clock className="w-14 h-14 text-muted-foreground mb-5" />
        <h2 className="text-xl font-bold text-foreground mb-2">Diagnóstico em preparação</h2>
        <p className="text-muted-foreground text-center max-w-md text-sm">
          Gere o plano completo na aba Capa para preencher esta seção.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">ANÁLISE SITUACIONAL</p>
      <h2 className="text-xl md:text-3xl font-bold text-foreground mb-4">Diagnóstico SWOT</h2>

      <p className="text-muted-foreground mb-6 leading-relaxed text-sm">{swot.summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h3 className="text-primary font-bold text-sm tracking-wider mb-3">FORÇAS</h3>
          <ul className="space-y-2.5">
            {swot.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-foreground text-sm">
                <span className="text-primary mt-1 shrink-0">•</span> {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h3 className="text-destructive font-bold text-sm tracking-wider mb-3">FRAQUEZAS</h3>
          <ul className="space-y-2.5">
            {swot.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-foreground text-sm">
                <span className="text-destructive mt-1 shrink-0">—</span> {w}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h3 className="text-primary font-bold text-sm tracking-wider mb-3">OPORTUNIDADES</h3>
          <ul className="space-y-2.5">
            {swot.opportunities.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-foreground text-sm">
                <span className="text-primary mt-1 shrink-0">•</span> {o}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h3 className="text-destructive font-bold text-sm tracking-wider mb-3">AMEAÇAS</h3>
          <ul className="space-y-2.5">
            {swot.threats.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-foreground text-sm">
                <span className="text-destructive mt-1 shrink-0">!</span> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
