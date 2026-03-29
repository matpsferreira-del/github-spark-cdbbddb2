import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Loader2, Building2, MessageSquare, Sparkles, Calendar,
  Search, TrendingUp, CheckCircle2, BarChart3, MapPin,
  AlertCircle, Target, FileText, Linkedin
} from "lucide-react";
import { useState, useMemo } from "react";
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

export default function MenteeView() {
  const { token } = useParams<{ token: string }>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const queryClient = useQueryClient();

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

  const plan = accessData?.plan as unknown as MentorshipPlan | undefined;
  const planId = plan?.id;

  const { data: companies = [] } = useQuery({
    queryKey: ["companies", planId],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").eq("plan_id", planId!);
      if (error) throw error;
      return data as Company[];
    },
    enabled: !!planId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates", planId],
    queryFn: async () => {
      const { data, error } = await supabase.from("message_templates").select("*").eq("plan_id", planId!);
      if (error) throw error;
      return data as MessageTemplate[];
    },
    enabled: !!planId,
  });

  const { data: schedule = [] } = useQuery({
    queryKey: ["schedule", planId],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedule_activities").select("*").eq("plan_id", planId!);
      if (error) throw error;
      return data as ScheduleActivity[];
    },
    enabled: !!planId,
  });

  const { data: jobTitles = [] } = useQuery({
    queryKey: ["jobTitles", planId],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_title_variations").select("*").eq("plan_id", planId!);
      if (error) throw error;
      return data as JobTitleVariation[];
    },
    enabled: !!planId,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", planId],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_mappings").select("*").eq("plan_id", planId!);
      if (error) throw error;
      return data as ContactMapping[];
    },
    enabled: !!planId,
  });

  const companyTiers = useMemo(() => ({
    A: companies.filter(c => c.tier === "A"),
    B: companies.filter(c => c.tier === "B"),
    C: companies.filter(c => c.tier === "C"),
  }), [companies]);

  const hasAIContent = companies.length > 0 || templates.length > 0 || schedule.length > 0 || jobTitles.length > 0;

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["companies", planId] });
    queryClient.invalidateQueries({ queryKey: ["templates", planId] });
    queryClient.invalidateQueries({ queryKey: ["schedule", planId] });
    queryClient.invalidateQueries({ queryKey: ["jobTitles", planId] });
    queryClient.invalidateQueries({ queryKey: ["contacts", planId] });
    queryClient.invalidateQueries({ queryKey: ["mentee-access", token] });
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

  const slideProps: PlanSlideProps = {
    plan, companies, companyTiers, templates, schedule, jobTitles, contacts,
    generating: false, hasAIContent, onGenerate: handleGenerate, onRefreshData: refreshData,
    isMentee: true,
  };

  const renderSlide = () => {
    if (selectedCompany) {
      return (
        <CompanyDetailSlide
          company={selectedCompany}
          contacts={contacts}
          onBack={() => setSelectedCompany(null)}
          onRefreshData={refreshData}
        />
      );
    }

    const slide = slides[currentSlide];
    switch (slide.id) {
      case "dashboard": return <DashboardSlide {...slideProps} />;
      case "diagnosis": return <DiagnosisSlide {...slideProps} />;
      case "companies-a": return <CompanyTierSlide tier="A" companies={companyTiers.A} onSelectCompany={setSelectedCompany} />;
      case "companies-b": return <CompanyTierSlide tier="B" companies={companyTiers.B} onSelectCompany={setSelectedCompany} />;
      case "companies-c": return <CompanyTierSlide tier="C" companies={companyTiers.C} onSelectCompany={setSelectedCompany} />;
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
          {slides.map((slide, idx) => {
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
      <div className="border-t border-border px-6 py-2 text-center shrink-0">
        <p className="text-muted-foreground text-xs">powered by <span className="text-primary font-medium">Orion Recruitment</span></p>
      </div>
    </div>
  );
}
