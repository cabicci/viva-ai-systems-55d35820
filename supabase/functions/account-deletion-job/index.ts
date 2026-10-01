import { createClient } from "npm:@supabase/supabase-js@2.105.4";
import {
  authorizedDeletionJob,
  finalizeAccount,
  reconcileStripeCustomer,
  recoverStripeCheckout,
  type DeletionClaim,
  type StripeTransport,
} from "./handler.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (!(await authorizedDeletionJob(request, Deno.env.get("ACCOUNT_DELETION_JOB_SECRET"))))
    return new Response(null, { status: 401 });
  if (Deno.env.get("ACCOUNT_DELETION_ENABLED") !== "true") return Response.json({ enabled: false });
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!url || !key || !stripeKey || !/^(sk|rk)_test_/.test(stripeKey))
    return new Response(null, { status: 503 });
  let userId: unknown;
  try {
    userId = (await request.json()).user_id;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof userId !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(userId))
    return new Response(null, { status: 400 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const rpc = async (name: string, args: Record<string, unknown>) => {
    const { data, error } = await db.rpc(name, args);
    if (error) throw new Error("LC09_DATABASE_STEP_FAILED");
    return data;
  };
  const stripe: StripeTransport = async (path, options = {}) => {
    const method = options.method ?? "GET";
    const response = await fetch(`https://api.stripe.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Stripe-Version": "2026-08-26.dahlia",
        ...(options.idempotency ? { "Idempotency-Key": options.idempotency } : {}),
        ...(method !== "GET" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: method !== "GET" ? options.params?.toString() : undefined,
    });
    if (!response.ok) throw new Error("LC09_PROVIDER_STEP_FAILED");
    return await response.json();
  };
  try {
    return Response.json(
      await finalizeAccount(userId, {
        claim: async (id) => (await rpc("lc09_claim_deletion", { p_user_id: id })) as DeletionClaim,
        advance: (id, lease, stage) =>
          rpc("lc09_advance_deletion", {
            p_user_id: id,
            p_lease_token: lease,
            p_next_stage: stage,
          }),
        reconcileCustomer: (customer, id) => reconcileStripeCustomer(stripe, customer, id),
        recoverCheckout: async (attempt, id) => {
          const session = await recoverStripeCheckout(stripe, attempt);
          await rpc("lc09_record_kids_checkout", {
            p_user_id: id,
            p_attempt: attempt.id,
            p_session: session,
            p_expired: true,
          });
        },
        removeStorage: async (objects) => {
          const buckets = new Map<string, string[]>();
          for (const object of objects) {
            if (!object.bucket || !object.name) throw new Error("LC09_STORAGE_MANIFEST_INVALID");
            buckets.set(object.bucket, [...(buckets.get(object.bucket) ?? []), object.name]);
          }
          for (const [bucket, names] of buckets) {
            for (let offset = 0; offset < names.length; offset += 100) {
              const { error } = await db.storage
                .from(bucket)
                .remove(names.slice(offset, offset + 100));
              if (error) throw new Error("LC09_STORAGE_REMOVAL_FAILED");
            }
          }
        },
        identityExists: async (id) => {
          const { data, error } = await db.auth.admin.getUserById(id);
          if (error && error.status !== 404) throw new Error("LC09_AUTH_LOOKUP_FAILED");
          return !!data.user;
        },
        deleteIdentity: async (id) => {
          const { error } = await db.auth.admin.deleteUser(id, false);
          if (error) throw new Error("LC09_AUTH_REMOVAL_FAILED");
        },
      }),
    );
  } catch {
    // No email, PII, provider payload or secret is returned/logged.
    return Response.json(
      { stage: "pending", error: "deletion_requires_review_or_retry" },
      { status: 409 },
    );
  }
});
