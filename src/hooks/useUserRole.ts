import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useUserRole() {
  const { user, isAuthenticated } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .single();
      if (error) return "admin"; // Default to admin if no role found (existing users)
      return data.role as "admin" | "mentee";
    },
    enabled: isAuthenticated && !!user,
  });

  return {
    role: role ?? "admin",
    isAdmin: role === "admin" || !role,
    isMentee: role === "mentee",
    isLoading,
  };
}
