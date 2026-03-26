
-- Allow mentee (public/anon) to UPDATE companies via active token (for kanban drag, has_openings, etc.)
CREATE POLICY "Public can update companies via access token"
ON public.companies FOR UPDATE
TO public
USING (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = companies.plan_id
    AND plan_access_tokens.is_active = true
));

-- Allow mentee to UPDATE schedule_activities via active token (for checkbox)
CREATE POLICY "Public can update schedule via access token"
ON public.schedule_activities FOR UPDATE
TO public
USING (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = schedule_activities.plan_id
    AND plan_access_tokens.is_active = true
));

-- Allow mentee to view schedule_activities via token
CREATE POLICY "Public can view schedule via access token"
ON public.schedule_activities FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = schedule_activities.plan_id
    AND plan_access_tokens.is_active = true
));

-- Allow mentee to view message_templates via token
CREATE POLICY "Public can view templates via access token"
ON public.message_templates FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = message_templates.plan_id
    AND plan_access_tokens.is_active = true
));

-- Allow mentee to view job_title_variations via token
CREATE POLICY "Public can view job titles via access token"
ON public.job_title_variations FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = job_title_variations.plan_id
    AND plan_access_tokens.is_active = true
));

-- Allow mentee to view contact_mappings via token
CREATE POLICY "Public can view contacts via access token"
ON public.contact_mappings FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = contact_mappings.plan_id
    AND plan_access_tokens.is_active = true
));

-- Allow mentee to INSERT contacts via token
CREATE POLICY "Public can insert contacts via access token"
ON public.contact_mappings FOR INSERT
TO public
WITH CHECK (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = contact_mappings.plan_id
    AND plan_access_tokens.is_active = true
));

-- Allow mentee to UPDATE contacts via token
CREATE POLICY "Public can update contacts via access token"
ON public.contact_mappings FOR UPDATE
TO public
USING (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = contact_mappings.plan_id
    AND plan_access_tokens.is_active = true
));

-- Allow mentee to view mentorship_plans via token
CREATE POLICY "Public can view plan via access token"
ON public.mentorship_plans FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = mentorship_plans.id
    AND plan_access_tokens.is_active = true
));

-- Allow mentee to view cv_documents via token
CREATE POLICY "Public can view cv documents via access token"
ON public.cv_documents FOR SELECT
TO public
USING (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = cv_documents.plan_id
    AND plan_access_tokens.is_active = true
));

-- Allow mentee to INSERT companies via token (for adding openings info)
CREATE POLICY "Public can insert companies via access token"
ON public.companies FOR INSERT
TO public
WITH CHECK (EXISTS (
  SELECT 1 FROM plan_access_tokens
  WHERE plan_access_tokens.plan_id = companies.plan_id
    AND plan_access_tokens.is_active = true
));
