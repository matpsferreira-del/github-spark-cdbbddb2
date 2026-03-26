import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Wand2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseDiagnosisData } from "../types";
import type { PlanSlideProps } from "../types";

const dayLabels: Record<string, string> = {
  monday: "SEGUNDA",
  tuesday: "TERÇA",
  wednesday: "QUARTA",
  thursday: "QUINTA",
  friday: "SEXTA",
};
const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];

export default function ScheduleSlide({ plan, schedule, generating, onGenerate, onRefreshData }: PlanSlideProps) {
  const data = parseDiagnosisData(plan.general_notes);
  const monthGoals = data.month_goals;
  const completedCount = schedule.filter(a => a.is_completed).length;

  const toggleActivity = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("schedule_activities")
      .update({
        is_completed: !currentState,
        completed_at: !currentState ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) toast.error("Erro ao atualizar atividade");
    else onRefreshData();
  };

  if (schedule.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground mb-4">Nenhuma atividade gerada.</p>
        <Button onClick={() => onGenerate("schedule")} disabled={generating}>
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
          Gerar Rotina
        </Button>
      </div>
    );
  }

  const weeks = [...new Set(schedule.map(a => a.week_number))].sort();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-1">
        <p className="text-primary text-sm tracking-[0.2em] font-medium">PLANEJAMENTO</p>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{completedCount}/{schedule.length}</p>
            <p className="text-muted-foreground text-xs">atividades</p>
          </div>
          <Button onClick={() => onGenerate("schedule")} disabled={generating} size="sm" variant="outline">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
            Gerar Rotina
          </Button>
        </div>
      </div>
      <h2 className="text-3xl font-bold text-foreground mb-6">Cronograma & Rotina</h2>

      {/* Month Goals */}
      {monthGoals && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { key: "month1", title: "Mês 1 — Fundação", color: "text-primary" },
            { key: "month2", title: "Mês 2 — Aceleração", color: "text-primary" },
            { key: "month3", title: "Mês 3 — Colheita", color: "text-destructive" },
          ].map(({ key, title, color }) => (
            <div key={key} className="bg-card border border-border rounded-lg p-4">
              <h3 className={`${color} font-semibold text-sm mb-3`}>{title}</h3>
              <ul className="space-y-1.5">
                {(monthGoals as any)[key]?.map((goal: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-foreground text-xs">
                    <span className="text-muted-foreground mt-0.5">→</span> {goal}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Schedule */}
      <p className="text-muted-foreground text-sm font-medium mb-4 flex items-center gap-2">
        ✅ ROTINA SEMANAL — MARQUE AS ATIVIDADES CONCLUÍDAS
      </p>

      <div className="space-y-8">
        {weeks.map(week => (
          <div key={week}>
            <h3 className="text-foreground font-semibold mb-3">SEMANA {week}</h3>
            <div className="grid grid-cols-5 gap-2">
              {days.map(day => {
                const dayActivities = schedule.filter(a => a.week_number === week && a.day_of_week === day);
                return (
                  <div key={day} className="bg-card border border-border rounded-lg p-3">
                    <p className="text-primary text-xs font-bold mb-2">{dayLabels[day]}</p>
                    <div className="space-y-2">
                      {dayActivities.length === 0 ? (
                        <p className="text-muted-foreground text-xs">—</p>
                      ) : (
                        dayActivities.map(activity => (
                          <label key={activity.id} className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                              checked={activity.is_completed}
                              onCheckedChange={() => toggleActivity(activity.id, activity.is_completed)}
                              className="mt-0.5 shrink-0"
                            />
                            <span className={`text-xs leading-snug ${activity.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {activity.activity}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
