import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

async function callAI(messages: Message[], tools?: any[], toolChoice?: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const body: any = { model: "google/gemini-3-flash-preview", messages };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("AI gateway error:", resp.status, text);
    if (resp.status === 429) throw new Error("RATE_LIMITED");
    if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(`AI gateway error: ${resp.status}`);
  }

  const data = await resp.json();
  const choice = data.choices?.[0];
  if (choice?.message?.tool_calls?.[0]) {
    return JSON.parse(choice.message.tool_calls[0].function.arguments);
  }
  return choice?.message?.content;
}

// ─── Generate companies (15 per tier = 45 total) ───
async function generateCompanies(plan: any) {
  const tools = [{
    type: "function",
    function: {
      name: "generate_companies",
      description: "Generate relevant companies organized by tier",
      parameters: {
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
                relevance_score: { type: "number", minimum: 0, maximum: 100 },
                notes: { type: "string" },
              },
              required: ["name", "segment", "tier", "has_openings", "relevance_score"],
              additionalProperties: false,
            },
          },
        },
        required: ["companies"],
        additionalProperties: false,
      },
    },
  }];

  return await callAI([
    { role: "system", content: `Você é um especialista em mercado de trabalho brasileiro.
Gere 45 empresas (15 por tier) relevantes para o perfil.
- Tier A: grandes corporações e multinacionais, empresas dos sonhos
- Tier B: empresas médias consolidadas, boas oportunidades
- Tier C: startups, nichos e empresas menores estratégicas
Considere a localização, área e segmento do candidato. Use empresas REAIS.` },
    { role: "user", content: `Perfil: ${plan.mentee_name}, ${plan.current_position} em ${plan.current_area}. ${plan.city}, ${plan.state}. Modelo: ${plan.work_model}. ${plan.current_situation === "employed" ? "Empregado" : "Desempregado"}.${plan.wants_career_change ? ` Transição para: ${(plan.target_positions || []).join(", ")}` : ""}` },
  ], tools, { type: "function", function: { name: "generate_companies" } });
}

// ─── Generate job titles (3 categories) ───
async function generateJobTitles(plan: any) {
  const tools = [{
    type: "function",
    function: {
      name: "generate_job_titles",
      description: "Generate job title variations in 3 categories",
      parameters: {
        type: "object",
        properties: {
          titles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "For decision_maker and hr_recruiter types, format as 'Title|||Description'" },
                type: { type: "string", enum: ["search_variation", "decision_maker", "hr_recruiter"] },
              },
              required: ["title", "type"],
              additionalProperties: false,
            },
          },
        },
        required: ["titles"],
        additionalProperties: false,
      },
    },
  }];

  return await callAI([
    { role: "system", content: `Você é um especialista em recrutamento e LinkedIn no Brasil.
Gere 3 listas de cargos:
1. search_variation (20 variações): nomenclaturas que o candidato deve pesquisar no LinkedIn e portais de vagas (português e inglês)
2. decision_maker (15 cargos): cargos de decisores na área do candidato. Formato: "Título|||Descrição breve do cargo e por que conectar"
3. hr_recruiter (12 cargos): cargos de RH e recrutadores. Formato: "Título|||Descrição breve"` },
    { role: "user", content: `Cargo: ${plan.current_position}. Área: ${plan.current_area}.${plan.wants_career_change ? ` Transição para: ${(plan.target_positions || []).join(", ")}` : ""}` },
  ], tools, { type: "function", function: { name: "generate_job_titles" } });
}

// ─── Generate 6 message templates ───
async function generateMessages(plan: any) {
  const tools = [{
    type: "function",
    function: {
      name: "generate_messages",
      description: "Generate 6 LinkedIn message templates",
      parameters: {
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
              additionalProperties: false,
            },
          },
        },
        required: ["templates"],
        additionalProperties: false,
      },
    },
  }];

  return await callAI([
    { role: "system", content: `Você é um especialista em networking profissional no LinkedIn Brasil.
Crie 6 templates de mensagem personalizados:
1. hr_with_opening: para RH quando há vaga aberta
2. hr_without_opening: para RH quando não há vaga
3. dm_with_opening: para decisor da área quando há vaga
4. dm_without_opening: para decisor quando não há vaga
5. follow_up: follow-up após 7 dias sem resposta
6. post_interview: agradecimento pós-entrevista

Use [Nome do RH], [Nome da Empresa], [Nome da Vaga], [Nome do Decisor] como placeholders.
Inclua menção a experiências relevantes com placeholders como [mencione 1-2 resultados].
NÃO inclua "Segue meu contato" - o sistema adiciona automaticamente.` },
    { role: "user", content: `Nome: ${plan.mentee_name}. Cargo: ${plan.current_position}. Área: ${plan.current_area}.` },
  ], tools, { type: "function", function: { name: "generate_messages" } });
}

// ─── Generate schedule (4 weeks) ───
async function generateSchedule(plan: any) {
  const linkedinGoals = plan.linkedin_goals || {};
  const tools = [{
    type: "function",
    function: {
      name: "generate_schedule",
      description: "Generate a 4-week activity schedule",
      parameters: {
        type: "object",
        properties: {
          activities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week_number: { type: "number", minimum: 1, maximum: 4 },
                day_of_week: { type: "string", enum: ["monday", "tuesday", "wednesday", "thursday", "friday"] },
                activity: { type: "string" },
                category: { type: "string", enum: ["linkedin", "networking", "content", "research", "applications"] },
              },
              required: ["week_number", "day_of_week", "activity", "category"],
              additionalProperties: false,
            },
          },
        },
        required: ["activities"],
        additionalProperties: false,
      },
    },
  }];

  return await callAI([
    { role: "system", content: `Você é um mentor de carreira especializado em recolocação profissional.
Crie um cronograma detalhado de 4 semanas com 3 atividades por dia (seg a sex) = 60 atividades total.
Cada atividade deve incluir o tempo estimado em parênteses.
Evolua a complexidade: semana 1 = fundação, semana 2 = aceleração, semanas 3-4 = consolidação.` },
    { role: "user", content: `Situação: ${plan.current_situation}. Metas: ${linkedinGoals.connectionsPerDay || 50} conexões/dia, ${linkedinGoals.postsPerWeek || 1} posts/semana. Modelo: ${plan.work_model}. Cargo: ${plan.current_position}.` },
  ], tools, { type: "function", function: { name: "generate_schedule" } });
}

// ─── Generate SWOT, steps, month goals, linkedin tips ───
async function generateDiagnosis(plan: any) {
  const tools = [{
    type: "function",
    function: {
      name: "generate_diagnosis",
      description: "Generate SWOT, steps, monthly goals, and LinkedIn tips",
      parameters: {
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
            additionalProperties: false,
          },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step: { type: "number" },
                title: { type: "string" },
                description: { type: "string" },
                tip: { type: "string" },
                time: { type: "string" },
              },
              required: ["step", "title", "description", "tip", "time"],
              additionalProperties: false,
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
            additionalProperties: false,
          },
          linkedin_tips: { type: "array", items: { type: "string" } },
        },
        required: ["swot", "steps", "month_goals", "linkedin_tips"],
        additionalProperties: false,
      },
    },
  }];

  return await callAI([
    { role: "system", content: `Você é um consultor sênior de recolocação profissional no Brasil.
Gere:
1. Análise SWOT com summary, 4 forças, 4 fraquezas, 5 oportunidades, 4 ameaças
2. 7 passos diários para LinkedIn (título, descrição, dica, tempo)
3. Metas para 3 meses (5-6 itens cada)
4. 5 dicas de otimização do perfil LinkedIn` },
    { role: "user", content: `Nome: ${plan.mentee_name}. Cargo: ${plan.current_position}. Área: ${plan.current_area}. Situação: ${plan.current_situation === "employed" ? "Empregado" : "Desempregado"}. Cidade: ${plan.city}, ${plan.state}. Modelo: ${plan.work_model}.${plan.wants_career_change ? ` Transição: ${(plan.target_positions || []).join(", ")}` : ""}` },
  ], tools, { type: "function", function: { name: "generate_diagnosis" } });
}

// ─── Generate content prompts for Gemini ───
async function generateContentPrompts(plan: any) {
  const tools = [{
    type: "function",
    function: {
      name: "generate_content_prompts",
      description: "Generate ready-to-use prompts for Gemini to create LinkedIn posts",
      parameters: {
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
              additionalProperties: false,
            },
          },
        },
        required: ["prompts"],
        additionalProperties: false,
      },
    },
  }];

  return await callAI([
    { role: "system", content: `Você é um especialista em marketing de conteúdo no LinkedIn.
Gere 8 prompts COMPLETOS e prontos para colar no Gemini. Cada prompt deve:
1. Ter um título curto descritivo
2. Conter instruções claras para a IA gerar o post completo
3. Incluir: tom de voz, estrutura do post, hashtags sugeridas, call-to-action
4. Ser personalizado para o perfil do candidato
5. Incluir no prompt: "Crie uma publicação para LinkedIn com aproximadamente 200-300 palavras..."

Os temas devem cobrir: liderança, resultados, tendências da área, aprendizados, dicas técnicas, storytelling profissional, reflexões e networking.` },
    { role: "user", content: `Nome: ${plan.mentee_name}. Cargo: ${plan.current_position}. Área: ${plan.current_area}. ${plan.current_situation === "employed" ? "Empregado" : "Desempregado"}.` },
  ], tools, { type: "function", function: { name: "generate_content_prompts" } });
}

// ─── Generate LinkedIn profile optimization ───
async function generateLinkedInProfile(plan: any, cvTexts: string[]) {
  const tools = [{
    type: "function",
    function: {
      name: "generate_linkedin_profile",
      description: "Generate optimized LinkedIn profile sections",
      parameters: {
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
              additionalProperties: false,
            },
          },
        },
        required: ["sections"],
        additionalProperties: false,
      },
    },
  }];

  const cvContext = cvTexts.length > 0
    ? `\n\nTexto extraído dos documentos do candidato:\n${cvTexts.join("\n---\n")}`
    : "";

  return await callAI([
    { role: "system", content: `Você é um especialista em otimização de perfis LinkedIn no Brasil.
Com base no perfil e documentos do candidato, gere 4 seções otimizadas:
1. headline: título ideal do LinkedIn (até 220 caracteres)
2. about: seção "Sobre" completa e otimizada (300-500 palavras)
3. experience: como descrever as experiências profissionais (modelo com bullet points)
4. skills: competências recomendadas e como organizá-las

Para cada seção, forneça:
- ideal_text: o texto pronto para usar
- explanation: explicação detalhada de por que esse formato funciona e dicas` },
    { role: "user", content: `Nome: ${plan.mentee_name}. Cargo: ${plan.current_position}. Área: ${plan.current_area}. Cidade: ${plan.city}, ${plan.state}. ${plan.current_situation === "employed" ? "Empregado" : "Desempregado"}.${plan.wants_career_change ? ` Transição: ${(plan.target_positions || []).join(", ")}` : ""}${cvContext}` },
  ], tools, { type: "function", function: { name: "generate_linkedin_profile" } });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const e = error as { message?: string; details?: string; code?: string };
    const parts = [e.message, e.details].filter(Boolean);
    if (parts.length > 0) return parts.join(" — ");
    if (e.code) return `Database error (${e.code})`;
  }
  return "Unknown error";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
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
      .from("mentorship_plans").select("*").eq("id", plan_id).eq("user_id", user.id).single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any;

    switch (type) {
      case "companies": {
        const aiResult = await generateCompanies(plan);
        const companies = aiResult.companies.map((c: any) => ({ ...c, plan_id, kanban_stage: "identified" }));
        const { error } = await supabase.from("companies").insert(companies);
        if (error) throw error;
        result = { generated: companies.length };
        break;
      }

      case "job_titles": {
        const aiResult = await generateJobTitles(plan);
        const titles = aiResult.titles.map((t: any) => ({ ...t, plan_id, is_ai_generated: true }));
        const { error } = await supabase.from("job_title_variations").insert(titles);
        if (error) throw error;
        result = { generated: titles.length };
        break;
      }

      case "messages": {
        const aiResult = await generateMessages(plan);
        const templates = aiResult.templates.map((t: any) => ({ ...t, plan_id, is_ai_generated: true }));
        const { error } = await supabase.from("message_templates").insert(templates);
        if (error) throw error;
        result = { generated: templates.length };
        break;
      }

      case "schedule": {
        const aiResult = await generateSchedule(plan);
        const activities = aiResult.activities.map((a: any) => ({ ...a, plan_id, is_completed: false }));
        const { error } = await supabase.from("schedule_activities").insert(activities);
        if (error) throw error;
        result = { generated: activities.length };
        break;
      }

      case "all": {
        // Delete existing data first
        await Promise.all([
          supabase.from("companies").delete().eq("plan_id", plan_id),
          supabase.from("job_title_variations").delete().eq("plan_id", plan_id),
          supabase.from("message_templates").delete().eq("plan_id", plan_id),
          supabase.from("schedule_activities").delete().eq("plan_id", plan_id),
        ]);

        // Fetch CV documents for LinkedIn profile optimization
        const { data: cvDocs } = await supabase
          .from("cv_documents")
          .select("extracted_text")
          .eq("plan_id", plan_id)
          .not("extracted_text", "is", null);
        const cvTexts = (cvDocs || []).map((d: any) => d.extracted_text).filter(Boolean);

        // Generate all content in parallel
        const [companiesRes, titlesRes, messagesRes, scheduleRes, diagnosisRes, contentPromptsRes, linkedinProfileRes] = await Promise.all([
          generateCompanies(plan),
          generateJobTitles(plan),
          generateMessages(plan),
          generateSchedule(plan),
          generateDiagnosis(plan),
          generateContentPrompts(plan),
          generateLinkedInProfile(plan, cvTexts),
        ]);

        const companies = companiesRes.companies.map((c: any) => ({ ...c, plan_id, kanban_stage: "identified" }));
        const titles = titlesRes.titles.map((t: any) => ({ ...t, plan_id, is_ai_generated: true }));
        const templates = messagesRes.templates.map((t: any) => ({ ...t, plan_id, is_ai_generated: true }));
        const activities = scheduleRes.activities.map((a: any) => ({ ...a, plan_id, is_completed: false }));

        const [c, t, m, s] = await Promise.all([
          supabase.from("companies").insert(companies),
          supabase.from("job_title_variations").insert(titles),
          supabase.from("message_templates").insert(templates),
          supabase.from("schedule_activities").insert(activities),
        ]);

        if (c.error) throw c.error;
        if (t.error) throw t.error;
        if (m.error) throw m.error;
        if (s.error) throw s.error;

        // Store diagnosis + content_prompts + linkedin_profile in general_notes
        const diagnosisData = JSON.stringify({
          swot: diagnosisRes.swot,
          steps: diagnosisRes.steps,
          month_goals: diagnosisRes.month_goals,
          linkedin_tips: diagnosisRes.linkedin_tips,
          content_prompts: contentPromptsRes.prompts,
          linkedin_profile: { sections: linkedinProfileRes.sections },
        });
        await supabase.from("mentorship_plans").update({
          general_notes: diagnosisData,
          status: "completed",
        }).eq("id", plan_id);

        result = {
          companies: companies.length,
          job_titles: titles.length,
          messages: templates.length,
          schedule: activities.length,
          diagnosis: true,
          content_prompts: contentPromptsRes.prompts?.length || 0,
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
    const message = getErrorMessage(e);

    if (message === "RATE_LIMITED") {
      return new Response(JSON.stringify({ error: "IA temporariamente indisponível. Tente novamente." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message === "PAYMENT_REQUIRED") {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
