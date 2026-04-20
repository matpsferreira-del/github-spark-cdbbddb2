ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS source text DEFAULT 'orion';
ALTER TABLE public.contact_mappings ADD COLUMN IF NOT EXISTS source text DEFAULT 'orion';
ALTER TABLE public.mentorship_plans ADD COLUMN IF NOT EXISTS orionpipe_client_id text;