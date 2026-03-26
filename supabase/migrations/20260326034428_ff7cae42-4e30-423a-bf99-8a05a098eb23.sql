ALTER TABLE public.job_title_variations
DROP CONSTRAINT IF EXISTS job_title_variations_type_check;

ALTER TABLE public.job_title_variations
ADD CONSTRAINT job_title_variations_type_check
CHECK (
  type IN (
    'current_variation',
    'target_position',
    'search_variation',
    'decision_maker',
    'hr_recruiter'
  )
);