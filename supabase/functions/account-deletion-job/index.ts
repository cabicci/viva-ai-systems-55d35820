import { createClient } from "npm:@supabase/supabase-js@2.105.4";
import { authorizedDeletionJob } from "./handler.ts";
import { createAccountLifecycleWorker } from "../_shared/account-lifecycle-worker.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (!(await authorizedDeletionJob(request, Deno.env.get("ACCOUNT_DELETION_JOB_SECRET"))))
    return new Response(null, { status: 401 });
  const deletionEnabled = Deno.env.get("ACCOUNT_DELETION_ENABLED") === "true";
  const financialEnabled = Deno.env.get("ACCOUNT_FINANCIAL_PURGE_ENABLED") === "true";
  if (!deletionEnabled && !financialEnabled) return Response.json({ enabled: false });
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!url || !key || !stripeKey || !/^(sk|rk)_test_/.test(stripeKey))
    return new Response(null, { status: 503 });
  let userId: unknown;
  let action: unknown;
  try {
    const body = await request.json();
    userId = body.user_id;
    action = body.action ?? "delete_account";
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!["delete_account", "purge_financial", "run_batch"].includes(String(action)))
    return new Response(null, { status: 400 });
  if (
    action !== "run_batch" &&
    (typeof userId !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(userId))
  )
    return new Response(null, { status: 400 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { finalize, purge, runBatch } = createAccountLifecycleWorker(db, stripeKey);
  try {
    if (action === "run_batch") {
      // Separate switches: pausing account erasure must not silently postpone
      // an already approved financial deadline. RPCs enforce database switches.
      return Response.json(await runBatch({ deletionEnabled, financialEnabled }));
    }
    if (action === "purge_financial") {
      if (!financialEnabled) return Response.json({ enabled: false });
      return Response.json(await purge(userId as string));
    }
    if (!deletionEnabled) return Response.json({ enabled: false });
    return Response.json(await finalize(userId as string));
  } catch {
    // No email, PII, provider payload or secret is returned/logged.
    return Response.json(
      { stage: "pending", error: "deletion_requires_review_or_retry" },
      { status: 409 },
    );
  }
});
