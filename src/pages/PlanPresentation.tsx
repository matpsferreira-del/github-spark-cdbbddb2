import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, ArrowLeft, Briefcase, Building2, Target, MessageSquare,
  Sparkles, Calendar, Search, TrendingUp, CheckCircle2, BarChart3,
  MapPin, ChevronLeft, ChevronRight, Users, Clock
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

export default function PlanPresentation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: plan, isLoading } = useQuery({
    queryKey: ["plan", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorship_plans")
        .select("*")
        .eq("id", id!)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as MentorshipPlan;
    },
    enabled: !!id && !!user,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("plan_id", id!);
      if (error) throw error;
      return data as Company[];
    },
    enabled: !!id,
  });

  const companyTiers = useMemo(() => ({
    A: companies.filter(c => c.tier === "A"),
    B: companies.filter(c => c.tier === "B"),
    C: companies.filter(c => c.tier === "C"),
  }), [companies]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-foreground font-semibold mb-2">Plano não encontrado</h2>
          <Button onClick={() => navigate("/")}>Voltar</Button>
        </div>
      </div>
    );
  }

  const renderNotReady = (section: string) => (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <Clock className="w-14 h-14 text-muted-foreground mb-5" />
      <h2 className="text-xl font-bold text-foreground mb-2">{section} em preparação</h2>
      <p className="text-muted-foreground text-center max-w-md text-sm">
        Esta seção será gerada automaticamente com IA. Em breve estará disponível.
      </p>
    </div>
  );

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
              <p className="text-muted-foreground text-sm mb-2">Proposta Comercial Exclusiva para:</p>
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
        const tierDescriptions: Record<string, string> = {
          A: "Multinacionais e grandes grupos — empresas dos sonhos",
          B: "Empresas médias consolidadas — oportunidades sólidas",
          C: "Empresas menores estratégicas — portas de entrada",
        };
        return (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Badge className={tier === "A" ? "bg-yellow-600" : tier === "B" ? "bg-blue-600" : "bg-green-600"}>
                Tier {tier}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">Mapeamento de Empresas</h2>
            </div>
            <p className="text-muted-foreground mb-6">{tierDescriptions[tier]}</p>
            {tierCompanies.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma empresa mapeada neste tier ainda.</p>
            ) : (
              <div className="grid gap-3">
                {tierCompanies.map((company) => (
                  <div key={company.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-foreground font-semibold">{company.name}</h3>
                      <p className="text-muted-foreground text-sm">{company.segment}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {company.has_openings && <Badge variant="outline" className="text-green-400 border-green-400/30">Vagas abertas</Badge>}
                      <Badge variant="secondary">{company.kanban_stage}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      default:
        return renderNotReady(slide.title);
    }
  };

  return (
    <div className="min-h-screen gradient-dark-bg">
      {/* Top Bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/")} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar - Slides Navigation */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {renderSlide()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-6 py-3 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
