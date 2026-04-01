
CREATE TABLE public.content_prompt_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  prompt_index integer NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(plan_id, prompt_index)
);

ALTER TABLE public.content_prompt_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view completions of their plans"
ON public.content_prompt_completions FOR SELECT TO public
USING (public.user_owns_plan(plan_id));

CREATE POLICY "Users can insert completions"
ON public.content_prompt_completions FOR INSERT TO public
WITH CHECK (public.user_owns_plan(plan_id));

CREATE POLICY "Users can delete completions"
ON public.content_prompt_completions FOR DELETE TO public
USING (public.user_owns_plan(plan_id));

CREATE POLICY "Public can view completions via access token"
ON public.content_prompt_completions FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM plan_access_tokens WHERE plan_access_tokens.plan_id = content_prompt_completions.plan_id AND plan_access_tokens.is_active = true));

CREATE POLICY "Public can insert completions via access token"
ON public.content_prompt_completions FOR INSERT TO public
WITH CHECK (EXISTS (SELECT 1 FROM plan_access_tokens WHERE plan_access_tokens.plan_id = content_prompt_completions.plan_id AND plan_access_tokens.is_active = true));

CREATE POLICY "Public can delete completions via access token"
ON public.content_prompt_completions FOR DELETE TO public
USING (EXISTS (SELECT 1 FROM plan_access_tokens WHERE plan_access_tokens.plan_id = content_prompt_completions.plan_id AND plan_access_tokens.is_active = true));
