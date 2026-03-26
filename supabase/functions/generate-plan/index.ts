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

  const body: any = {
    model: "google/gemini-3-flash-preview",
    messages,
  };
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
  // Handle tool calls
  const choice = data.choices?.[0];
  if (choice?.message?.tool_calls?.[0]) {
    return JSON.parse(choice.message.tool_calls[0].function.arguments);
  }
  // Handle plain text
  return choice?.message?.content;
}

// ─── Generate companies for a plan ───
async function generateCompanies(plan: any) {
  const systemPrompt = `Você é um especialista em mercado de trabalho brasileiro. 
Gere uma lista de empresas relevantes para o perfil do candidato, organizadas em tiers A, B e C.
- Tier A: empresas dos sonhos, grandes multinacionais ou líderes do setor
- Tier B: empresas sólidas, boas oportunidades de crescimento
- Tier C: empresas menores, startups ou nichos específicos`;

  const userPrompt = `Perfil do candidato:
- Nome: ${plan.mentee_name}
- Cargo atual: ${plan.current_position}
- Área: ${plan.current_area}
- Estado: ${plan.state}, Cidade: ${plan.city}
- Modelo de trabalho: ${plan.work_model}
- Situação: ${plan.current_situation}
${plan.wants_career_change ? `- Cargos alvo: ${(plan.target_positions || []).join(", ")}` : ""}
${plan.general_notes ? `- Observações: ${plan.general_notes}` : ""}

Gere 15 empresas (5 por tier) relevantes para este perfil.`;

  const tools = [{
    type: "function",
    function: {
      name: "generate_companies",
      description: "Generate a list of relevant companies organized by tier",
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

  return await callAI(
    [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    tools,
    { type: "function", function: { name: "generate_companies" } }
  );
}

// ─── Generate job title variations ───
async function generateJobTitles(plan: any) {
  const systemPrompt = `Você é um especialista em recrutamento e LinkedIn. 
Gere variações de cargos para busca no LinkedIn, incluindo variações em português e inglês.`;

  const userPrompt = `Cargo atual: ${plan.current_position}
Área: ${plan.current_area}
${plan.wants_career_change ? `Cargos alvo: ${(plan.target_positions || []).join(", ")}` : ""}

Gere variações de título para busca no LinkedIn.`;

  const tools = [{
    type: "function",
    function: {
      name: "generate_job_titles",
      description: "Generate job title variations for LinkedIn search",
      parameters: {
        type: "object",
        properties: {
          titles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                type: { type: "string", enum: ["current_variation", "target_position"] },
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

  return await callAI(
    [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    tools,
    { type: "function", function: { name: "generate_job_titles" } }
  );
}

// ─── Generate message templates ───
async function generateMessages(plan: any) {
  const systemPrompt = `Você é um especialista em networking profissional no LinkedIn.
Crie templates de mensagens personalizadas para conexão e abordagem.`;

  const userPrompt = `Perfil:
- Nome: ${plan.mentee_name}
- Cargo: ${plan.current_position}
- Área: ${plan.current_area}
${plan.wants_career_change ? `- Transição para: ${(plan.target_positions || []).join(", ")}` : ""}

Crie 2 templates: um para RH e outro para decisores.`;

  const tools = [{
    type: "function",
    function: {
      name: "generate_messages",
      description: "Generate LinkedIn message templates",
      parameters: {
        type: "object",
        properties: {
          templates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["hr", "decision_maker"] },
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

  return await callAI(
    [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    tools,
    { type: "function", function: { name: "generate_messages" } }
  );
}

// ─── Generate weekly schedule ───
async function generateSchedule(plan: any) {
  const systemPrompt = `Você é um mentor de carreira especializado em recolocação profissional.
Crie um cronograma semanal de 4 semanas com atividades diárias focadas em:
- LinkedIn (conexões, posts, interações)
- Networking (eventos, contatos)
- Pesquisa (empresas, vagas)
- Conteúdo (artigos, posts)
- Candidaturas (aplicações diretas)`;

  const linkedinGoals = plan.linkedin_goals || {};
  const userPrompt = `Perfil:
- Situação: ${plan.current_situation}
- Metas LinkedIn: ${linkedinGoals.connectionsPerDay || 50} conexões/dia, ${linkedinGoals.postsPerWeek || 1} posts/semana
- Modelo: ${plan.work_model}

Crie um cronograma de 4 semanas (seg a sex).`;

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

  return await callAI(
    [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    tools,
    { type: "function", function: { name: "generate_schedule" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan_id, type } = await req.json();
    if (!plan_id) {
      return new Response(JSON.stringify({ error: "plan_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch plan and verify ownership
    const { data: plan, error: planError } = await supabase
      .from("mentorship_plans")
      .select("*")
      .eq("id", plan_id)
      .eq("user_id", user.id)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any;

    switch (type) {
      case "companies": {
        const aiResult = await generateCompanies(plan);
        const companies = aiResult.companies.map((c: any) => ({
          ...c,
          plan_id,
          kanban_stage: "identified",
        }));
        const { error } = await supabase.from("companies").insert(companies);
        if (error) throw error;
        result = { generated: companies.length };
        break;
      }

      case "job_titles": {
        const aiResult = await generateJobTitles(plan);
        const titles = aiResult.titles.map((t: any) => ({
          ...t,
          plan_id,
          is_ai_generated: true,
        }));
        const { error } = await supabase.from("job_title_variations").insert(titles);
        if (error) throw error;
        result = { generated: titles.length };
        break;
      }

      case "messages": {
        const aiResult = await generateMessages(plan);
        const templates = aiResult.templates.map((t: any) => ({
          ...t,
          plan_id,
          is_ai_generated: true,
        }));
        const { error } = await supabase.from("message_templates").insert(templates);
        if (error) throw error;
        result = { generated: templates.length };
        break;
      }

      case "schedule": {
        const aiResult = await generateSchedule(plan);
        const activities = aiResult.activities.map((a: any) => ({
          ...a,
          plan_id,
          is_completed: false,
        }));
        const { error } = await supabase.from("schedule_activities").insert(activities);
        if (error) throw error;
        result = { generated: activities.length };
        break;
      }

      case "all": {
        const [companiesRes, titlesRes, messagesRes, scheduleRes] = await Promise.all([
          generateCompanies(plan),
          generateJobTitles(plan),
          generateMessages(plan),
          generateSchedule(plan),
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

        result = {
          companies: companies.length,
          job_titles: titles.length,
          messages: templates.length,
          schedule: activities.length,
        };

        // Update plan status to completed
        await supabase.from("mentorship_plans").update({ status: "completed" }).eq("id", plan_id);
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid type. Use: companies, job_titles, messages, schedule, or all" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-plan error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";

    if (message === "RATE_LIMITED") {
      return new Response(JSON.stringify({ error: "IA temporariamente indisponível. Tente novamente em alguns segundos." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message === "PAYMENT_REQUIRED") {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione fundos nas configurações." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
