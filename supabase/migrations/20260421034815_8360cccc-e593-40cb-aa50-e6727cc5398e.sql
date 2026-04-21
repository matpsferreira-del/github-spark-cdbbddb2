-- Create market_jobs table for Orion integration
CREATE TABLE IF NOT EXISTS public.market_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.mentorship_plans(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company_name text NOT NULL,
  location text,
  job_url text,
  source text DEFAULT 'orion',
  status text NOT NULL DEFAULT 'identificada',
  notes text,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_jobs_plan_id_idx ON public.market_jobs(plan_id);
CREATE INDEX IF NOT EXISTS market_jobs_job_url_idx ON public.market_jobs(job_url);

ALTER TABLE public.market_jobs ENABLE ROW LEVEL SECURITY;

-- Plan owners (admins/mentors)
CREATE POLICY "Users can view market_jobs of their plans"
ON public.market_jobs FOR SELECT
USING (user_owns_plan(plan_id));

CREATE POLICY "Users can insert market_jobs to their plans"
ON public.market_jobs FOR INSERT
WITH CHECK (user_owns_plan(plan_id));

CREATE POLICY "Users can update market_jobs of their plans"
ON public.market_jobs FOR UPDATE
USING (user_owns_plan(plan_id));

CREATE POLICY "Users can delete market_jobs of their plans"
ON public.market_jobs FOR DELETE
USING (user_owns_plan(plan_id));

-- Mentees with assigned plan access
CREATE POLICY "Mentees can view market_jobs"
ON public.market_jobs FOR SELECT
TO authenticated
USING (mentee_has_access(auth.uid(), plan_id));

CREATE POLICY "Mentees can insert market_jobs"
ON public.market_jobs FOR INSERT
TO authenticated
WITH CHECK (mentee_has_access(auth.uid(), plan_id));

CREATE POLICY "Mentees can update market_jobs"
ON public.market_jobs FOR UPDATE
TO authenticated
USING (mentee_has_access(auth.uid(), plan_id));

-- Public access via plan_access_tokens
CREATE POLICY "Public can view market_jobs via access token"
ON public.market_jobs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = market_jobs.plan_id
    AND plan_access_tokens.is_active = true
));

CREATE POLICY "Public can insert market_jobs via access token"
ON public.market_jobs FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = market_jobs.plan_id
    AND plan_access_tokens.is_active = true
));

CREATE POLICY "Public can update market_jobs via access token"
ON public.market_jobs FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = market_jobs.plan_id
    AND plan_access_tokens.is_active = true
));

-- Trigger for updated_at (reuses existing helper)
CREATE TRIGGER market_jobs_set_updated_at
BEFORE UPDATE ON public.market_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();