-- 1. Remove duplicate admin role for users that are also mentees
DELETE FROM public.user_roles ur
WHERE ur.role = 'admin'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = ur.user_id AND ur2.role = 'mentee'
  );

-- 2. Update trigger so new users only get default admin role if they don't already have any role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only assign default admin role if user has no role yet
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;