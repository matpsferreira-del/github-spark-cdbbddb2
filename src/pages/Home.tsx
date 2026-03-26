import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Copy, Trash2, Eye, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MentorshipPlan } from "@/types/mentorship";

export default function Home() {
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [loading, isAuthenticated, navigate]);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorship_plans")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MentorshipPlan[];
    },
    enabled: isAuthenticated && !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mentorship_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano deletado com sucesso!");
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: () => toast.error("Erro ao deletar plano"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (plan: MentorshipPlan) => {
      const { id, created_at, updated_at, ...rest } = plan;
      const { error } = await supabase.from("mentorship_plans").insert({
        ...rest,
        mentee_name: rest.mentee_name + " (cópia)",
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano duplicado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: () => toast.error("Erro ao duplicar plano"),
  });

  if (loading) {
    return (
      <div className="min-h-screen gradient-dark-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen gradient-dark-bg p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Bem-vindo, {user?.user_metadata?.name || user?.email?.split("@")[0]}!
            </h1>
            <p className="text-muted-foreground">Gerencie seus planos estratégicos de mentoria</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Create Button */}
        <div className="mb-8">
          <Button onClick={() => navigate("/create")} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano Estratégico
          </Button>
        </div>

        {/* Plans List */}
        {plansLoading ? (
          <div className="text-muted-foreground text-center py-12">Carregando planos...</div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-foreground text-lg font-semibold mb-2">Nenhum plano criado ainda</h3>
              <p className="text-muted-foreground mb-6">Comece criando um novo plano estratégico para seu mentorado</p>
              <Button onClick={() => navigate("/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover:border-primary/30 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {plan.mentee_name}
                        <Badge
                          variant={plan.status === "completed" ? "default" : "secondary"}
                          className={
                            plan.status === "completed"
                              ? "bg-green-600"
                              : plan.status === "archived"
                              ? "bg-muted"
                              : ""
                          }
                        >
                          {plan.status === "completed" ? "Concluído" : plan.status === "archived" ? "Arquivado" : "Rascunho"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {plan.current_position} • {plan.current_area} • {plan.city}, {plan.state}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Metas LinkedIn</p>
                      <p className="text-foreground font-semibold">
                        {plan.linkedin_goals?.connectionsPerDay || 0} conexões/dia
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Posts</p>
                      <p className="text-foreground font-semibold">
                        {plan.linkedin_goals?.postsPerWeek || 0}/semana
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Criado</p>
                      <p className="text-foreground font-semibold">
                        {formatDistanceToNow(new Date(plan.created_at), { locale: ptBR, addSuffix: true })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Mudança Carreira</p>
                      <p className="text-foreground font-semibold">
                        {plan.wants_career_change ? "Sim" : "Não"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => navigate(`/plan/${plan.id}`)} variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button
                      onClick={() => duplicateMutation.mutate(plan)}
                      disabled={duplicateMutation.isPending}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Duplicar
                    </Button>
                    <Button
                      onClick={() => setDeletingId(plan.id)}
                      variant="outline"
                      size="sm"
                      className="border-destructive text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Deletar
                    </Button>
                  </div>

                  {deletingId === plan.id && (
                    <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <p className="text-destructive mb-3">Tem certeza que deseja deletar este plano?</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => deleteMutation.mutate(plan.id)}
                          disabled={deleteMutation.isPending}
                          size="sm"
                          variant="destructive"
                        >
                          Confirmar
                        </Button>
                        <Button onClick={() => setDeletingId(null)} size="sm" variant="outline">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
