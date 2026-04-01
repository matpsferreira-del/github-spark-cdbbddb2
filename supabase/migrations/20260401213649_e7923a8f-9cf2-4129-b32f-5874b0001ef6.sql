
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'mentee');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'admin',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage roles" ON public.user_roles
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Create mentee_plan_access table
CREATE TABLE public.mentee_plan_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.mentorship_plans(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_id)
);
ALTER TABLE public.mentee_plan_access ENABLE ROW LEVEL SECURITY;

-- 6. RLS for mentee_plan_access
CREATE POLICY "Mentees can view their own access" ON public.mentee_plan_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Plan owners can view mentee access" ON public.mentee_plan_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mentorship_plans
      WHERE id = mentee_plan_access.plan_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Plan owners can manage mentee access" ON public.mentee_plan_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mentorship_plans
      WHERE id = mentee_plan_access.plan_id AND user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mentorship_plans
      WHERE id = mentee_plan_access.plan_id AND user_id = auth.uid()
    )
  );

-- 7. Security definer function to check mentee access
CREATE OR REPLACE FUNCTION public.mentee_has_access(_user_id uuid, _plan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mentee_plan_access
    WHERE user_id = _user_id AND plan_id = _plan_id
  )
$$;

-- 8. Add mentee access RLS policies to all plan-related tables

-- mentorship_plans: mentee can SELECT their assigned plans
CREATE POLICY "Mentees can view assigned plans" ON public.mentorship_plans
  FOR SELECT TO authenticated
  USING (public.mentee_has_access(auth.uid(), id));

-- companies: mentee can SELECT and UPDATE
CREATE POLICY "Mentees can view companies" ON public.companies
  FOR SELECT TO authenticated
  USING (public.mentee_has_access(auth.uid(), plan_id));

CREATE POLICY "Mentees can update companies" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.mentee_has_access(auth.uid(), plan_id));

CREATE POLICY "Mentees can insert companies" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.mentee_has_access(auth.uid(), plan_id));

-- contact_mappings: mentee can CRUD
CREATE POLICY "Mentees can view contacts" ON public.contact_mappings
  FOR SELECT TO authenticated
  USING (public.mentee_has_access(auth.uid(), plan_id));

CREATE POLICY "Mentees can insert contacts" ON public.contact_mappings
  FOR INSERT TO authenticated
  WITH CHECK (public.mentee_has_access(auth.uid(), plan_id));

CREATE POLICY "Mentees can update contacts" ON public.contact_mappings
  FOR UPDATE TO authenticated
  USING (public.mentee_has_access(auth.uid(), plan_id));

-- schedule_activities: mentee can SELECT and UPDATE
CREATE POLICY "Mentees can view schedule" ON public.schedule_activities
  FOR SELECT TO authenticated
  USING (public.mentee_has_access(auth.uid(), plan_id));

CREATE POLICY "Mentees can update schedule" ON public.schedule_activities
  FOR UPDATE TO authenticated
  USING (public.mentee_has_access(auth.uid(), plan_id));

-- message_templates: mentee can SELECT
CREATE POLICY "Mentees can view templates" ON public.message_templates
  FOR SELECT TO authenticated
  USING (public.mentee_has_access(auth.uid(), plan_id));

-- job_title_variations: mentee can SELECT
CREATE POLICY "Mentees can view job titles" ON public.job_title_variations
  FOR SELECT TO authenticated
  USING (public.mentee_has_access(auth.uid(), plan_id));

-- cv_documents: mentee can SELECT
CREATE POLICY "Mentees can view documents" ON public.cv_documents
  FOR SELECT TO authenticated
  USING (public.mentee_has_access(auth.uid(), plan_id));

-- content_prompt_completions: mentee can SELECT, INSERT, DELETE
CREATE POLICY "Mentees can view completions" ON public.content_prompt_completions
  FOR SELECT TO authenticated
  USING (public.mentee_has_access(auth.uid(), plan_id));

CREATE POLICY "Mentees can insert completions" ON public.content_prompt_completions
  FOR INSERT TO authenticated
  WITH CHECK (public.mentee_has_access(auth.uid(), plan_id));

CREATE POLICY "Mentees can delete completions" ON public.content_prompt_completions
  FOR DELETE TO authenticated
  USING (public.mentee_has_access(auth.uid(), plan_id));

-- 9. Add mentee_email column to mentorship_plans
ALTER TABLE public.mentorship_plans ADD COLUMN mentee_email character varying NULL;

-- 10. Create trigger to auto-assign admin role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Default to admin role; mentee role is assigned explicitly by mentors
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
