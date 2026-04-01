import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, ArrowLeft, Linkedin, FileText, ClipboardList, Upload, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { brazilStates, getCitiesByState } from "@/data/brazilCities";

const docTypes = [
  { type: "linkedin_pdf", label: "LinkedIn PDF", icon: Linkedin, iconColor: "text-primary", description: "Exporte seu perfil LinkedIn em PDF: Perfil → Mais → Salvar como PDF." },
  { type: "personal_cv", label: "CV Pessoal", icon: FileText, iconColor: "text-green-500", description: "Anexe o currículo pessoal atual do mentorado (PDF ou TXT)." },
  { type: "questionnaire", label: "Questionário", icon: ClipboardList, iconColor: "text-amber-500", description: "Questionário respondido pelo mentorado (opcional)." },
] as const;

export default function CreatePlan() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [menteeName, setMenteeName] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [currentArea, setCurrentArea] = useState("");
  const [currentSituation, setCurrentSituation] = useState<"employed" | "unemployed">("employed");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [regionPreference, setRegionPreference] = useState<"same_region" | "open_to_change">("same_region");
  const [availableCities, setAvailableCities] = useState<Array<{ state: string; city: string }>>([]);
  const [workModel, setWorkModel] = useState<"presencial" | "hibrido" | "remoto">("hibrido");
  const [generalNotes, setGeneralNotes] = useState("");
  const [wantsCareerChange, setWantsCareerChange] = useState(false);
  const [targetPositions, setTargetPositions] = useState<string[]>([]);
  const [newTargetPosition, setNewTargetPosition] = useState("");
  const [connectionsPerDay, setConnectionsPerDay] = useState("50");
  const [postsPerWeek, setPostsPerWeek] = useState("1");
  const [targetCompanyCount, setTargetCompanyCount] = useState("45");

  // Available cities state
  const [addCityState, setAddCityState] = useState("");
  const [addCityCity, setAddCityCity] = useState("");

  // Document upload state
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleAddTargetPosition = () => {
    if (newTargetPosition.trim()) {
      setTargetPositions([...targetPositions, newTargetPosition.trim()]);
      setNewTargetPosition("");
    }
  };

  const handleAddAvailableCity = () => {
    if (addCityState && addCityCity) {
      if (!availableCities.some(c => c.state === addCityState && c.city === addCityCity)) {
        setAvailableCities([...availableCities, { state: addCityState, city: addCityCity }]);
      }
      setAddCityCity("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!menteeName.trim() || !currentPosition.trim() || !currentArea.trim() || !state || !city) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("mentorship_plans").insert({
        user_id: user!.id,
        mentee_name: menteeName,
        current_position: currentPosition,
        current_area: currentArea,
        current_situation: currentSituation,
        state,
        city,
        region_preference: regionPreference,
        available_cities: availableCities,
        work_model: workModel,
        wants_career_change: wantsCareerChange,
        target_positions: targetPositions,
        general_notes: generalNotes || null,
        linkedin_goals: {
          connectionsPerDay: parseInt(connectionsPerDay),
          postsPerWeek: parseInt(postsPerWeek),
          connectionTypes: ["area", "hr"],
        },
        target_company_count: parseInt(targetCompanyCount) || 45,
        status: "draft",
      });

      if (error) throw error;
      toast.success("Plano estratégico criado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar plano");
    } finally {
      setSubmitting(false);
    }
  };

  const citiesForState = state ? getCitiesByState(state) : [];
  const citiesForAddState = addCityState ? getCitiesByState(addCityState) : [];

  return (
    <div className="min-h-screen gradient-dark-bg p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Novo Plano Estratégico</h1>
          <p className="text-muted-foreground">Preencha as informações do mentorado para gerar um plano personalizado</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Informações Básicas</CardTitle>
              <CardDescription>Dados pessoais e profissionais do mentorado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome do Mentorado *</Label>
                <Input
                  value={menteeName}
                  onChange={(e) => setMenteeName(e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cargo Atual *</Label>
                  <Input
                    value={currentPosition}
                    onChange={(e) => setCurrentPosition(e.target.value)}
                    placeholder="Ex: Desenvolvedor Senior"
                  />
                </div>
                <div>
                  <Label>Área de Atuação *</Label>
                  <Input
                    value={currentArea}
                    onChange={(e) => setCurrentArea(e.target.value)}
                    placeholder="Ex: Tecnologia"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Situação Atual *</Label>
                  <Select value={currentSituation} onValueChange={(v: any) => setCurrentSituation(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Empregado</SelectItem>
                      <SelectItem value="unemployed">Desempregado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modelo de Trabalho *</Label>
                  <Select value={workModel} onValueChange={(v: any) => setWorkModel(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                      <SelectItem value="remoto">Remoto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Localização</CardTitle>
              <CardDescription>Onde o mentorado atua e deseja trabalhar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Estado *</Label>
                  <Select value={state} onValueChange={(v) => { setState(v); setCity(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {brazilStates.map((s) => (
                        <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cidade *</Label>
                  <Select value={city} onValueChange={setCity} disabled={!state}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {citiesForState.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Preferência de Região</Label>
                <Select value={regionPreference} onValueChange={(v: any) => setRegionPreference(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same_region">Mesma região</SelectItem>
                    <SelectItem value="open_to_change">Aberto a mudança</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cidades de Interesse</Label>
                <div className="flex gap-2 mb-2">
                  <Select value={addCityState} onValueChange={(v) => { setAddCityState(v); setAddCityCity(""); }}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                      {brazilStates.map((s) => (
                        <SelectItem key={s.code} value={s.code}>{s.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={addCityCity} onValueChange={setAddCityCity} disabled={!addCityState}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Cidade" /></SelectTrigger>
                    <SelectContent>
                      {citiesForAddState.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={handleAddAvailableCity}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableCities.map((c, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {c.city}, {c.state}
                      <button type="button" onClick={() => setAvailableCities(availableCities.filter((_, idx) => idx !== i))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mudança de Carreira */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Mudança de Carreira</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={wantsCareerChange} onCheckedChange={setWantsCareerChange} />
                <Label>Deseja mudar de carreira?</Label>
              </div>

              {wantsCareerChange && (
                <div>
                  <Label>Cargos Alvo</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTargetPosition}
                      onChange={(e) => setNewTargetPosition(e.target.value)}
                      placeholder="Ex: Product Manager"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTargetPosition())}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTargetPosition}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {targetPositions.map((pos, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {pos}
                        <button type="button" onClick={() => setTargetPositions(targetPositions.filter((_, idx) => idx !== i))}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metas LinkedIn */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Metas LinkedIn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Conexões por dia</Label>
                  <Input
                    type="number"
                    value={connectionsPerDay}
                    onChange={(e) => setConnectionsPerDay(e.target.value)}
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <Label>Posts por semana</Label>
                  <Input
                    type="number"
                    value={postsPerWeek}
                    onChange={(e) => setPostsPerWeek(e.target.value)}
                    min="0"
                    max="7"
                  />
                </div>
                <div>
                  <Label>Empresas-alvo (total)</Label>
                  <Input
                    type="number"
                    value={targetCompanyCount}
                    onChange={(e) => setTargetCompanyCount(e.target.value)}
                    min="10"
                    max="200"
                    placeholder="45"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Quantidade de empresas que a IA irá mapear</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Observações adicionais sobre o mentorado..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Plano Estratégico
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/")}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
