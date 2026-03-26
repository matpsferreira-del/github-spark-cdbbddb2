import { Sparkles } from "lucide-react";
import type { PlanSlideProps } from "../types";

export default function ContentSlide({ plan }: PlanSlideProps) {
  const linkedinGoals = plan.linkedin_goals as any;

  return (
    <div className="p-8">
      <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">ESTRATÉGIA DE CONTEÚDO</p>
      <h2 className="text-3xl font-bold text-foreground mb-6">Conteúdo para LinkedIn</h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-muted-foreground text-sm">Meta Semanal</p>
          <p className="text-foreground font-bold text-3xl">{linkedinGoals?.postsPerWeek || 1} posts</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-muted-foreground text-sm">Conexões/Dia</p>
          <p className="text-foreground font-bold text-3xl">{linkedinGoals?.connectionsPerDay || 50}</p>
        </div>
      </div>

      <h3 className="text-foreground font-semibold mb-4">Ideias de Conteúdo</h3>
      <div className="space-y-3">
        {[
          `Compartilhe um aprendizado da sua experiência como ${plan.current_position}`,
          `Comente sobre tendências em ${plan.current_area}`,
          "Publique um case de sucesso ou projeto relevante",
          "Faça uma reflexão sobre liderança ou trabalho em equipe",
          "Compartilhe um artigo relevante com sua análise pessoal",
          "Poste sobre uma habilidade técnica que você domina",
          "Conte uma história de superação profissional",
          "Dê dicas para iniciantes na sua área de atuação",
        ].map((idea, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-foreground text-sm">{idea}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
