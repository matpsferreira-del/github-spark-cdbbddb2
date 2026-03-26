import type { MentorshipPlan, Company, MessageTemplate, ScheduleActivity, JobTitleVariation, ContactMapping } from "@/types/mentorship";

export interface PlanSlideProps {
  plan: MentorshipPlan;
  companies: Company[];
  companyTiers: { A: Company[]; B: Company[]; C: Company[] };
  templates: MessageTemplate[];
  schedule: ScheduleActivity[];
  jobTitles: JobTitleVariation[];
  contacts: ContactMapping[];
  generating: boolean;
  hasAIContent: boolean;
  onGenerate: (type: string) => void;
  onRefreshData: () => void;
}

export interface DiagnosisData {
  swot?: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  steps?: Array<{
    step: number;
    title: string;
    description: string;
    tip: string;
    time: string;
  }>;
  month_goals?: {
    month1: string[];
    month2: string[];
    month3: string[];
  };
  linkedin_tips?: string[];
  content_prompts?: Array<{
    title: string;
    prompt: string;
  }>;
  linkedin_profile?: {
    sections: Array<{
      key: string;
      title: string;
      ideal_text: string;
      explanation: string;
    }>;
  };
}

export function parseDiagnosisData(generalNotes: string | null): DiagnosisData {
  if (!generalNotes) return {};
  try {
    return JSON.parse(generalNotes);
  } catch {
    return {};
  }
}
