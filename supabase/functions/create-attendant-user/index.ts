// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  action: "create" | "update";
  email?: string;
  password?: string;
  display_name?: string;
  branch_location?: string | null;
  orders_visibility?: "all" | "branch";
  permissions?: Record<string, boolean>;
  is_active?: boolean;
  user_id?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user: caller },
      error: callerErr,
    } = await adminClient.auth.getUser(jwt);
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRows } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id);
    const isAdmin = (roleRows ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (body.action === "create") {
      const email = (body.email ?? "").trim().toLowerCase();
      const password = body.password ?? "";
      const display_name = (body.display_name ?? "").trim();
      if (!email || !password || password.length < 8) {
        return new Response(JSON.stringify({ error: "Email and password (min 8 chars) required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!display_name) {
        return new Response(JSON.stringify({ error: "Display name required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr || !created.user) {
        return new Response(JSON.stringify({ error: createErr?.message ?? "Could not create user." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const uid = created.user.id;
      const { error: roleErr } = await adminClient.from("user_roles").insert({ user_id: uid, role: "staff" });
      if (roleErr) {
        await adminClient.auth.admin.deleteUser(uid);
        return new Response(JSON.stringify({ error: roleErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const perms = body.permissions ?? {};
      const { error: profErr } = await adminClient.from("attendant_profiles").insert({
        user_id: uid,
        email,
        display_name,
        branch_location: body.branch_location ?? null,
        orders_visibility: body.orders_visibility === "branch" ? "branch" : "all",
        is_active: true,
        permissions: perms,
      });
      if (profErr) {
        await adminClient.from("user_roles").delete().eq("user_id", uid);
        await adminClient.auth.admin.deleteUser(uid);
        return new Response(JSON.stringify({ error: profErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient.from("admin_activity_log").insert({
        user_id: caller.id,
        action: "attendant_created",
        entity_type: "attendant_profile",
        entity_id: uid,
        metadata: {
          email,
          display_name,
          branch_location: body.branch_location ?? null,
          orders_visibility: body.orders_visibility === "branch" ? "branch" : "all",
          permissions: perms,
        },
      });

      return new Response(JSON.stringify({ ok: true, user_id: uid }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "update") {
      const user_id = body.user_id;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = {};
      if (body.display_name != null) updates.display_name = String(body.display_name).trim();
      if (body.branch_location !== undefined) updates.branch_location = body.branch_location;
      if (body.orders_visibility != null) updates.orders_visibility = body.orders_visibility;
      if (body.permissions != null) updates.permissions = body.permissions;
      if (body.is_active != null) updates.is_active = Boolean(body.is_active);

      const { error: upErr } = await adminClient.from("attendant_profiles").update(updates).eq("user_id", user_id);
      if (upErr) {
        return new Response(JSON.stringify({ error: upErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (body.password && String(body.password).length >= 8) {
        const { error: pwErr } = await adminClient.auth.admin.updateUserById(user_id, {
          password: body.password,
        });
        if (pwErr) {
          return new Response(JSON.stringify({ error: pwErr.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      await adminClient.from("admin_activity_log").insert({
        user_id: caller.id,
        action: "attendant_updated",
        entity_type: "attendant_profile",
        entity_id: user_id,
        metadata: {
          display_name: updates.display_name,
          branch_location: updates.branch_location,
          orders_visibility: updates.orders_visibility,
          permissions: updates.permissions,
          is_active: updates.is_active,
          password_changed: Boolean(body.password),
        },
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
