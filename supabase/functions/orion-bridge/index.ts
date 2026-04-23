// supabase/functions/orion-bridge/index.ts (Pathly project)
// Bridge HTTP entre Orion e Pathly. Cole este arquivo no projeto Pathly
// substituindo o conteúdo atual de supabase/functions/orion-bridge/index.ts.
//
// MUDANÇA PRINCIPAL nesta versão:
// - createPlan agora aceita e PERSISTE os campos extras enviados pelo Orion:
//   employment_status (ignorado, não há coluna), work_model, state, city,
//   region_preference, cities_of_interest (=> available_cities),
//   target_role (=> target_positions jsonb + wants_career_change quando difere
//   de current_position).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-orion-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

// ---------- helpers ----------

const ALLOWED_REGION = new Set(["same_region", "open_to_change"]);
const ALLOWED_WORK_MODEL = new Set(["presencial", "hibrido", "remoto"]);

function normalizeRegion(value: unknown): string {
  if (typeof value !== "string") return "same_region";
  if (ALLOWED_REGION.has(value)) return value;
  // Aceita também o vocabulário antigo do Orion como fallback
  if (value === "mesma_regiao") return "same_region";
  if (value === "outras_regioes" || value === "indiferente" || value === "any" || value === "other_regions") {
    return "open_to_change";
  }
  return "same_region";
}

function normalizeWorkModel(value: unknown): string {
  if (typeof value !== "string") return "hibrido";
  if (ALLOWED_WORK_MODEL.has(value)) return value;
  // Fallbacks de variações
  if (value === "on_site") return "presencial";
  if (value === "hybrid") return "hibrido";
  if (value === "remote") return "remoto";
  return "hibrido";
}

function normalizeState(value: unknown): string {
  if (typeof value !== "string") return "SP";
  const trimmed = value.trim().toUpperCase();
  if (trimmed.length === 2) return trimmed;
  if (trimmed.length > 2) return trimmed.slice(0, 2);
  return "SP";
}

function normalizeCitiesOfInterest(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item: any) => ({
      estado: typeof item.estado === "string" ? item.estado : "",
      cidade: typeof item.cidade === "string" ? item.cidade : "",
    }))
    .filter((item) => item.estado && item.cidade);
}

function normalizeTargetPositions(targetRole: unknown): unknown[] {
  if (typeof targetRole !== "string") return [];
  const role = targetRole.trim();
  if (!role) return [];
  return [{ title: role, type: "target_position" }];
}

// ---------- Action handlers ----------

/**
 * create_plan
 * payload (todos opcionais salvo mentee_name):
 *   mentee_name (required)
 *   mentee_email
 *   current_position, current_area
 *   state, city
 *   target_role, target_location
 *   employment_status        // não persistido (sem coluna no schema atual)
 *   work_model               // presencial | hibrido | remoto
 *   region_preference        // same_region | open_to_change
 *   cities_of_interest       // [{ estado, cidade }, ...] => available_cities jsonb
 *   owner_user_id, orionpipe_client_id, source
 *
 * Idempotente por mentee_email quando informado.
 */
async function createPlan(payload: any) {
  const {
    mentee_name,
    mentee_email = null,
    current_position = "A definir",
    current_area = "A definir",
    target_role = null,
    state,
    city,
    work_model,
    region_preference,
    cities_of_interest,
    owner_user_id = null,
    orionpipe_client_id = null,
  } = payload ?? {};

  if (!mentee_name) return json({ error: "mentee_name required" }, 400);

  // Idempotency by email
  if (mentee_email) {
    const { data: existing } = await supabase
      .from("mentorship_plans")
      .select("*")
      .eq("mentee_email", mentee_email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      return json({ ok: true, plan: existing, action: "existing" });
    }
  }

  // Resolve owner: explicit -> first admin in user_roles
  let userId = owner_user_id;
  if (!userId) {
    const { data: admin } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    userId = admin?.user_id ?? null;
  }
  if (!userId) {
    return json(
      { error: "No owner_user_id provided and no admin user found to own the plan" },
      400,
    );
  }

  const normalizedState = normalizeState(state);
  const normalizedCity = (typeof city === "string" && city.trim()) || "São Paulo";
  const normalizedWorkModel = normalizeWorkModel(work_model);
  const normalizedRegion = normalizeRegion(region_preference);
  const availableCities = normalizeCitiesOfInterest(cities_of_interest);
  const targetPositions = normalizeTargetPositions(target_role);
  const wantsCareerChange =
    typeof target_role === "string" &&
    target_role.trim().length > 0 &&
    target_role.trim().toLowerCase() !== String(current_position ?? "").trim().toLowerCase();

  const insertRow: Record<string, unknown> = {
    user_id: userId,
    mentee_name,
    mentee_email,
    current_position,
    current_area,
    state: normalizedState,
    city: normalizedCity,
    work_model: normalizedWorkModel,
    region_preference: normalizedRegion,
    available_cities: availableCities,
    target_positions: targetPositions,
    wants_career_change: wantsCareerChange,
    status: "completed",
  };
  if (orionpipe_client_id) insertRow.orionpipe_client_id = orionpipe_client_id;

  const { data, error } = await supabase
    .from("mentorship_plans")
    .insert(insertRow)
    .select()
    .single();

  if (error) return json({ error: error.message }, 400);
  return json({ ok: true, plan: data, action: "created" });
}

/**
 * upsert_market_job
 */
async function upsertMarketJob(payload: any) {
  const {
    plan_id,
    job_title,
    company_name,
    location = null,
    job_url = null,
    source = "orion",
    status = "identificada",
    notes = null,
  } = payload ?? {};

  if (!plan_id || !job_title || !company_name) {
    return json(
      { error: "plan_id, job_title and company_name required" },
      400,
    );
  }

  let query = supabase.from("market_jobs").select("id").eq("plan_id", plan_id);
  if (job_url) {
    query = query.eq("job_url", job_url);
  } else {
    query = query.ilike("company_name", company_name).ilike("job_title", job_title);
  }
  const { data: existing, error: findErr } = await query.maybeSingle();
  if (findErr) return json({ error: findErr.message }, 400);

  if (existing) {
    const { data, error } = await supabase
      .from("market_jobs")
      .update({ job_title, company_name, location, job_url, source, status, notes })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, market_job: data, action: "updated" });
  }

  const { data, error } = await supabase
    .from("market_jobs")
    .insert({ plan_id, job_title, company_name, location, job_url, source, status, notes })
    .select()
    .single();
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true, market_job: data, action: "created" });
}

/**
 * activate_plan
 */
async function activatePlan(payload: any) {
  const { plan_id, orionpipe_client_id } = payload ?? {};
  if (!plan_id) return json({ error: "plan_id required" }, 400);

  const update: Record<string, unknown> = { status: "completed" };
  if (orionpipe_client_id) update.orionpipe_client_id = orionpipe_client_id;

  const { data, error } = await supabase
    .from("mentorship_plans")
    .update(update)
    .eq("id", plan_id)
    .select()
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "plan not found" }, 404);
  return json({ ok: true, plan: data });
}

/**
 * upsert_company
 */
async function upsertCompany(payload: any) {
  const {
    plan_id,
    name,
    segment = "",
    tier = "A",
    has_openings = false,
    relevance_score = 0,
    notes = null,
    kanban_stage = "identified",
    source = "orion",
  } = payload ?? {};

  if (!plan_id || !name) {
    return json({ error: "plan_id and name required" }, 400);
  }

  const { data: existing, error: findErr } = await supabase
    .from("companies")
    .select("id")
    .eq("plan_id", plan_id)
    .ilike("name", name)
    .maybeSingle();

  if (findErr) return json({ error: findErr.message }, 400);

  if (existing) {
    const { data, error } = await supabase
      .from("companies")
      .update({ segment, tier, has_openings, relevance_score, notes, source })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, company: data, action: "updated" });
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      plan_id,
      name,
      segment,
      tier,
      has_openings,
      relevance_score,
      notes,
      kanban_stage,
      source,
    })
    .select()
    .single();
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true, company: data, action: "created" });
}

/**
 * upsert_contact
 */
async function upsertContact(payload: any) {
  const {
    plan_id,
    name,
    current_position = null,
    company = null,
    linkedin_url = null,
    type = "decision_maker",
    tier = "A",
    status = "identified",
    notes = null,
    source = "orion",
  } = payload ?? {};

  if (!plan_id || !name) {
    return json({ error: "plan_id and name required" }, 400);
  }

  let query = supabase.from("contact_mappings").select("id").eq("plan_id", plan_id);
  if (linkedin_url) {
    query = query.eq("linkedin_url", linkedin_url);
  } else {
    query = query.ilike("name", name);
    if (company) query = query.ilike("company", company);
  }
  const { data: existing, error: findErr } = await query.maybeSingle();
  if (findErr) return json({ error: findErr.message }, 400);

  if (existing) {
    const { data, error } = await supabase
      .from("contact_mappings")
      .update({
        name,
        current_position,
        company,
        linkedin_url,
        type,
        tier,
        status,
        notes,
        source,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, contact: data, action: "updated" });
  }

  const { data, error } = await supabase
    .from("contact_mappings")
    .insert({
      plan_id,
      name,
      current_position,
      company,
      linkedin_url,
      type,
      tier,
      status,
      notes,
      source,
    })
    .select()
    .single();
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true, contact: data, action: "created" });
}

/**
 * list_mentee_contributions
 */
async function listMenteeContributions(payload: any) {
  const { plan_id, since, source = "extension" } = payload ?? {};

  let companiesQ = supabase
    .from("companies")
    .select("*")
    .eq("source", source)
    .order("created_at", { ascending: false });
  let contactsQ = supabase
    .from("contact_mappings")
    .select("*")
    .eq("source", source)
    .order("created_at", { ascending: false });

  if (plan_id) {
    companiesQ = companiesQ.eq("plan_id", plan_id);
    contactsQ = contactsQ.eq("plan_id", plan_id);
  }
  if (since) {
    companiesQ = companiesQ.gte("created_at", since);
    contactsQ = contactsQ.gte("created_at", since);
  }

  const [{ data: companies, error: cErr }, { data: contacts, error: kErr }] =
    await Promise.all([companiesQ, contactsQ]);

  if (cErr) return json({ error: cErr.message }, 400);
  if (kErr) return json({ error: kErr.message }, 400);

  return json({ ok: true, companies: companies ?? [], contacts: contacts ?? [] });
}

/**
 * list_active_plans
 */
async function listActivePlans(payload: any) {
  const { status = "completed" } = payload ?? {};
  const { data, error } = await supabase
    .from("mentorship_plans")
    .select(
      "id, mentee_name, mentee_email, status, orionpipe_client_id, current_position, current_area, state, city, work_model, region_preference, available_cities, target_positions, updated_at, created_at",
    )
    .eq("status", status)
    .order("updated_at", { ascending: false });

  if (error) return json({ error: error.message }, 400);
  return json({ ok: true, plans: data ?? [] });
}

// ---------- Main handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Validate shared secret
  const secret = req.headers.get("x-orion-secret");
  const expected = Deno.env.get("ORION_BRIDGE_SECRET");
  if (!expected) {
    return json({ error: "Bridge secret not configured" }, 500);
  }
  if (!secret || secret !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: { action?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { action, payload } = body ?? {};
  if (!action) return json({ error: "action required" }, 400);

  try {
    switch (action) {
      case "create_plan":
        return await createPlan(payload);
      case "activate_plan":
        return await activatePlan(payload);
      case "upsert_company":
        return await upsertCompany(payload);
      case "upsert_contact":
        return await upsertContact(payload);
      case "upsert_market_job":
        return await upsertMarketJob(payload);
      case "list_mentee_contributions":
        return await listMenteeContributions(payload);
      case "list_active_plans":
        return await listActivePlans(payload);
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e) {
    console.error("orion-bridge error", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});
