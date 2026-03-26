-- Mentorship Plans table
CREATE TABLE public.mentorship_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_name VARCHAR(255) NOT NULL,
  current_position VARCHAR(255) NOT NULL,
  current_area VARCHAR(255) NOT NULL,
  current_situation VARCHAR(20) NOT NULL DEFAULT 'employed' CHECK (current_situation IN ('employed', 'unemployed')),
  state VARCHAR(2) NOT NULL,
  city VARCHAR(255) NOT NULL,
  region_preference VARCHAR(20) NOT NULL DEFAULT 'same_region' CHECK (region_preference IN ('same_region', 'open_to_change')),
  available_cities JSONB DEFAULT '[]',
  work_model VARCHAR(20) NOT NULL DEFAULT 'hibrido' CHECK (work_model IN ('presencial', 'hibrido', 'remoto')),
  wants_career_change BOOLEAN NOT NULL DEFAULT false,
  target_positions JSONB DEFAULT '[]',
  general_notes TEXT,
  linkedin_goals JSONB NOT NULL DEFAULT '{"connectionsPerDay": 50, "postsPerWeek": 1, "connectionTypes": ["area", "hr"]}',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.mentorship_plans(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  segment VARCHAR(255) NOT NULL,
  tier VARCHAR(1) NOT NULL CHECK (tier IN ('A', 'B', 'C')),
  has_openings BOOLEAN NOT NULL DEFAULT false,
  relevance_score NUMERIC(3,2) DEFAULT 0.00,
  notes TEXT,
  kanban_stage VARCHAR(20) NOT NULL DEFAULT 'identified' CHECK (kanban_stage IN ('identified', 'connection_sent', 'connected', 'message_sent', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job Title Variations table
CREATE TABLE public.job_title_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.mentorship_plans(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'current_variation' CHECK (type IN ('current_variation', 'target_position')),
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Message Templates table
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.mentorship_plans(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('hr', 'decision_maker')),
  template TEXT NOT NULL,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contact Mappings table
CREATE TABLE public.contact_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.mentorship_plans(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  current_position VARCHAR(255),
  company VARCHAR(255),
  linkedin_url VARCHAR(512),
  type VARCHAR(20) NOT NULL DEFAULT 'decision_maker' CHECK (type IN ('decision_maker', 'hr', 'other')),
  tier VARCHAR(1) NOT NULL DEFAULT 'A' CHECK (tier IN ('A', 'B', 'C')),
  status VARCHAR(20) NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'connection_sent', 'connected', 'message_sent', 'replied', 'meeting_scheduled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Schedule Activities table
CREATE TABLE public.schedule_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.mentorship_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  activity TEXT NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('linkedin', 'networking', 'content', 'research', 'applications')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Plan Access Tokens table
CREATE TABLE public.plan_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.mentorship_plans(id) ON DELETE CASCADE,
  token VARCHAR(128) NOT NULL UNIQUE,
  mentee_name VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- CV Documents table
CREATE TABLE public.cv_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.mentorship_plans(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('linkedin_pdf', 'personal_cv')),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  extracted_text TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.mentorship_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_title_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentorship_plans
CREATE POLICY "Users can view their own plans" ON public.mentorship_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own plans" ON public.mentorship_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plans" ON public.mentorship_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plans" ON public.mentorship_plans FOR DELETE USING (auth.uid() = user_id);

-- Helper function to check plan ownership
CREATE OR REPLACE FUNCTION public.user_owns_plan(plan_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mentorship_plans WHERE id = plan_uuid AND user_id = auth.uid()
  )
$$;

-- RLS for child tables
CREATE POLICY "Users can view companies of their plans" ON public.companies FOR SELECT USING (public.user_owns_plan(plan_id));
CREATE POLICY "Users can insert companies to their plans" ON public.companies FOR INSERT WITH CHECK (public.user_owns_plan(plan_id));
CREATE POLICY "Users can update companies of their plans" ON public.companies FOR UPDATE USING (public.user_owns_plan(plan_id));
CREATE POLICY "Users can delete companies of their plans" ON public.companies FOR DELETE USING (public.user_owns_plan(plan_id));

CREATE POLICY "Users can view job titles of their plans" ON public.job_title_variations FOR SELECT USING (public.user_owns_plan(plan_id));
CREATE POLICY "Users can insert job titles to their plans" ON public.job_title_variations FOR INSERT WITH CHECK (public.user_owns_plan(plan_id));
CREATE POLICY "Users can delete job titles of their plans" ON public.job_title_variations FOR DELETE USING (public.user_owns_plan(plan_id));

CREATE POLICY "Users can view message templates of their plans" ON public.message_templates FOR SELECT USING (public.user_owns_plan(plan_id));
CREATE POLICY "Users can insert message templates" ON public.message_templates FOR INSERT WITH CHECK (public.user_owns_plan(plan_id));
CREATE POLICY "Users can update message templates" ON public.message_templates FOR UPDATE USING (public.user_owns_plan(plan_id));
CREATE POLICY "Users can delete message templates" ON public.message_templates FOR DELETE USING (public.user_owns_plan(plan_id));

CREATE POLICY "Users can view contacts of their plans" ON public.contact_mappings FOR SELECT USING (public.user_owns_plan(plan_id));
CREATE POLICY "Users can insert contacts" ON public.contact_mappings FOR INSERT WITH CHECK (public.user_owns_plan(plan_id));
CREATE POLICY "Users can update contacts" ON public.contact_mappings FOR UPDATE USING (public.user_owns_plan(plan_id));
CREATE POLICY "Users can delete contacts" ON public.contact_mappings FOR DELETE USING (public.user_owns_plan(plan_id));

CREATE POLICY "Users can view schedule activities" ON public.schedule_activities FOR SELECT USING (public.user_owns_plan(plan_id));
CREATE POLICY "Users can insert schedule activities" ON public.schedule_activities FOR INSERT WITH CHECK (public.user_owns_plan(plan_id));
CREATE POLICY "Users can update schedule activities" ON public.schedule_activities FOR UPDATE USING (public.user_owns_plan(plan_id));
CREATE POLICY "Users can delete schedule activities" ON public.schedule_activities FOR DELETE USING (public.user_owns_plan(plan_id));

CREATE POLICY "Users can view access tokens of their plans" ON public.plan_access_tokens FOR SELECT USING (public.user_owns_plan(plan_id));
CREATE POLICY "Users can create access tokens" ON public.plan_access_tokens FOR INSERT WITH CHECK (public.user_owns_plan(plan_id));
CREATE POLICY "Users can update access tokens" ON public.plan_access_tokens FOR UPDATE USING (public.user_owns_plan(plan_id));

-- Public access via token for mentee view
CREATE POLICY "Anyone can read active tokens by token value" ON public.plan_access_tokens FOR SELECT USING (is_active = true);

-- Allow public read of companies via access token
CREATE POLICY "Public can view companies via access token" ON public.companies FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.plan_access_tokens WHERE plan_id = companies.plan_id AND is_active = true)
);

CREATE POLICY "Users can view cv documents" ON public.cv_documents FOR SELECT USING (public.user_owns_plan(plan_id));
CREATE POLICY "Users can insert cv documents" ON public.cv_documents FOR INSERT WITH CHECK (public.user_owns_plan(plan_id));
CREATE POLICY "Users can delete cv documents" ON public.cv_documents FOR DELETE USING (public.user_owns_plan(plan_id));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER update_mentorship_plans_updated_at BEFORE UPDATE ON public.mentorship_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_mappings_updated_at BEFORE UPDATE ON public.contact_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_mentorship_plans_user_id ON public.mentorship_plans(user_id);
CREATE INDEX idx_companies_plan_id ON public.companies(plan_id);
CREATE INDEX idx_job_title_variations_plan_id ON public.job_title_variations(plan_id);
CREATE INDEX idx_message_templates_plan_id ON public.message_templates(plan_id);
CREATE INDEX idx_contact_mappings_plan_id ON public.contact_mappings(plan_id);
CREATE INDEX idx_schedule_activities_plan_id ON public.schedule_activities(plan_id);
CREATE INDEX idx_plan_access_tokens_plan_id ON public.plan_access_tokens(plan_id);
CREATE INDEX idx_plan_access_tokens_token ON public.plan_access_tokens(token);
CREATE INDEX idx_cv_documents_plan_id ON public.cv_documents(plan_id);