import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Loader2, ArrowLeft, Briefcase, Building2, MessageSquare,
  Sparkles, Calendar, Search, TrendingUp, CheckCircle2, BarChart3,
  MapPin, Target, FileText, Linkedin, RefreshCw, Link2, Download,
  FileSpreadsheet, Copy, Check, UserPlus
} from "lucide-react";
import { useState, useMemo } from "react";
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

export default function PlanPresentation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [menteeDialogOpen, setMenteeDialogOpen] = useState(false);
  const [menteeEmail, setMenteeEmail] = useState("");
  const [menteePassword, setMenteePassword] = useState("");
  const [creatingMentee, setCreatingMentee] = useState(false);
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ["plan", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("mentorship_plans").select("*").eq("id", id!).eq("user_id", user!.id).single();
      if (error) throw error;
      return data as unknown as MentorshipPlan;
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

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_mappings").select("*").eq("plan_id", id!);
      if (error) throw error;
      return data as ContactMapping[];
    },
    enabled: !!id,
  });

  const companyTiers = useMemo(() => ({
    A: companies.filter(c => c.tier === "A"),
    B: companies.filter(c => c.tier === "B"),
    C: companies.filter(c => c.tier === "C"),
  }), [companies]);

  const hasAIContent = companies.length > 0 || templates.length > 0 || schedule.length > 0 || jobTitles.length > 0;

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["companies", id] });
    queryClient.invalidateQueries({ queryKey: ["templates", id] });
    queryClient.invalidateQueries({ queryKey: ["schedule", id] });
    queryClient.invalidateQueries({ queryKey: ["jobTitles", id] });
    queryClient.invalidateQueries({ queryKey: ["contacts", id] });
    queryClient.invalidateQueries({ queryKey: ["plan", id] });
  };

  const handleGenerate = async (type: string = "all") => {
    setGenerating(true);
    try {
      const resp = await supabase.functions.invoke("generate-plan", {
        body: { plan_id: id, type },
      });
      if (resp.error) throw resp.error;
      toast.success("Conteúdo gerado com sucesso!");
      refreshData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar conteúdo");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateMenteeAccess = async () => {
    if (!plan || !menteeEmail || !menteePassword) return;
    if (menteePassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setCreatingMentee(true);
    try {
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
      const accessToken = refreshedSession.session?.access_token;

      if (refreshError || !accessToken) {
        await signOut();
        toast.error("Sua sessão expirou. Faça login novamente para criar o acesso do mentorado.");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("register-mentee", {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          email: menteeEmail,
          password: menteePassword,
          plan_id: plan.id,
          mentee_name: plan.mentee_name,
        },
      });
      if (error) {
        const message = error.message?.includes("401")
          ? "Sua sessão expirou. Faça login novamente para criar o acesso do mentorado."
          : error.message;
        if (error.message?.includes("401")) {
          await signOut();
          navigate("/auth");
        }
        throw new Error(message || "Erro ao criar acesso do mentorado");
      }
      if (data?.error) throw new Error(data.details || data.error);
      toast.success(`Acesso criado! O mentorado pode fazer login com ${menteeEmail}`);
      setMenteeDialogOpen(false);
      setMenteeEmail("");
      setMenteePassword("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar acesso do mentorado");
    } finally {
      setCreatingMentee(false);
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

  const slideProps: PlanSlideProps = {
    plan, companies, companyTiers, templates, schedule, jobTitles, contacts,
    generating, hasAIContent, onGenerate: handleGenerate, onRefreshData: refreshData,
  };

  const renderSlide = () => {
    if (generating && slides[currentSlide].id === "dashboard") {
      return (
        <div className="h-full flex flex-col items-center justify-center p-12">
          <Loader2 className="w-14 h-14 text-primary animate-spin mb-5" />
          <h2 className="text-xl font-bold text-foreground mb-2">Gerando plano com IA...</h2>
          <p className="text-muted-foreground text-center max-w-md text-sm">
            Analisando perfil e gerando empresas, mensagens, cronograma e muito mais.
          </p>
        </div>
      );
    }

    // Company detail view
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
      case "companies-a": return <CompanyTierSlide tier="A" companies={companyTiers.A} planId={plan.id} onSelectCompany={setSelectedCompany} onRefreshData={refreshData} />;
      case "companies-b": return <CompanyTierSlide tier="B" companies={companyTiers.B} planId={plan.id} onSelectCompany={setSelectedCompany} onRefreshData={refreshData} />;
      case "companies-c": return <CompanyTierSlide tier="C" companies={companyTiers.C} planId={plan.id} onSelectCompany={setSelectedCompany} onRefreshData={refreshData} />;
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
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-foreground font-semibold">{plan.mentee_name}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{plan.current_position}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{plan.city}, {plan.state}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {generating && (
            <div className="flex items-center gap-2 text-primary text-sm mr-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gerando plano estratégico completo...</span>
            </div>
          )}
          {hasAIContent && !generating && (
            <Button variant="ghost" size="sm" onClick={() => handleGenerate("all")}>
              <RefreshCw className="w-4 h-4 mr-1" /> Regenerar
            </Button>
          )}
          <Dialog open={menteeDialogOpen} onOpenChange={setMenteeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <UserPlus className="w-4 h-4 mr-1" /> Acesso Mentorado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Acesso do Mentorado</DialogTitle>
                <DialogDescription>
                  Defina email e senha para o mentorado acessar seu plano
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email do Mentorado</Label>
                  <Input
                    type="email"
                    value={menteeEmail}
                    onChange={(e) => setMenteeEmail(e.target.value)}
                    placeholder="mentorado@email.com"
                  />
                </div>
                <div>
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={menteePassword}
                    onChange={(e) => setMenteePassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>
                <Button onClick={handleCreateMenteeAccess} disabled={creatingMentee || !menteeEmail || !menteePassword} className="w-full">
                  {creatingMentee && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Acesso
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="sm" onClick={() => {
            fetch("/orion-linkedin-extension.zip")
              .then(res => { if (!res.ok) throw new Error("Download failed"); return res.blob(); })
              .then(blob => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "orion-linkedin-extension.zip";
                a.click();
                URL.revokeObjectURL(a.href);
              })
              .catch(() => toast.error("Erro ao baixar extensão"));
          }}>
            <Download className="w-4 h-4 mr-1" /> Extensão Chrome
          </Button>
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
