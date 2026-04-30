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
  { id: "linkedin-profile", title: "Perfil LinkedIn", icon: Linkedin },
  { id: "funnel", title: "Funil", icon: TrendingUp },
  { id: "steps", title: "Passo a Passo", icon: CheckCircle2 },
  { id: "messages", title: "Mensagens", icon: MessageSquare },
  { id: "content", title: "Conteúdo", icon: Sparkles },
  { id: "schedule", title: "Cronograma", icon: Calendar },
  { id: "mapping", title: "Mapeamento", icon: MapPin },
  { id: "documents", title: "Documentos", icon: FileText },
];

function ConsentModal({ name, onAccept }: { name: string; onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl max-w-lg w-full p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h2 className="text-foreground text-lg font-semibold">Privacidade e uso dos seus dados</h2>
            <p className="text-muted-foreground text-xs">Em conformidade com a LGPD — Lei nº 13.709/2018</p>
          </div>
        </div>

        <p className="text-foreground text-sm mb-4">
          Olá, <span className="font-medium">{name}</span>. Antes de acessar seu plano estratégico, precisamos do seu consentimento para o tratamento dos seus dados pessoais.
        </p>

        <div className="bg-secondary/50 rounded-lg p-4 mb-6 space-y-3 text-sm text-muted-foreground">
          <p><span className="text-foreground font-medium">Quais dados coletamos:</span> nome, cargo atual, cidade, área de atuação, objetivos de carreira e histórico de atividades do plano.</p>
          <p><span className="text-foreground font-medium">Para que usamos:</span> exclusivamente para compor e exibir seu plano de mentoria personalizado.</p>
          <p><span className="text-foreground font-medium">Com quem compartilhamos:</span> apenas com seu mentor responsável. Não vendemos nem compartilhamos seus dados com terceiros.</p>
          <p><span className="text-foreground font-medium">Retenção:</span> seus dados são mantidos enquanto o plano estiver ativo. Planos arquivados são anonimizados automaticamente após 2 anos.</p>
          <p><span className="text-foreground font-medium">Seus direitos:</span> você pode solicitar a exclusão completa dos seus dados a qualquer momento pelo rodapé desta página.</p>
        </div>

        <Button className="w-full" onClick={onAccept}>
          Entendi e aceito o uso dos meus dados
        </Button>
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

  // Single secure RPC call — validates token server-side via SECURITY DEFINER function.
  // No direct table access for anonymous users.
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

  // Show consent modal if mentee hasn't accepted yet
  useEffect(() => {
    if (plan && !plan.lgpd_consent_at) {
      setShowConsent(true);
    }
  }, [plan?.lgpd_consent_at]);

  const handleAcceptConsent = async () => {
    const { error } = await supabase.rpc("record_mentee_consent", { p_token: token! });
    if (error) {
      toast.error("Erro ao registrar consentimento. Tente novamente.");
      return;
    }
    setShowConsent(false);
    queryClient.invalidateQueries({ queryKey: ["mentee-plan", token] });
  };

  const handleDeleteData = async () => {
    if (!confirm("Tem certeza? Esta ação irá remover permanentemente todos os seus dados pessoais deste plano e não pode ser desfeita.")) return;
    const { error } = await supabase.rpc("request_mentee_data_deletion", { p_token: token! });
    if (error) {
      toast.error("Erro ao processar solicitação. Entre em contato com seu mentor.");
      return;
    }
    setDeletionRequested(true);
  };

  const companyTiers = useMemo(() => ({
    A: companies.filter((c: Company) => c.tier === "A"),
    B: companies.filter((c: Company) => c.tier === "B"),
    C: companies.filter((c: Company) => c.tier === "C"),
  }), [companies]);

  const hasAIContent = companies.length > 0 || templates.length > 0 || schedule.length > 0 || jobTitles.length > 0;

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["mentee-plan", token] });
  };

  // No-op for mentee — AI generation is disabled
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
          <p className="text-muted-foreground text-sm">Carregando seu plano estratégico...</p>
        </div>
      </div>
    );
  }

  if (deletionRequested) {
    return (
      <div className="min-h-screen gradient-dark-bg flex items-center justify-center p-6">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-foreground text-xl font-semibold mb-2">Dados excluídos com sucesso</h1>
          <p className="text-muted-foreground text-sm max-w-sm">Todos os seus dados pessoais foram removidos conforme solicitado. Este link não é mais válido.</p>
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
    switch (slide.id) {
      case "dashboard": return <DashboardSlide {...slideProps} />;
      case "diagnosis": return <DiagnosisSlide {...slideProps} />;
      case "companies-a": return <CompanyTierSlide tier="A" companies={companyTiers.A} planId={plan.id} onSelectCompany={setSelectedCompany} onRefreshData={refreshData} isMentee />;
      case "companies-b": return <CompanyTierSlide tier="B" companies={companyTiers.B} planId={plan.id} onSelectCompany={setSelectedCompany} onRefreshData={refreshData} isMentee />;
      case "companies-c": return <CompanyTierSlide tier="C" companies={companyTiers.C} planId={plan.id} onSelectCompany={setSelectedCompany} onRefreshData={refreshData} isMentee />;
      case "jobs": return <JobTitlesSlide {...slideProps} />;
      case "linkedin-profile": return <LinkedInProfileSlide {...slideProps} />;
      case "funnel": return <FunnelSlide {...slideProps} />;
      case "steps": return <StepsSlide {...slideProps} />;
      case "messages": return <MessagesSlide {...slideProps} />;
      case "content": return <ContentSlide {...slideProps} />;
      case "schedule": return <ScheduleSlide {...slideProps} />;
      case "mapping": return <MappingSlide {...slideProps} />;
      case "documents": return <DocumentsSlide {...slideProps} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen gradient-dark-bg flex flex-col">
      {showConsent && <ConsentModal name={plan.mentee_name} onAccept={handleAcceptConsent} />}

      {/* Top Bar */}
      <div className="border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-foreground font-semibold">{plan.mentee_name}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{plan.current_position}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{plan.city}, {plan.state}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-44 border-r border-border overflow-y-auto p-2 space-y-0.5 shrink-0">
          {visibleSlides.map((slide, idx) => {
            const Icon = slide.icon;
            return (
              <button
                key={slide.id}
                onClick={() => { setCurrentSlide(idx); setSelectedCompany(null); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  idx === currentSlide
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {renderSlide()}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-2 flex items-center justify-between shrink-0">
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
