import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.32.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

// ─── Tool schemas (shared, cached) ────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "generate_companies",
    description: "Gera empresas organizadas por tier para o mapeamento de recolocação",
    input_schema: {
      type: "object",
      properties: {
        companies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              segment: { type: "string" },
              tier: { type: "string", enum: ["A", "B", "C"] },
              has_openings: { type: "boolean" },
              relevance_score: { type: "integer", minimum: 0, maximum: 100 },
              notes: { type: "string" },
            },
            required: ["name", "segment", "tier", "has_openings", "relevance_score"],
          },
        },
      },
      required: ["companies"],
    },
  },
  {
    name: "generate_job_titles",
    description: "Gera variações de cargo em 3 categorias para busca e networking",
    input_schema: {
      type: "object",
      properties: {
        titles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              type: { type: "string", enum: ["search_variation", "decision_maker", "hr_recruiter"] },
            },
            required: ["title", "type"],
          },
        },
      },
      required: ["titles"],
    },
  },
  {
    name: "generate_messages",
    description: "Gera 6 templates de mensagem para LinkedIn",
    input_schema: {
      type: "object",
      properties: {
        templates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["hr_with_opening", "hr_without_opening", "dm_with_opening", "dm_without_opening", "follow_up", "post_interview"] },
              template: { type: "string" },
            },
            required: ["type", "template"],
          },
        },
      },
      required: ["templates"],
    },
  },
  {
    name: "generate_schedule",
    description: "Gera cronograma de 4 semanas com atividades diárias",
    input_schema: {
      type: "object",
      properties: {
        activities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              week_number: { type: "integer", minimum: 1, maximum: 4 },
              day_of_week: { type: "string", enum: ["monday", "tuesday", "wednesday", "thursday", "friday"] },
              activity: { type: "string" },
              category: { type: "string", enum: ["linkedin", "networking", "content", "research", "applications"] },
            },
            required: ["week_number", "day_of_week", "activity", "category"],
          },
        },
      },
      required: ["activities"],
    },
  },
  {
    name: "generate_diagnosis",
    description: "Gera análise SWOT, passos diários, metas mensais e dicas de LinkedIn",
    input_schema: {
      type: "object",
      properties: {
        swot: {
          type: "object",
          properties: {
            summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            threats: { type: "array", items: { type: "string" } },
          },
          required: ["summary", "strengths", "weaknesses", "opportunities", "threats"],
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              step: { type: "integer" },
              title: { type: "string" },
              description: { type: "string" },
              tip: { type: "string" },
              time: { type: "string" },
            },
            required: ["step", "title", "description", "tip", "time"],
          },
        },
        month_goals: {
          type: "object",
          properties: {
            month1: { type: "array", items: { type: "string" } },
            month2: { type: "array", items: { type: "string" } },
            month3: { type: "array", items: { type: "string" } },
          },
          required: ["month1", "month2", "month3"],
        },
        linkedin_tips: { type: "array", items: { type: "string" } },
      },
      required: ["swot", "steps", "month_goals", "linkedin_tips"],
    },
  },
  {
    name: "generate_content_prompts",
    description: "Gera prompts prontos para criação de posts no LinkedIn",
    input_schema: {
      type: "object",
      properties: {
        prompts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              prompt: { type: "string" },
            },
            required: ["title", "prompt"],
          },
        },
      },
      required: ["prompts"],
    },
  },
  {
    name: "generate_linkedin_profile",
    description: "Gera seções otimizadas do perfil LinkedIn",
    input_schema: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string", enum: ["headline", "about", "experience", "skills"] },
              title: { type: "string" },
              ideal_text: { type: "string" },
              explanation: { type: "string" },
            },
            required: ["key", "title", "ideal_text", "explanation"],
          },
        },
      },
      required: ["sections"],
    },
  },
];

// ─── Shared system prompt (cached) ────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um consultor sênior de recolocação profissional no Brasil, com profundo conhecimento do mercado de trabalho brasileiro, LinkedIn, networking e estratégias de busca ativa de emprego.

Suas especialidades:
- Mapeamento de empresas por relevância e cultura
- Otimização de perfil LinkedIn para ATS e recrutadores
- Estratégias de networking B2B e com RH
- Elaboração de mensagens personalizadas e eficazes
- Planejamento de cronogramas de recolocação realistas
- Diagnóstico de perfil com análise SWOT detalhada
- Criação de conteúdo profissional para LinkedIn

Diretrizes:
- Use apenas empresas REAIS e relevantes ao contexto brasileiro
- Seja específico e prático, não genérico
- Considere sempre a localização, área e momento de mercado
- Adapte linguagem e estratégia para o perfil (empregado vs desempregado, transição de carreira ou não)
- Priorize qualidade e personalização sobre quantidade`;

// ─── Helper: call Claude with tool use ────────────────────────────────────────

async function callClaude<T>(
  toolName: string,
  userMessage: string,
  maxTokens = 4096,
): Promise<T> {
  const tool = TOOLS.find((t) => t.name === toolName);
  if (!tool) throw new Error(`Tool ${toolName} not found`);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: TOOLS.map((t) =>
      t.name === toolName ? t : { ...t, cache_control: { type: "ephemeral" } }
    ),
    tool_choice: { type: "tool", name: toolName },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = response.content.find((b: { type: string }) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block");
  }
  return toolUse.input as T;
}

// ─── Generators ───────────────────────────────────────────────────────────────

function profileContext(plan: Record<string, unknown>): string {
  const situation = plan.current_situation === "employed" ? "Empregado" : "Desempregado";
  const transition = plan.wants_career_change
    ? ` | Transição para: ${(plan.target_positions as { title?: string }[] ?? []).map((p) => p.title).join(", ")}`
    : "";
  return `Nome: ${plan.mentee_name} | Cargo atual: ${plan.current_position} | Área: ${plan.current_area} | Localização: ${plan.city}, ${plan.state} | Modelo de trabalho: ${plan.work_model} | Situação: ${situation}${transition}`;
}

async function generateCompanies(plan: Record<string, unknown>) {
  const result = await callClaude<{ companies: unknown[] }>(
    "generate_companies",
    `Gere exatamente 45 empresas (15 por tier) para este perfil de recolocação:

${profileContext(plan)}

Critérios por tier:
- Tier A (15): Grandes corporações, multinacionais e empresas dos sonhos — alta competitividade, alta remuneração, marca empregadora forte
- Tier B (15): Empresas médias consolidadas, scale-ups e regionais sólidas — bom equilíbrio entre competitividade e acesso
- Tier C (15): Startups em crescimento, nichos estratégicos e empresas menores com cultura diferenciada — maior facilidade de acesso

Para cada empresa: inclua segmento real, score de relevância (0-100) considerando aderência ao perfil, e uma nota estratégica sobre por que esta empresa é relevante.`,
    4096,
  );
  return result.companies;
}

async function generateJobTitles(plan: Record<string, unknown>) {
  const result = await callClaude<{ titles: unknown[] }>(
    "generate_job_titles",
    `Gere variações de cargo para este perfil:

${profileContext(plan)}

Quantidades e formatos:
- search_variation (20): nomenclaturas para pesquisar em LinkedIn Jobs, Indeed, Gupy (português E inglês). Ex: "Gerente de Projetos", "Project Manager", "GPM", "Head de PMO"
- decision_maker (15): cargos de tomadores de decisão que contratam para esta área. Formato: "Título|||Por que conectar e o que pedir nessa conexão"
- hr_recruiter (12): cargos de RH e recrutadores especializados nesta área. Formato: "Título|||Como abordar e o que destacar para este perfil de RH"`,
  );
  return result.titles;
}

async function generateMessages(plan: Record<string, unknown>) {
  const result = await callClaude<{ templates: unknown[] }>(
    "generate_messages",
    `Crie 6 templates de mensagem LinkedIn ultra-personalizados para:

${profileContext(plan)}

Tipos obrigatórios:
1. hr_with_opening — Para RH quando há vaga aberta (mencionar vaga específica)
2. hr_without_opening — Para RH sem vaga aberta (networking proativo)
3. dm_with_opening — Para decisor da área com vaga (conexão + interesse direto)
4. dm_without_opening — Para decisor sem vaga (networking estratégico de longo prazo)
5. follow_up — Follow-up após 7 dias sem resposta (breve, não insistente)
6. post_interview — Agradecimento pós-entrevista (reforça fit cultural)

Placeholders obrigatórios: [Nome], [Empresa], [Vaga], [Resultado/Conquista]
Limite: máximo 300 caracteres por mensagem (padrão LinkedIn)
Tom: profissional mas humano, direto ao ponto, sem floreios`,
  );
  return result.templates;
}

async function generateSchedule(plan: Record<string, unknown>) {
  const goals = (plan.linkedin_goals as Record<string, unknown>) ?? {};
  const result = await callClaude<{ activities: unknown[] }>(
    "generate_schedule",
    `Crie um cronograma detalhado de 4 semanas (seg a sex, 3 atividades/dia = 60 total) para:

${profileContext(plan)}

Metas de LinkedIn: ${goals.connectionsPerDay ?? 50} conexões/dia, ${goals.postsPerWeek ?? 1} posts/semana

Progressão obrigatória:
- Semana 1: Fundação — otimizar perfil LinkedIn, preparar materiais, definir lista inicial de empresas e contatos
- Semana 2: Aceleração — início ativo de conexões e candidaturas, primeiros contatos com RH
- Semana 3: Consolidação — follow-ups, entrevistas, criação de conteúdo, networking em eventos
- Semana 4: Refinamento — avaliar funil, ajustar abordagem, intensificar onde há tração

Inclua tempo estimado entre parênteses. Ex: "Enviar 10 conexões personalizadas para Tier A (30min)"`,
    6000,
  );
  return result.activities;
}

async function generateDiagnosis(plan: Record<string, unknown>) {
  return await callClaude<{ swot: unknown; steps: unknown[]; month_goals: unknown; linkedin_tips: unknown[] }>(
    "generate_diagnosis",
    `Elabore um diagnóstico profissional completo para:

${profileContext(plan)}

Entregáveis:
1. SWOT detalhado: summary (2-3 frases), 4 forças (resultados concretos), 4 fraquezas (acionáveis), 5 oportunidades (mercado atual), 4 ameaças (riscos reais)
2. 7 passos de rotina diária no LinkedIn (com título, descrição prática, dica de execução e tempo estimado)
3. Metas para 3 meses (5-6 itens por mês, progressivos e mensuráveis)
4. 5 dicas de otimização do perfil LinkedIn (específicas para ATS e recrutadores da área)`,
    4096,
  );
}

async function generateContentPrompts(plan: Record<string, unknown>) {
  const result = await callClaude<{ prompts: unknown[] }>(
    "generate_content_prompts",
    `Crie 8 prompts COMPLETOS e prontos para gerar posts no LinkedIn para:

${profileContext(plan)}

Cada prompt deve:
- Ter título curto e descritivo
- Conter instrução clara: "Crie uma publicação para LinkedIn com 200-300 palavras sobre [tema]..."
- Especificar: tom de voz, estrutura (gancho + desenvolvimento + CTA), 3-5 hashtags relevantes
- Ser personalizado ao perfil e área de atuação

Temas que devem ser cobertos: liderança e gestão, resultado mensurável de carreira, tendência da área, aprendizado com desafio, dica técnica prática, storytelling profissional, reflexão de mercado, networking e colaboração`,
    4096,
  );
  return result.prompts;
}

async function generateLinkedInProfile(plan: Record<string, unknown>, cvTexts: string[]) {
  const cvContext = cvTexts.length > 0
    ? `\n\nDocumentos do candidato (CV/LinkedIn PDF):\n${cvTexts.join("\n---\n")}`
    : "";

  const result = await callClaude<{ sections: unknown[] }>(
    "generate_linkedin_profile",
    `Otimize o perfil LinkedIn completo para:

${profileContext(plan)}${cvContext}

Seções obrigatórias:
1. headline: Título LinkedIn otimizado para ATS (máx 220 caracteres). Inclua: cargo + área + diferencial ou impacto
2. about: Seção "Sobre" completa (400-500 palavras). Estrutura: hook forte → trajetória → competências-chave → conquistas com números → como pode agregar → CTA para contato
3. experience: Modelo de como descrever experiências (bullet points com CAR: Contexto, Ação, Resultado). Gere o modelo para o cargo atual
4. skills: Lista de 20 competências recomendadas, ordenadas por relevância para ATS. Separe em: técnicas, comportamentais e ferramentas`,
    4096,
  );
  return result.sections;
}

// ─── JWT helper (Supabase already verified signature via verify_jwt=true) ─────

function extractSubFromJwt(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

// ─── HTTP Handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey || !Deno.env.get("ANTHROPIC_API_KEY")) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract Clerk user ID from JWT sub claim
    // verify_jwt=true in config means Supabase already verified the signature
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const userId = extractSubFromJwt(token);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan_id, type } = await req.json();
    if (!plan_id) {
      return new Response(JSON.stringify({ error: "plan_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: plan, error: planError } = await supabase
      .from("mentorship_plans").select("*").eq("id", plan_id).eq("user_id", userId).single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: Record<string, unknown>;

    switch (type) {
      case "companies": {
        const companies = (await generateCompanies(plan)).map((c) => ({ ...(c as Record<string, unknown>), plan_id, kanban_stage: "identified" }));
        const { error } = await supabase.from("companies").insert(companies);
        if (error) throw error;
        result = { generated: companies.length };
        break;
      }

      case "job_titles": {
        const titles = (await generateJobTitles(plan)).map((t) => ({ ...(t as Record<string, unknown>), plan_id, is_ai_generated: true }));
        const { error } = await supabase.from("job_title_variations").insert(titles);
        if (error) throw error;
        result = { generated: titles.length };
        break;
      }

      case "messages": {
        const templates = (await generateMessages(plan)).map((t) => ({ ...(t as Record<string, unknown>), plan_id, is_ai_generated: true }));
        const { error } = await supabase.from("message_templates").insert(templates);
        if (error) throw error;
        result = { generated: templates.length };
        break;
      }

      case "schedule": {
        const activities = (await generateSchedule(plan)).map((a) => ({ ...(a as Record<string, unknown>), plan_id, is_completed: false }));
        const { error } = await supabase.from("schedule_activities").insert(activities);
        if (error) throw error;
        result = { generated: activities.length };
        break;
      }

      case "all": {
        await Promise.all([
          supabase.from("companies").delete().eq("plan_id", plan_id),
          supabase.from("job_title_variations").delete().eq("plan_id", plan_id),
          supabase.from("message_templates").delete().eq("plan_id", plan_id),
          supabase.from("schedule_activities").delete().eq("plan_id", plan_id),
        ]);

        const { data: cvDocs } = await supabase
          .from("cv_documents").select("extracted_text").eq("plan_id", plan_id).not("extracted_text", "is", null);
        const cvTexts = (cvDocs ?? []).map((d: { extracted_text: string }) => d.extracted_text).filter(Boolean);

        const [companies, titles, templates, activities, diagnosis, contentPrompts, linkedinSections] =
          await Promise.all([
            generateCompanies(plan),
            generateJobTitles(plan),
            generateMessages(plan),
            generateSchedule(plan),
            generateDiagnosis(plan),
            generateContentPrompts(plan),
            generateLinkedInProfile(plan, cvTexts),
          ]);

        type Row = Record<string, unknown>;
        const [c, t, m, s] = await Promise.all([
          supabase.from("companies").insert(companies.map((co) => ({ ...(co as Row), plan_id, kanban_stage: "identified" }))),
          supabase.from("job_title_variations").insert(titles.map((ti) => ({ ...(ti as Row), plan_id, is_ai_generated: true }))),
          supabase.from("message_templates").insert(templates.map((te) => ({ ...(te as Row), plan_id, is_ai_generated: true }))),
          supabase.from("schedule_activities").insert(activities.map((ac) => ({ ...(ac as Row), plan_id, is_completed: false }))),
        ]);
        if (c.error) throw c.error;
        if (t.error) throw t.error;
        if (m.error) throw m.error;
        if (s.error) throw s.error;

        await supabase.from("mentorship_plans").update({
          general_notes: JSON.stringify({
            swot: diagnosis.swot,
            steps: diagnosis.steps,
            month_goals: diagnosis.month_goals,
            linkedin_tips: diagnosis.linkedin_tips,
            content_prompts: contentPrompts,
            linkedin_profile: { sections: linkedinSections },
          }),
          status: "completed",
        }).eq("id", plan_id);

        result = {
          companies: companies.length,
          job_titles: titles.length,
          messages: templates.length,
          schedule: activities.length,
          diagnosis: true,
          content_prompts: (contentPrompts as unknown[]).length,
          linkedin_profile: true,
        };
        break;
      }

      case "content_only": {
        const { data: cvDocsContent } = await supabase
          .from("cv_documents").select("extracted_text").eq("plan_id", plan_id).not("extracted_text", "is", null);
        const cvTexts = (cvDocsContent ?? []).map((d: { extracted_text: string }) => d.extracted_text).filter(Boolean);

        const [contentPrompts, linkedinSections] = await Promise.all([
          generateContentPrompts(plan),
          generateLinkedInProfile(plan, cvTexts),
        ]);

        let existingData: Record<string, unknown> = {};
        if (plan.general_notes) {
          try { existingData = JSON.parse(plan.general_notes); } catch { /* ignore */ }
        }

        await supabase.from("mentorship_plans").update({
          general_notes: JSON.stringify({
            ...existingData,
            content_prompts: contentPrompts,
            linkedin_profile: { sections: linkedinSections },
          }),
        }).eq("id", plan_id);

        result = {
          content_prompts: (contentPrompts as unknown[]).length,
          linkedin_profile: true,
        };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid type" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-plan error:", e);
    const msg = e instanceof Error ? e.message : "Internal error";
    const status = msg.includes("overloaded") || msg.includes("529") ? 529 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
