import { Lightbulb, Clock, User, FileText, Briefcase, Star } from "lucide-react";
import { parseDiagnosisData } from "../types";
import type { PlanSlideProps } from "../types";

const sectionIcons: Record<string, any> = {
  headline: User,
  about: FileText,
  experience: Briefcase,
  skills: Star,
};

export default function LinkedInProfileSlide({ plan }: PlanSlideProps) {
  const data = parseDiagnosisData(plan.general_notes);
  const profile = data.linkedin_profile;
  const tips = data.linkedin_tips;

  // If we have full profile optimization data
  if (profile && profile.sections && profile.sections.length > 0) {
    return (
      <div className="p-8">
        <p className="text-primary text-sm tracking-[0.2em] font-medium mb-1">OTIMIZAÇÃO COMPLETA</p>
        <h2 className="text-3xl font-bold text-foreground mb-2">Perfil LinkedIn</h2>
        <p className="text-muted-foreground text-sm mb-8">
          Perfil otimizado por IA com base nos seus documentos e experiência.
        </p>

        <div className="space-y-6">
          {profile.sections.map((section: any, i: number) => {
            const Icon = sectionIcons[section.key] || Lightbulb;
            return (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-foreground font-bold">{section.title}</h3>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 mb-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">TEXTO IDEAL</p>
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{section.ideal_text}</p>
                </div>

                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground text-xs leading-relaxed">{section.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback to simple tips
  if (tips && tips.length > 0) {
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

  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <Clock className="w-14 h-14 text-muted-foreground mb-5" />
      <h2 className="text-xl font-bold text-foreground mb-2">Análise de perfil em preparação</h2>
      <p className="text-muted-foreground text-center max-w-md text-sm">
        Faça upload dos documentos na aba Documentos e gere o plano para receber a otimização completa.
      </p>
    </div>
  );
}
