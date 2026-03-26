import { Lightbulb, Clock } from "lucide-react";
import { parseDiagnosisData } from "../types";
import type { PlanSlideProps } from "../types";

export default function LinkedInProfileSlide({ plan }: PlanSlideProps) {
  const data = parseDiagnosisData(plan.general_notes);
  const tips = data.linkedin_tips;

  if (!tips || tips.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12">
        <Clock className="w-14 h-14 text-muted-foreground mb-5" />
        <h2 className="text-xl font-bold text-foreground mb-2">Análise de perfil em preparação</h2>
        <p className="text-muted-foreground text-center max-w-md text-sm">
          Gere o plano completo na aba Capa para receber dicas de otimização do perfil LinkedIn.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">OTIMIZAÇÃO</p>
      <h2 className="text-3xl font-bold text-foreground mb-2">Perfil LinkedIn</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Dicas personalizadas para otimizar seu perfil e aumentar a visibilidade.
      </p>

      <div className="space-y-4">
        {tips.map((tip, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <p className="text-foreground text-sm leading-relaxed">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
