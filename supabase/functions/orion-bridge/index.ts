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

// ---------- Action handlers ----------

/**
 * create_plan
 * payload: {
 *   mentee_name (required),
 *   mentee_email?,
 *   current_position?, current_area?,
 *   state?, city?,
 *   owner_user_id?  (Pathly admin user_id that will own the plan; falls back to first admin),
 *   orionpipe_client_id?,
 *   source?
 * }
 * Idempotent by mentee_email when provided.
 */
async function createPlan(payload: any) {
  const {
    mentee_name,
    mentee_email = null,
    current_position = "A definir",
    current_area = "A definir",
    state = "SP",
    city = "São Paulo",
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

  const insertRow: Record<string, unknown> = {
    user_id: userId,
    mentee_name,
    mentee_email,
    current_position,
    current_area,
    state,
    city,
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
 * payload: { plan_id, job_title, company_name, location?, job_url?, source?, status?, notes? }
 * Upsert by (plan_id, job_url) when URL present, else (plan_id, company_name + job_title) ilike.
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
 * payload: { plan_id: string, orionpipe_client_id?: string }
 * Marks plan as active (status='completed') and stores Orion client id.
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
 * payload: { plan_id, name, segment?, tier?, has_openings?, relevance_score?, notes?, source? }
 * Upsert by (plan_id, name) — case-insensitive match.
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
 * payload: { plan_id, name, current_position?, company?, linkedin_url?, type?, tier?, status?, notes?, source? }
 * Upsert by (plan_id, linkedin_url) when present, else by (plan_id, name + company).
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
 * payload: { plan_id?: string, since?: ISO timestamp, source?: string }
 * Returns companies + contacts contributed (default source='extension').
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
 * payload: { status?: string }  default 'completed'
 * Returns plans (id, mentee_name, mentee_email, status, orionpipe_client_id, updated_at).
 */
async function listActivePlans(payload: any) {
  const { status = "completed" } = payload ?? {};
  const { data, error } = await supabase
    .from("mentorship_plans")
    .select(
      "id, mentee_name, mentee_email, status, orionpipe_client_id, current_position, current_area, state, city, updated_at, created_at",
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
