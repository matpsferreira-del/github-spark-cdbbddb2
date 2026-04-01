import { Sparkles, Copy, Check, CheckCircle2, Circle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { parseDiagnosisData } from "../types";
import type { PlanSlideProps } from "../types";

export default function ContentSlide({ plan, onRefreshData, onGenerate, generating }: PlanSlideProps) {
  const linkedinGoals = plan.linkedin_goals as any;
  const data = parseDiagnosisData(plan.general_notes);
  const prompts = data.content_prompts;
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const queryClient = useQueryClient();

  const { data: completions = [] } = useQuery({
    queryKey: ["content_completions", plan.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_prompt_completions")
        .select("*")
        .eq("plan_id", plan.id);
      if (error) throw error;
      return data;
    },
  });

  const completedCount = completions.length;
  const totalPrompts = prompts?.length || 0;
  const weeklyGoal = linkedinGoals?.postsPerWeek || 1;

  const isCompleted = (idx: number) => completions.some((c: any) => c.prompt_index === idx);

  const toggleCompletion = async (idx: number) => {
    const already = completions.find((c: any) => c.prompt_index === idx);
    if (already) {
      await supabase.from("content_prompt_completions").delete().eq("id", already.id);
    } else {
      await supabase.from("content_prompt_completions").insert({
        plan_id: plan.id,
        prompt_index: idx,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["content_completions", plan.id] });
  };

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

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-muted-foreground text-sm">Meta Semanal</p>
          <p className="text-foreground font-bold text-3xl">{weeklyGoal} posts</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-muted-foreground text-sm">Conexões/Dia</p>
          <p className="text-foreground font-bold text-3xl">{linkedinGoals?.connectionsPerDay || 50}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-muted-foreground text-sm">Posts Publicados</p>
          <p className="text-foreground font-bold text-3xl">
            {completedCount}<span className="text-lg text-muted-foreground">/{totalPrompts}</span>
          </p>
          {totalPrompts > 0 && (
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (completedCount / totalPrompts) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <h3 className="text-foreground font-semibold mb-2">Prompts Prontos para o Gemini</h3>
      <p className="text-muted-foreground text-xs mb-4">
        Copie cada prompt, cole no Gemini, publique o post e marque como feito ✅
      </p>

      {prompts && prompts.length > 0 ? (
        <div className="space-y-4">
          {prompts.map((prompt, i) => {
            const done = isCompleted(i);
            return (
              <div key={i} className={`bg-card border rounded-lg p-5 transition-all ${done ? "border-primary/40 opacity-75" : "border-border"}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleCompletion(i)} className="shrink-0">
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <h4 className={`font-semibold text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {prompt.title}
                    </h4>
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
                <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap bg-secondary/50 rounded p-3 font-mono ml-7">
                  {prompt.prompt}
                </p>
                {!done && (
                  <p className="text-xs text-muted-foreground mt-2 ml-7">
                    Copie → cole no Gemini → publique → marque como feito
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-foreground font-semibold text-lg mb-2">Prompts ainda não gerados</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Clique abaixo para gerar prompts personalizados para seus posts no LinkedIn. A IA criará 8 prompts prontos para copiar e colar no Gemini.
          </p>
          <Button
            onClick={() => {
              if (onGenerate) onGenerate("all");
            }}
            disabled={generating}
            className="gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {generating ? "Gerando plano completo..." : "Gerar Plano com IA"}
          </Button>
        </div>
      )}
    </div>
  );
}
