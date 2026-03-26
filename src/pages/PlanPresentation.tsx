import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, ArrowLeft, Briefcase, Building2, Target, MessageSquare,
  Sparkles, Calendar, Search, TrendingUp, CheckCircle2, BarChart3,
  MapPin, ChevronLeft, ChevronRight, Users, Clock, Wand2
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { MentorshipPlan, Company, MessageTemplate, ScheduleActivity, JobTitleVariation } from "@/types/mentorship";

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
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();
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
      const { data, error } = await supabase.from("companies").select("*").eq("plan_id", id!);
      if (error) throw error;
      return data as Company[];
    },
    enabled: !!id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("message_templates").select("*").eq("plan_id", id!);
      if (error) throw error;
      return data as MessageTemplate[];
    },
    enabled: !!id,
  });

  const { data: schedule = [] } = useQuery({
    queryKey: ["schedule", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedule_activities").select("*").eq("plan_id", id!);
      if (error) throw error;
      return data as ScheduleActivity[];
    },
    enabled: !!id,
  });

  const { data: jobTitles = [] } = useQuery({
    queryKey: ["jobTitles", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_title_variations").select("*").eq("plan_id", id!);
      if (error) throw error;
      return data as JobTitleVariation[];
    },
    enabled: !!id,
  });

  const companyTiers = useMemo(() => ({
    A: companies.filter(c => c.tier === "A"),
    B: companies.filter(c => c.tier === "B"),
    C: companies.filter(c => c.tier === "C"),
  }), [companies]);

  const hasAIContent = companies.length > 0 || templates.length > 0 || schedule.length > 0 || jobTitles.length > 0;

  const handleGenerate = async (type: string = "all") => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke("generate-plan", {
        body: { plan_id: id, type },
      });
      if (resp.error) throw resp.error;
      toast.success("Conteúdo gerado com sucesso pela IA!");
      queryClient.invalidateQueries({ queryKey: ["companies", id] });
      queryClient.invalidateQueries({ queryKey: ["templates", id] });
      queryClient.invalidateQueries({ queryKey: ["schedule", id] });
      queryClient.invalidateQueries({ queryKey: ["jobTitles", id] });
      queryClient.invalidateQueries({ queryKey: ["plan", id] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar conteúdo");
    } finally {
      setGenerating(false);
    }
  };

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

  const renderGenerating = () => (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <Loader2 className="w-14 h-14 text-primary animate-spin mb-5" />
      <h2 className="text-xl font-bold text-foreground mb-2">Gerando plano com IA...</h2>
      <p className="text-muted-foreground text-center max-w-md text-sm">
        Estamos analisando o perfil e gerando empresas, mensagens, cronograma e muito mais. Isso pode levar alguns segundos.
      </p>
    </div>
  );

  const renderNotReady = (section: string) => (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <Clock className="w-14 h-14 text-muted-foreground mb-5" />
      <h2 className="text-xl font-bold text-foreground mb-2">{section} em preparação</h2>
      <p className="text-muted-foreground text-center max-w-md text-sm mb-6">
        Gere o plano completo na aba Capa para preencher todas as seções.
      </p>
      <Button onClick={() => { setCurrentSlide(0); handleGenerate("all"); }} disabled={generating}>
        {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
        Gerar Plano Completo com IA
      </Button>
    </div>
  );

  const linkedinGoals = plan.linkedin_goals as any;

  const renderSlide = () => {
    if (generating) return renderGenerating();

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
            {!hasAIContent && (
              <Button onClick={() => handleGenerate("all")} disabled={generating} className="mt-8" size="lg">
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

      case "diagnosis":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Diagnóstico do Perfil</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Cargo Atual</p>
                <p className="text-foreground font-semibold">{plan.current_position}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Área</p>
                <p className="text-foreground font-semibold">{plan.current_area}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Situação</p>
                <p className="text-foreground font-semibold">{plan.current_situation === "employed" ? "Empregado" : "Desempregado"}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Modelo</p>
                <p className="text-foreground font-semibold capitalize">{plan.work_model}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Localização</p>
                <p className="text-foreground font-semibold">{plan.city}, {plan.state}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Mudança de Carreira</p>
                <p className="text-foreground font-semibold">{plan.wants_career_change ? "Sim" : "Não"}</p>
              </div>
            </div>
            {jobTitles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Variações de Cargo (LinkedIn)</h3>
                <div className="flex flex-wrap gap-2">
                  {jobTitles.map(jt => (
                    <Badge key={jt.id} variant={jt.type === "target_position" ? "default" : "secondary"}>
                      {jt.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
        if (tierCompanies.length === 0) return renderNotReady("Empresas Tier " + tier);
        return (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Badge className={tier === "A" ? "bg-yellow-600" : tier === "B" ? "bg-blue-600" : "bg-green-600"}>
                Tier {tier}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">Mapeamento de Empresas</h2>
            </div>
            <p className="text-muted-foreground mb-6">{tierDescriptions[tier]}</p>
            <div className="grid gap-3">
              {tierCompanies.map((company) => (
                <div key={company.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-foreground font-semibold">{company.name}</h3>
                    <p className="text-muted-foreground text-sm">{company.segment}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {company.has_openings && <Badge variant="outline" className="text-primary border-primary/30">Vagas abertas</Badge>}
                    <Badge variant="secondary">{company.relevance_score}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "funnel": {
        const stages = [
          { key: "identified", label: "Identificadas", color: "bg-muted" },
          { key: "connection_sent", label: "Conexão Enviada", color: "bg-blue-600/20" },
          { key: "connected", label: "Conectado", color: "bg-primary/20" },
          { key: "message_sent", label: "Mensagem Enviada", color: "bg-yellow-600/20" },
          { key: "replied", label: "Respondeu", color: "bg-green-600/20" },
        ];
        if (companies.length === 0) return renderNotReady("Funil");
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Funil de Prospecção</h2>
            <div className="space-y-4">
              {stages.map(stage => {
                const stageCompanies = companies.filter(c => c.kanban_stage === stage.key);
                return (
                  <div key={stage.key} className={`${stage.color} rounded-lg p-4 border border-border`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-foreground font-semibold">{stage.label}</h3>
                      <Badge variant="secondary">{stageCompanies.length}</Badge>
                    </div>
                    {stageCompanies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {stageCompanies.map(c => (
                          <Badge key={c.id} variant="outline" className="text-foreground">{c.name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhuma empresa neste estágio</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "steps":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Passo a Passo da Estratégia</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: "Otimizar Perfil LinkedIn", desc: "Foto profissional, headline estratégica, resumo com palavras-chave" },
                { step: 2, title: "Mapeamento de Empresas", desc: `${companies.length} empresas mapeadas em 3 tiers de prioridade` },
                { step: 3, title: "Enviar Conexões Diárias", desc: `Meta: ${linkedinGoals?.connectionsPerDay || 50} conexões/dia para profissionais da área e RH` },
                { step: 4, title: "Mensagens Personalizadas", desc: `${templates.length} templates prontos para RH e decisores` },
                { step: 5, title: "Produção de Conteúdo", desc: `Meta: ${linkedinGoals?.postsPerWeek || 1} posts/semana sobre a área de atuação` },
                { step: 6, title: "Acompanhar Cronograma", desc: "Seguir o plano semanal de 4 semanas com atividades diárias" },
                { step: 7, title: "Medir Resultados", desc: "Acompanhar KPIs semanais e ajustar estratégia conforme necessário" },
              ].map(item => (
                <div key={item.step} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "messages":
        if (templates.length === 0) return renderNotReady("Mensagens");
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Templates de Mensagens</h2>
            <div className="space-y-6">
              {templates.map(t => (
                <div key={t.id} className="bg-card border border-border rounded-lg p-6">
                  <Badge className="mb-3">{t.type === "hr" ? "Para RH" : "Para Decisor"}</Badge>
                  <p className="text-foreground whitespace-pre-wrap text-sm">{t.template}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "content":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Estratégia de Conteúdo LinkedIn</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Meta Semanal</p>
                <p className="text-foreground font-bold text-2xl">{linkedinGoals?.postsPerWeek || 1} posts</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Conexões/Dia</p>
                <p className="text-foreground font-bold text-2xl">{linkedinGoals?.connectionsPerDay || 50}</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Ideias de Conteúdo</h3>
            <div className="space-y-3">
              {[
                `Compartilhe um aprendizado da sua experiência como ${plan.current_position}`,
                `Comente sobre tendências em ${plan.current_area}`,
                "Publique um case de sucesso ou projeto relevante",
                "Faça uma reflexão sobre liderança ou trabalho em equipe",
                "Compartilhe um artigo relevante com sua análise pessoal",
              ].map((idea, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-foreground text-sm">{idea}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "schedule":
        if (schedule.length === 0) return renderNotReady("Cronograma");
        const weeks = [1, 2, 3, 4];
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
        const dayLabels: Record<string, string> = { monday: "Seg", tuesday: "Ter", wednesday: "Qua", thursday: "Qui", friday: "Sex" };
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Cronograma Semanal</h2>
            <div className="space-y-6">
              {weeks.map(week => (
                <div key={week}>
                  <h3 className="text-lg font-semibold text-primary mb-3">Semana {week}</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {days.map(day => {
                      const activity = schedule.find(a => a.week_number === week && a.day_of_week === day);
                      return (
                        <div key={day} className="bg-card border border-border rounded-lg p-3">
                          <p className="text-muted-foreground text-xs font-semibold mb-1">{dayLabels[day]}</p>
                          <p className="text-foreground text-xs">{activity?.activity || "—"}</p>
                          {activity && <Badge variant="outline" className="mt-1 text-xs">{activity.category}</Badge>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "kpis":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">KPIs & Métricas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary">{companies.length}</p>
                <p className="text-muted-foreground text-sm">Empresas Mapeadas</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary">{companies.filter(c => c.has_openings).length}</p>
                <p className="text-muted-foreground text-sm">Com Vagas Abertas</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary">{templates.length}</p>
                <p className="text-muted-foreground text-sm">Templates Prontos</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary">{jobTitles.length}</p>
                <p className="text-muted-foreground text-sm">Variações de Cargo</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary">{schedule.filter(a => a.is_completed).length}/{schedule.length}</p>
                <p className="text-muted-foreground text-sm">Atividades Concluídas</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary">{linkedinGoals?.connectionsPerDay || 50}/dia</p>
                <p className="text-muted-foreground text-sm">Meta de Conexões</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Distribuição por Tier</h3>
            <div className="grid grid-cols-3 gap-4">
              {(["A", "B", "C"] as const).map(tier => (
                <div key={tier} className="bg-card border border-border rounded-lg p-4 text-center">
                  <Badge className={tier === "A" ? "bg-yellow-600 mb-2" : tier === "B" ? "bg-blue-600 mb-2" : "bg-green-600 mb-2"}>
                    Tier {tier}
                  </Badge>
                  <p className="text-2xl font-bold text-foreground">{companyTiers[tier].length}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "mapping":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Mapeamento Geral</h2>
            {companies.length === 0 ? renderNotReady("Mapeamento") : (
              <>
                <div className="bg-card border border-border rounded-lg p-4 mb-6">
                  <p className="text-muted-foreground text-sm mb-2">Resumo do Plano</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-foreground font-bold text-lg">{plan.mentee_name}</p>
                      <p className="text-muted-foreground text-xs">Mentorado</p>
                    </div>
                    <div>
                      <p className="text-foreground font-bold text-lg">{companies.length}</p>
                      <p className="text-muted-foreground text-xs">Empresas</p>
                    </div>
                    <div>
                      <p className="text-foreground font-bold text-lg">{schedule.length}</p>
                      <p className="text-muted-foreground text-xs">Atividades</p>
                    </div>
                    <div>
                      <p className="text-foreground font-bold text-lg">{templates.length}</p>
                      <p className="text-muted-foreground text-xs">Mensagens</p>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Todas as Empresas</h3>
                <div className="grid gap-2">
                  {companies.map(c => (
                    <div key={c.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{c.tier}</Badge>
                        <div>
                          <p className="text-foreground font-medium text-sm">{c.name}</p>
                          <p className="text-muted-foreground text-xs">{c.segment}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{c.kanban_stage}</Badge>
                        <Badge variant="outline" className="text-xs">{c.relevance_score}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );

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
          {!hasAIContent && (
            <Button onClick={() => handleGenerate("all")} disabled={generating} size="sm" variant="default">
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              Gerar com IA
            </Button>
          )}
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
