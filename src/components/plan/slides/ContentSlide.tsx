import { Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { parseDiagnosisData } from "../types";
import type { PlanSlideProps } from "../types";

export default function ContentSlide({ plan }: PlanSlideProps) {
  const linkedinGoals = plan.linkedin_goals as any;
  const data = parseDiagnosisData(plan.general_notes);
  const prompts = data.content_prompts;
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Prompt copiado!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

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

      <h3 className="text-foreground font-semibold mb-2">Prompts Prontos para o Gemini</h3>
      <p className="text-muted-foreground text-xs mb-4">
        Copie cada prompt abaixo e cole no Gemini para gerar a publicação completa.
      </p>

      {prompts && prompts.length > 0 ? (
        <div className="space-y-4">
          {prompts.map((prompt, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <h4 className="text-foreground font-semibold text-sm">{prompt.title}</h4>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs h-7"
                  onClick={() => copyToClipboard(prompt.prompt, i)}
                >
                  {copiedIdx === i ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copiedIdx === i ? "Copiado" : "Copiar"}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap bg-secondary/50 rounded p-3 font-mono">
                {prompt.prompt}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {[
            `Compartilhe um aprendizado da sua experiência como ${plan.current_position}`,
            `Comente sobre tendências em ${plan.current_area}`,
            "Publique um case de sucesso ou projeto relevante",
            "Faça uma reflexão sobre liderança ou trabalho em equipe",
          ].map((idea, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <p className="text-foreground text-sm">{idea}</p>
            </div>
          ))}
          <p className="text-muted-foreground text-xs text-center mt-4">
            Gere o plano completo na aba Dashboard para receber prompts personalizados.
          </p>
        </div>
      )}
    </div>
  );
}
