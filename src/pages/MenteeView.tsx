import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Loader2, Building2, MessageSquare, Sparkles, Calendar,
  Search, TrendingUp, CheckCircle2, BarChart3, MapPin,
  AlertCircle, Target, FileText, Linkedin, Shield, Trash2
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import type { MentorshipPlan, Company, MessageTemplate, ScheduleActivity, JobTitleVariation, ContactMapping } from "@/types/mentorship";
import type { PlanSlideProps } from "@/components/plan/types";

import DashboardSlide from "@/components/plan/slides/DashboardSlide";
import DiagnosisSlide from "@/components/plan/slides/DiagnosisSlide";
import CompanyTierSlide from "@/components/plan/slides/CompanyTierSlide";
import CompanyDetailSlide from "@/components/plan/slides/CompanyDetailSlide";
import JobTitlesSlide from "@/components/plan/slides/JobTitlesSlide";
import LinkedInProfileSlide from "@/components/plan/slides/LinkedInProfileSlide";
import FunnelSlide from "@/components/plan/slides/FunnelSlide";
import StepsSlide from "@/components/plan/slides/StepsSlide";
import MessagesSlide from "@/components/plan/slides/MessagesSlide";
import ContentSlide from "@/components/plan/slides/ContentSlide";
import ScheduleSlide from "@/components/plan/slides/ScheduleSlide";
import MappingSlide from "@/components/plan/slides/MappingSlide";
import DocumentsSlide from "@/components/plan/slides/DocumentsSlide";

const slides = [
  { id: "dashboard", title: "Dashboard", icon: BarChart3 },
  { id: "diagnosis", title: "Diagnóstico", icon: Search },
  { id: "companies-a", title: "Tier A", icon: Building2 },
  { id: "companies-b", title: "Tier B", icon: Building2 },
  { id: "companies-c", title: "Tier C", icon: Building2 },
  { id: "jobs", title: "Cargos", icon: Target },
  { id: "linkedin-profile", title: "LinkedIn", icon: Linkedin },
  { id: "funnel", title: "Funil", icon: TrendingUp },
  { id: "steps", title: "Passos", icon: CheckCircle2 },
  { id: "messages", title: "Mensagens", icon: MessageSquare },
  { id: "content", title: "Conteúdo", icon: Sparkles },
  { id: "schedule", title: "Agenda", icon: Calendar },
  { id: "mapping", title: "Contatos", icon: MapPin },
  { id: "documents", title: "Docs", icon: FileText },
];

function ConsentModal({ name, onAccept }: { name: string; onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <Shield className="w-7 h-7 text-primary shrink-0" />
          <div>
            <h2 className="text-foreground text-base font-semibold">Privacidade e uso dos seus dados</h2>
            <p className="text-muted-foreground text-xs">Em conformidade com a LGPD — Lei nº 13.709/2018</p>
          </div>
        </div>
        <p className="text-foreground text-sm mb-4">
          Olá, <span className="font-medium">{name}</span>. Antes de acessar seu plano, precisamos do seu consentimento para o tratamento dos seus dados pessoais.
        </p>
        <div className="bg-secondary/50 rounded-lg p-4 mb-5 space-y-2 text-xs text-muted-foreground">
          <p><span className="text-foreground font-medium">Dados coletados:</span> nome, cargo, cidade, área e histórico de atividades.</p>
          <p><span className="text-foreground font-medium">Finalidade:</span> exclusivamente para compor e exibir seu plano de mentoria.</p>
          <p><span className="text-foreground font-medium">Compartilhamento:</span> apenas com seu mentor. Não vendemos dados.</p>
          <p><span className="text-foreground font-medium">Retenção:</span> planos arquivados são anonimizados após 2 anos.</p>
          <p><span className="text-foreground font-medium">Seus direitos:</span> solicite exclusão a qualquer momento no rodapé desta página.</p>
        </div>
        <Button className="w-full" onClick={onAccept}>Entendi e aceito</Button>
      </div>
    </div>
  );
}

export default function MenteeView() {
  const { token } = useParams<{ token: string }>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const queryClient = useQueryClient();

  const { data: planData, isLoading, error } = useQuery({
    queryKey: ["mentee-plan", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_mentee_plan_data", { p_token: token! });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as {
        plan: MentorshipPlan;
        companies: Company[];
        templates: MessageTemplate[];
        schedule: ScheduleActivity[];
        job_titles: JobTitleVariation[];
        contacts: ContactMapping[];
      };
    },
    enabled: !!token,
    retry: false,
  });

  const plan = planData?.plan;
  const companies = planData?.companies ?? [];
  const templates = planData?.templates ?? [];
  const schedule = planData?.schedule ?? [];
  const jobTitles = planData?.job_titles ?? [];
  const contacts = planData?.contacts ?? [];

  useEffect(() => {
    if (plan && !plan.lgpd_consent_at) setShowConsent(true);
  }, [plan?.lgpd_consent_at]);

  const handleAcceptConsent = async () => {
    const { error } = await supabase.rpc("record_mentee_consent", { p_token: token! });
    if (error) { toast.error("Erro ao registrar consentimento."); return; }
    setShowConsent(false);
    queryClient.invalidateQueries({ queryKey: ["mentee-plan", token] });
  };

  const handleDeleteData = async () => {
    if (!confirm("Tem certeza? Esta ação remove permanentemente todos os seus dados e não pode ser desfeita.")) return;
    const { error } = await supabase.rpc("request_mentee_data_deletion", { p_token: token! });
    if (error) { toast.error("Erro. Entre em contato com seu mentor."); return; }
    setDeletionRequested(true);
  };

  const companyTiers = useMemo(() => ({
    A: companies.filter((c: Company) => c.tier === "A"),
    B: companies.filter((c: Company) => c.tier === "B"),
    C: companies.filter((c: Company) => c.tier === "C"),
  }), [companies]);

  const hasAIContent = companies.length > 0 || templates.length > 0 || schedule.length > 0 || jobTitles.length > 0;
  const refreshData = () => queryClient.invalidateQueries({ queryKey: ["mentee-plan", token] });
  const handleGenerate = () => {};

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
          <p className="text-muted-foreground text-sm">Carregando seu plano...</p>
        </div>
      </div>
    );
  }

  if (deletionRequested) {
    return (
      <div className="min-h-screen gradient-dark-bg flex items-center justify-center p-6">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-foreground text-xl font-semibold mb-2">Dados excluídos</h1>
          <p className="text-muted-foreground text-sm max-w-sm">Todos os seus dados foram removidos. Este link não é mais válido.</p>
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

  const visibleSlides = useMemo(() => {
    if (!plan?.visible_slides || plan.visible_slides.length === 0) return slides;
    return slides.filter(s => (plan.visible_slides as string[]).includes(s.id));
  }, [plan?.visible_slides]);

  const slideProps: PlanSlideProps = {
    plan, companies, companyTiers, templates, schedule, jobTitles, contacts,
    generating: false, hasAIContent, onGenerate: handleGenerate, onRefreshData: refreshData,
    isMentee: true,
    menteeToken: token,
  };

  const renderSlide = () => {
    if (selectedCompany) {
      return (
        <CompanyDetailSlide
          company={selectedCompany}
          contacts={contacts}
          onBack={() => setSelectedCompany(null)}
          onRefreshData={refreshData}
          isMentee
        />
      );
    }
    const slide = visibleSlides[currentSlide];
    if (!slide) return null;
    switch (slide.id) {
      case "dashboard":      return <DashboardSlide {...slideProps} />;
      case "diagnosis":      return <DiagnosisSlide {...slideProps} />;
      case "companies-a":    return <CompanyTierSlide tier="A" companies={companyTiers.A} planId={plan.id} onSelectCompany={setSelectedCompany} onRefreshData={refreshData} isMentee />;
      case "companies-b":    return <CompanyTierSlide tier="B" companies={companyTiers.B} planId={plan.id} onSelectCompany={setSelectedCompany} onRefreshData={refreshData} isMentee />;
      case "companies-c":    return <CompanyTierSlide tier="C" companies={companyTiers.C} planId={plan.id} onSelectCompany={setSelectedCompany} onRefreshData={refreshData} isMentee />;
      case "jobs":           return <JobTitlesSlide {...slideProps} />;
      case "linkedin-profile": return <LinkedInProfileSlide {...slideProps} />;
      case "funnel":         return <FunnelSlide {...slideProps} />;
      case "steps":          return <StepsSlide {...slideProps} />;
      case "messages":       return <MessagesSlide {...slideProps} />;
      case "content":        return <ContentSlide {...slideProps} />;
      case "schedule":       return <ScheduleSlide {...slideProps} />;
      case "mapping":        return <MappingSlide {...slideProps} />;
      case "documents":      return <DocumentsSlide {...slideProps} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen gradient-dark-bg flex flex-col">
      {showConsent && <ConsentModal name={plan.mentee_name} onAccept={handleAcceptConsent} />}

      {/* Top Bar */}
      <div className="border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <span className="text-foreground font-semibold truncate">{plan.mentee_name}</span>
          <span className="text-muted-foreground hidden sm:inline mx-1">•</span>
          <span className="text-muted-foreground text-xs truncate hidden sm:inline">{plan.current_position}</span>
          <span className="text-muted-foreground hidden md:inline mx-1">•</span>
          <span className="text-muted-foreground text-xs hidden md:inline">{plan.city}, {plan.state}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar — hidden on mobile */}
        <div className="hidden md:block w-44 border-r border-border overflow-y-auto p-2 space-y-0.5 shrink-0">
          {visibleSlides.map((slide, idx) => {
            const Icon = slide.icon;
            return (
              <button
                key={slide.id}
                onClick={() => { setCurrentSlide(idx); setSelectedCompany(null); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  idx === currentSlide && !selectedCompany
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{slide.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content — extra padding-bottom on mobile for bottom nav */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {renderSlide()}
        </div>
      </div>

      {/* Mobile Bottom Nav — hidden on desktop */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex overflow-x-auto scrollbar-hide px-1 py-1 gap-0.5">
          {visibleSlides.map((slide, idx) => {
            const Icon = slide.icon;
            const isActive = idx === currentSlide && !selectedCompany;
            return (
              <button
                key={slide.id}
                onClick={() => { setCurrentSlide(idx); setSelectedCompany(null); }}
                className={`flex flex-col items-center gap-0.5 min-w-[54px] px-2 py-1.5 rounded-lg transition-colors shrink-0 ${
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] leading-tight text-center">{slide.title}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer com exclusão de dados — desktop only */}
      <div className="hidden md:flex border-t border-border px-6 py-2 items-center justify-between shrink-0">
        <p className="text-muted-foreground text-xs">powered by <span className="text-primary font-medium">Orion Recruitment</span></p>
        <button
          onClick={handleDeleteData}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Solicitar exclusão dos meus dados
        </button>
      </div>
    </div>
  );
}
