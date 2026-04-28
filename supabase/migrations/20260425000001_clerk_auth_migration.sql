-- Migração: Supabase Auth → Clerk
-- user_id UUID → TEXT (Clerk user IDs são strings como "user_2abc...")
-- RLS policies atualizadas para usar (auth.jwt() ->> 'sub') em vez de auth.uid()

-- 1. Remover FK constraints (auth.users não é mais a fonte de auth)
ALTER TABLE public.mentorship_plans DROP CONSTRAINT IF EXISTS mentorship_plans_user_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.mentee_plan_access DROP CONSTRAINT IF EXISTS mentee_plan_access_user_id_fkey;

-- 2. Alterar tipo de UUID para TEXT
ALTER TABLE public.mentorship_plans ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.mentee_plan_access ALTER COLUMN user_id TYPE TEXT;

-- 3. Remover trigger do Supabase Auth (Clerk gerencia criação de usuários)
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- 4. Atualizar funções helper para usar TEXT
CREATE OR REPLACE FUNCTION public.user_owns_plan(plan_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mentorship_plans
    WHERE id = plan_uuid AND user_id = (auth.jwt() ->> 'sub')
  )
$$;

DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
CREATE OR REPLACE FUNCTION public.has_role(_user_id TEXT, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP FUNCTION IF EXISTS public.mentee_has_access(uuid, uuid);
CREATE OR REPLACE FUNCTION public.mentee_has_access(_user_id TEXT, _plan_id UUID)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.mentee_plan_access WHERE user_id = _user_id AND plan_id = _plan_id)
$$;

-- 5. Recriar policies de mentorship_plans
DROP POLICY IF EXISTS "Users can view their own plans" ON public.mentorship_plans;
DROP POLICY IF EXISTS "Users can create their own plans" ON public.mentorship_plans;
DROP POLICY IF EXISTS "Users can update their own plans" ON public.mentorship_plans;
DROP POLICY IF EXISTS "Users can delete their own plans" ON public.mentorship_plans;
DROP POLICY IF EXISTS "Mentees can view assigned plans" ON public.mentorship_plans;

CREATE POLICY "Users can view their own plans" ON public.mentorship_plans
  FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can create their own plans" ON public.mentorship_plans
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can update their own plans" ON public.mentorship_plans
  FOR UPDATE USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can delete their own plans" ON public.mentorship_plans
  FOR DELETE USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Mentees can view assigned plans" ON public.mentorship_plans
  FOR SELECT TO authenticated
  USING (public.mentee_has_access((auth.jwt() ->> 'sub'), id));

-- 6. Recriar policies de user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);

-- 7. Recriar policies de mentee_plan_access
DROP POLICY IF EXISTS "Mentees can view their own access" ON public.mentee_plan_access;
DROP POLICY IF EXISTS "Plan owners can view mentee access" ON public.mentee_plan_access;
DROP POLICY IF EXISTS "Plan owners can manage mentee access" ON public.mentee_plan_access;

CREATE POLICY "Mentees can view their own access" ON public.mentee_plan_access
  FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Plan owners can view mentee access" ON public.mentee_plan_access
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.mentorship_plans
    WHERE id = mentee_plan_access.plan_id AND user_id = (auth.jwt() ->> 'sub')
  ));
CREATE POLICY "Plan owners can manage mentee access" ON public.mentee_plan_access
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.mentorship_plans WHERE id = mentee_plan_access.plan_id AND user_id = (auth.jwt() ->> 'sub')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mentorship_plans WHERE id = mentee_plan_access.plan_id AND user_id = (auth.jwt() ->> 'sub')));

-- 8. Atualizar policies das tabelas filhas (mentee_has_access usa TEXT agora)
DROP POLICY IF EXISTS "Mentees can view companies" ON public.companies;
DROP POLICY IF EXISTS "Mentees can update companies" ON public.companies;
DROP POLICY IF EXISTS "Mentees can insert companies" ON public.companies;
CREATE POLICY "Mentees can view companies" ON public.companies
  FOR SELECT TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));
CREATE POLICY "Mentees can update companies" ON public.companies
  FOR UPDATE TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));
CREATE POLICY "Mentees can insert companies" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));

DROP POLICY IF EXISTS "Mentees can view contacts" ON public.contact_mappings;
DROP POLICY IF EXISTS "Mentees can insert contacts" ON public.contact_mappings;
DROP POLICY IF EXISTS "Mentees can update contacts" ON public.contact_mappings;
CREATE POLICY "Mentees can view contacts" ON public.contact_mappings
  FOR SELECT TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));
CREATE POLICY "Mentees can insert contacts" ON public.contact_mappings
  FOR INSERT TO authenticated WITH CHECK (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));
CREATE POLICY "Mentees can update contacts" ON public.contact_mappings
  FOR UPDATE TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));

DROP POLICY IF EXISTS "Mentees can view schedule" ON public.schedule_activities;
DROP POLICY IF EXISTS "Mentees can update schedule" ON public.schedule_activities;
CREATE POLICY "Mentees can view schedule" ON public.schedule_activities
  FOR SELECT TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));
CREATE POLICY "Mentees can update schedule" ON public.schedule_activities
  FOR UPDATE TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));

DROP POLICY IF EXISTS "Mentees can view templates" ON public.message_templates;
CREATE POLICY "Mentees can view templates" ON public.message_templates
  FOR SELECT TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));

DROP POLICY IF EXISTS "Mentees can view job titles" ON public.job_title_variations;
CREATE POLICY "Mentees can view job titles" ON public.job_title_variations
  FOR SELECT TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));

DROP POLICY IF EXISTS "Mentees can view documents" ON public.cv_documents;
CREATE POLICY "Mentees can view documents" ON public.cv_documents
  FOR SELECT TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));

DROP POLICY IF EXISTS "Mentees can view completions" ON public.content_prompt_completions;
DROP POLICY IF EXISTS "Mentees can insert completions" ON public.content_prompt_completions;
DROP POLICY IF EXISTS "Mentees can delete completions" ON public.content_prompt_completions;
CREATE POLICY "Mentees can view completions" ON public.content_prompt_completions
  FOR SELECT TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));
CREATE POLICY "Mentees can insert completions" ON public.content_prompt_completions
  FOR INSERT TO authenticated WITH CHECK (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));
CREATE POLICY "Mentees can delete completions" ON public.content_prompt_completions
  FOR DELETE TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));

DROP POLICY IF EXISTS "Mentees can view market_jobs" ON public.market_jobs;
DROP POLICY IF EXISTS "Mentees can insert market_jobs" ON public.market_jobs;
DROP POLICY IF EXISTS "Mentees can update market_jobs" ON public.market_jobs;
CREATE POLICY "Mentees can view market_jobs" ON public.market_jobs
  FOR SELECT TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));
CREATE POLICY "Mentees can insert market_jobs" ON public.market_jobs
  FOR INSERT TO authenticated WITH CHECK (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));
CREATE POLICY "Mentees can update market_jobs" ON public.market_jobs
  FOR UPDATE TO authenticated USING (public.mentee_has_access((auth.jwt() ->> 'sub'), plan_id));
