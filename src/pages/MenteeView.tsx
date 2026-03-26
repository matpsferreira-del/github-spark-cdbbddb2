import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Briefcase, Building2, MessageSquare, Sparkles, Calendar,
  Search, TrendingUp, CheckCircle2, BarChart3, MapPin, ChevronLeft,
  ChevronRight, AlertCircle, Clock
} from "lucide-react";
import { useState, useMemo } from "react";
import type { MentorshipPlan, Company } from "@/types/mentorship";

const slides = [
  { id: "cover", title: "Capa", icon: Briefcase },
  { id: "diagnosis", title: "Diagnóstico", icon: Search },
  { id: "companies-a", title: "Tier A", icon: Building2 },
  { id: "companies-b", title: "Tier B", icon: Building2 },
  { id: "companies-c", title: "Tier C", icon: Building2 },
  { id: "funnel", title: "Funil", icon: TrendingUp },
  { id: "steps", title: "Passo a Passo", icon: CheckCircle2 },
  { id: "messages", title: "Mensagens", icon: MessageSquare },
  { id: "content", title: "Conteúdo", icon: Sparkles },
  { id: "schedule", title: "Cronograma", icon: Calendar },
  { id: "kpis", title: "KPIs", icon: BarChart3 },
  { id: "mapping", title: "Mapeamento", icon: MapPin },
];

export default function MenteeView() {
  const { token } = useParams<{ token: string }>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: accessData, isLoading, error } = useQuery({
    queryKey: ["mentee-access", token],
    queryFn: async () => {
      const { data: tokenData, error: tokenError } = await supabase
        .from("plan_access_tokens")
        .select("*")
        .eq("token", token!)
        .eq("is_active", true)
        .single();
      if (tokenError) throw tokenError;

      const { data: planData, error: planError } = await supabase
        .from("mentorship_plans")
        .select("*")
        .eq("id", tokenData.plan_id)
        .single();
      if (planError) throw planError;

      return { token: tokenData, plan: planData };
    },
    enabled: !!token,
  });

  const plan = accessData?.plan as MentorshipPlan | undefined;

  const { data: companies = [] } = useQuery({
    queryKey: ["mentee-companies", plan?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("plan_id", plan!.id);
      if (error) throw error;
      return data as Company[];
    },
    enabled: !!plan?.id,
  });

  const companyTiers = useMemo(() => ({
    A: companies.filter(c => c.tier === "A"),
    B: companies.filter(c => c.tier === "B"),
    C: companies.filter(c => c.tier === "C"),
  }), [companies]);

  if (!token) {
    return (
      <div className="min-h-screen gradient-dark-bg flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-foreground text-xl font-semibold mb-2">Link inválido</h1>
          <p className="text-muted-foreground text-sm">Este link de acesso não é válido.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Carregando seu plano estratégico...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen gradient-dark-bg flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-foreground text-xl font-semibold mb-2">Link expirado ou inválido</h1>
          <p className="text-muted-foreground text-sm">Entre em contato com seu mentor.</p>
        </div>
      </div>
    );
  }

  const renderSlide = () => {
    const slide = slides[currentSlide];
    switch (slide.id) {
      case "cover":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-foreground mb-2">
                Mentoria <span className="text-primary">Estratégica</span>
              </h1>
              <p className="text-muted-foreground text-lg">Seu sucesso é o nosso sucesso.</p>
            </div>
            <div className="bg-card rounded-xl p-8 border border-border">
              <p className="text-muted-foreground text-sm mb-2">Plano Estratégico para:</p>
              <h2 className="text-3xl font-bold text-primary mb-4">{plan.mentee_name}</h2>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{plan.current_position}</span>
                <span>•</span>
                <span>{plan.current_area}</span>
                <span>•</span>
                <span>{plan.city}, {plan.state}</span>
              </div>
            </div>
          </div>
        );

      case "companies-a":
      case "companies-b":
      case "companies-c": {
        const tier = slide.id.split("-")[1].toUpperCase() as "A" | "B" | "C";
        const tierCompanies = companyTiers[tier];
        return (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Badge className={tier === "A" ? "bg-yellow-600" : tier === "B" ? "bg-blue-600" : "bg-green-600"}>
                Tier {tier}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">Empresas Mapeadas</h2>
            </div>
            {tierCompanies.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma empresa neste tier.</p>
            ) : (
              <div className="grid gap-3">
                {tierCompanies.map((company) => (
                  <div key={company.id} className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-foreground font-semibold">{company.name}</h3>
                    <p className="text-muted-foreground text-sm">{company.segment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      default:
        return (
          <div className="h-full flex flex-col items-center justify-center p-12">
            <Clock className="w-14 h-14 text-muted-foreground mb-5" />
            <h2 className="text-xl font-bold text-foreground mb-2">Conteúdo em preparação</h2>
            <p className="text-muted-foreground text-center max-w-md text-sm">
              Seu mentor está preparando este conteúdo.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen gradient-dark-bg">
      <div className="border-b border-border px-6 py-3 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">
          Plano de <span className="text-primary">{plan.mentee_name}</span>
        </h1>
        <span className="text-sm text-muted-foreground">
          {currentSlide + 1} / {slides.length}
        </span>
      </div>

      <div className="flex h-[calc(100vh-57px-57px)]">
        <div className="w-56 border-r border-border overflow-y-auto p-3 space-y-1">
          {slides.map((slide, idx) => {
            const Icon = slide.icon;
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  idx === currentSlide
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {slide.title}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto">{renderSlide()}</div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-6 py-3 flex justify-between">
        <Button variant="outline" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        <Button variant="outline" onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}>
          Próximo <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
