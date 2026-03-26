import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Building2, CheckCircle2 } from "lucide-react";
import type { PlanSlideProps } from "../types";

export default function CoverSlide({ plan, generating, hasAIContent, onGenerate }: PlanSlideProps) {
  const date = new Date(plan.created_at).toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-12">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6">
        <Building2 className="w-8 h-8 text-primary-foreground" />
      </div>

      <p className="text-primary text-sm tracking-[0.3em] font-medium mb-2">ORION RECRUITMENT</p>
      <h1 className="text-4xl font-bold text-foreground mb-1">Plano Estratégico</h1>
      <p className="text-muted-foreground text-lg mb-8">de Recolocação Profissional</p>

      <div className="bg-card rounded-xl p-8 border border-border max-w-lg w-full">
        <h2 className="text-2xl font-bold text-foreground mb-1">{plan.mentee_name}</h2>
        <p className="text-muted-foreground mb-3">{plan.current_position}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
          <span>{plan.current_area}</span>
          <span>•</span>
          <span>{plan.city}, {plan.state}</span>
          <span>•</span>
          <span>{plan.current_situation === "employed" ? "Empregado" : "Desempregado"}</span>
        </div>
        <Badge variant="outline" className="text-foreground">{plan.work_model === "remoto" ? "Remoto" : plan.work_model === "presencial" ? "Presencial" : "Híbrido"}</Badge>
      </div>

      <p className="text-muted-foreground text-sm mt-6">{date}</p>

      {!hasAIContent && (
        <Button onClick={() => onGenerate("all")} disabled={generating} className="mt-8" size="lg">
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
          Gerar Plano Completo com IA
        </Button>
      )}
      {hasAIContent && (
        <div className="mt-6 flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="w-4 h-4" />
          <span>Plano gerado — navegue pelas abas para ver o conteúdo</span>
        </div>
      )}
    </div>
  );
}
