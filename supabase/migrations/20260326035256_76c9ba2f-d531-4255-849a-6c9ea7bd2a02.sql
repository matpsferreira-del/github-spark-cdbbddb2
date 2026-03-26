ALTER TABLE public.message_templates
DROP CONSTRAINT IF EXISTS message_templates_type_check;

ALTER TABLE public.message_templates
ADD CONSTRAINT message_templates_type_check
CHECK (
  type IN (
    'hr',
    'decision_maker',
    'hr_with_opening',
    'hr_without_opening',
    'dm_with_opening',
    'dm_without_opening',
    'follow_up',
    'post_interview'
  )
);