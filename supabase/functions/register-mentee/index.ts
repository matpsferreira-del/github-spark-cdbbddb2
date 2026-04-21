import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.100.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is authenticated admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, plan_id, mentee_name } = await req.json();

    if (!email || !password || !plan_id) {
      return new Response(JSON.stringify({ error: "Missing email, password, or plan_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller owns the plan
    const { data: planData, error: planError } = await adminClient
      .from("mentorship_plans")
      .select("id, user_id")
      .eq("id", plan_id)
      .single();

    if (planError || !planData || planData.user_id !== caller.id) {
      return new Response(JSON.stringify({ error: "Plan not found or unauthorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

    let menteeUserId: string;

    if (existingUser) {
      menteeUserId = existingUser.id;
      // Reset password to the new one provided by the mentor and force change on next login
      await adminClient.auth.admin.updateUserById(menteeUserId, {
        password,
        user_metadata: {
          ...(existingUser.user_metadata || {}),
          name: mentee_name || existingUser.user_metadata?.name || email.split("@")[0],
          must_change_password: true,
        },
      });
    } else {
      // Create the mentee user account with must_change_password flag
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: mentee_name || email.split("@")[0],
          must_change_password: true,
        },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      menteeUserId = newUser.user.id;
    }

    // Ensure mentee role exists and remove any admin role to avoid conflicts
    await adminClient.from("user_roles").delete().eq("user_id", menteeUserId).eq("role", "admin");
    await adminClient.from("user_roles").upsert(
      { user_id: menteeUserId, role: "mentee" },
      { onConflict: "user_id,role" }
    );

    // Grant access to plan
    await adminClient.from("mentee_plan_access").upsert(
      { user_id: menteeUserId, plan_id },
      { onConflict: "user_id,plan_id" }
    );

    // Update plan with mentee email
    await adminClient.from("mentorship_plans").update({ mentee_email: email }).eq("id", plan_id);

    return new Response(JSON.stringify({ success: true, mentee_user_id: menteeUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
