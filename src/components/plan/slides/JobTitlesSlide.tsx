import { Button } from "@/components/ui/button";
import { Wand2, Search, Crown, Star, Loader2 } from "lucide-react";
import type { PlanSlideProps } from "../types";

export default function JobTitlesSlide({ plan, jobTitles, generating, onGenerate }: PlanSlideProps) {
  const searchVariations = jobTitles.filter(j => j.type === "current_variation" || j.type === "search_variation");
  const decisionMakers = jobTitles.filter(j => j.type === "target_position" || j.type === "decision_maker");
  const hrRecruiters = jobTitles.filter(j => j.type === "hr_recruiter");

  // Parse "Title|||Description" format
  const parseTitle = (title: string) => {
    const parts = title.split("|||");
    return { title: parts[0], description: parts[1] || null };
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-1">
        <p className="text-primary text-sm tracking-[0.2em] font-medium">NOMENCLATURAS & ALVOS</p>
        {jobTitles.length === 0 && (
          <Button onClick={() => onGenerate("job_titles")} disabled={generating} size="sm">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
            Gerar com IA
          </Button>
        )}
      </div>
      <h2 className="text-3xl font-bold text-foreground mb-1">Cargos & Variações</h2>
      <p className="text-sm mb-6">
        <span className="text-muted-foreground">Cargo base: </span>
        <span className="text-primary font-medium">{plan.current_position}</span>
      </p>

      {jobTitles.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Clique em "Gerar com IA" para criar variações de cargos.</p>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Variações para vagas */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-primary" />
              <h3 className="text-primary font-bold text-sm tracking-wider">VARIAÇÕES PARA VAGAS</h3>
            </div>
            <p className="text-muted-foreground text-xs mb-4">Pesquise estas nomenclaturas no LinkedIn e portais de vagas</p>
            <div className="space-y-1">
              {searchVariations.map((jt, i) => (
                <div key={jt.id} className="flex items-center gap-2 py-2 border-b border-border">
                  <span className="text-muted-foreground text-xs w-6">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-foreground text-sm">{jt.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Decisores da área */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <h3 className="text-yellow-500 font-bold text-sm tracking-wider">DECISORES DA ÁREA</h3>
            </div>
            <p className="text-muted-foreground text-xs mb-4">Conecte-se com estes cargos nas empresas alvo</p>
            <div className="space-y-3">
              {decisionMakers.map((jt) => {
                const parsed = parseTitle(jt.title);
                return (
                  <div key={jt.id} className="border-b border-border pb-3">
                    <p className="text-foreground font-medium text-sm">{parsed.title}</p>
                    {parsed.description && (
                      <p className="text-muted-foreground text-xs mt-0.5">{parsed.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RH & Recrutadores */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-destructive" />
              <h3 className="text-destructive font-bold text-sm tracking-wider">RH & RECRUTADORES</h3>
            </div>
            <p className="text-muted-foreground text-xs mb-4">Conecte-se com RH nas empresas alvo</p>
            <div className="space-y-3">
              {hrRecruiters.map((jt) => {
                const parsed = parseTitle(jt.title);
                return (
                  <div key={jt.id} className="border-b border-border pb-3">
                    <p className="text-foreground font-medium text-sm">{parsed.title}</p>
                    {parsed.description && (
                      <p className="text-muted-foreground text-xs mt-0.5">{parsed.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
