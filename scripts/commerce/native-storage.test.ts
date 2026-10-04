import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "../../src/integrations/supabase/types";
import type { Order, Receipt } from "../../src/lib/commerce/contracts";

type Context = { userId: string; supabase: SupabaseClient<Database> };
type Handler = (input: { data: unknown; context: Context }) => Promise<unknown>;
type Middleware = (input: {
  next: (input: { context: Context }) => Promise<unknown>;
}) => Promise<unknown>;
type ServerCall = (input: { data: unknown }) => Promise<unknown>;
const request = vi.hoisted(() => ({ current: undefined as Request | undefined }));

// Only the framework dispatch is adapted for in-process invocation. The shipped
// authentication middleware, validators, receipt handlers, SQL and Storage HTTP
// clients execute unchanged. This does not claim browser/route HTTP acceptance.
vi.mock("@tanstack/react-start/server", () => ({ getRequest: () => request.current }));
vi.mock("@tanstack/react-start", () => ({
  createMiddleware: () => ({ server: (middleware: Middleware) => middleware }),
  createServerFn: () => {
    let middleware: Middleware;
    let validate: (value: unknown) => unknown;
    const builder = {
      middleware: (items: Middleware[]) => {
        expect(items).toHaveLength(1);
        middleware = items[0];
        return builder;
      },
      validator: (validator: (value: unknown) => unknown) => {
        validate = validator;
        return builder;
      },
      handler:
        (handler: Handler): ServerCall =>
        async (input) =>
          middleware({ next: ({ context }) => handler({ data: validate(input.data), context }) }),
    };
    return builder;
  },
}));

import {
  commerceCommand,
  uploadCommerceReceipt,
  readCommerceReceipt,
} from "../../src/lib/commerce/commerce.functions";

type Actor = { id: string; token: string; client: SupabaseClient<Database> };
let apiUrl: string, anonKey: string;
let service: SupabaseClient<Database>;
let sql: ReturnType<typeof postgres>;
let admin: Actor, member: Actor, other: Actor;
let order: Order;
const receiptBytes = () => new TextEncoder().encode(`%PDF-1.4\nSYNTHETIC ${randomUUID()}\n%%EOF`);

async function call<T>(actor: Actor | undefined, fn: unknown, data: unknown): Promise<T> {
  request.current = new Request("http://127.0.0.1/commerce-native-test", {
    headers: actor ? { authorization: `Bearer ${actor.token}` } : {},
  });
  return (fn as ServerCall)({ data }) as Promise<T>;
}
const command = <T = unknown>(actor: Actor, action: string, data = {}) =>
  call<T>(actor, commerceCommand, { action, data });
const upload = (actor: Actor, bytes = receiptBytes(), orderId = order.id) =>
  call<Receipt>(actor, uploadCommerceReceipt, {
    orderId,
    mime: "application/pdf",
    base64: Buffer.from(bytes).toString("base64"),
  });
const read = (actor: Actor, id: string) =>
  call<{ base64: string; mime: string }>(actor, readCommerceReceipt, { id });

beforeAll(async () => {
  // The harness cannot be pointed at a hosted project or use owner credentials.
  const root = path.resolve("billing-v3-validation/disposable-supabase");
  if (
    process.env.BILLING_DISPOSABLE_DB !== "1" ||
    path.resolve(process.env.DISPOSABLE_SUPABASE_ROOT ?? "") !== root
  )
    throw new Error("Prepared disposable Supabase harness required");
  const statusFile = process.env.COMMERCE_NATIVE_STATUS_FILE;
  if (
    !statusFile ||
    !process.env.RUNNER_TEMP ||
    path.dirname(path.resolve(statusFile)) !== path.resolve(process.env.RUNNER_TEMP)
  )
    throw new Error("Ephemeral CI status file required");
  const keys = JSON.parse(readFileSync(statusFile, "utf8")) as Record<string, string>;
  const api = new URL(keys.API_URL),
    db = new URL(keys.DB_URL);
  if (
    !["127.0.0.1", "localhost"].includes(api.hostname) ||
    api.port !== "54321" ||
    !["127.0.0.1", "localhost"].includes(db.hostname) ||
    db.port !== "54322" ||
    db.pathname !== "/postgres" ||
    !keys.ANON_KEY ||
    !keys.SERVICE_ROLE_KEY
  )
    throw new Error("Only the ephemeral localhost Supabase stack is allowed");
  apiUrl = api.origin;
  anonKey = keys.ANON_KEY;
  vi.stubEnv("SUPABASE_URL", apiUrl);
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", anonKey);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", keys.SERVICE_ROLE_KEY);
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  service = createClient<Database>(apiUrl, keys.SERVICE_ROLE_KEY, options);
  sql = postgres(db.href, { max: 1 });
  await sql`UPDATE billing.commerce_control SET enabled=true, invitations_enabled=false`;
  const actor = async (): Promise<Actor> => {
    const email = `commerce-native-${randomUUID()}@example.test`;
    const password = randomUUID() + "Aa1!";
    // Ephemeral CI fixture identities only. Confirmation is local; no mail is
    // sent and no production/acceptance account or protected family is touched.
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error || !created.data.user) throw new Error("Local Auth fixture creation failed");
    const client = createClient<Database>(apiUrl, anonKey, options);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error || !signedIn.data.session) throw new Error("Local Auth sign-in failed");
    return { id: created.data.user.id, token: signedIn.data.session.access_token, client };
  };
  admin = await actor();
  member = await actor();
  other = await actor();
  await sql`INSERT INTO public.user_roles (user_id,role) VALUES (${admin.id},'admin')`;
  await command(admin, "configure_method", {
    code: "instapay",
    enabled: true,
    currencies: ["EGP"],
    destination: "SYNTHETIC ONLY",
    instructions: "CI fixture. No transfer.",
    instructions_localized: {
      "ar-EG": "تعليمات مصرية اصطناعية",
      "ar-MSA": "تعليمات فصحى اصطناعية",
      "ar-Gulf": "تعليمات خليجية اصطناعية",
      en: "Synthetic English instructions",
    },
  });
});
beforeEach(async () => {
  order = await command<Order>(member, "create_order", {
    package: "pro",
    market: "EG",
    billing_interval: "month",
    method: "instapay",
    key: randomUUID(),
  });
});
afterAll(async () => {
  // The entire local stack is disposed by CI. No artifacts contain credentials.
  await sql?.end();
  vi.unstubAllEnvs();
});

describe("native signed-in commerce handlers and Storage HTTP privacy", () => {
  it("rejects missing and forged JWTs before receipt access", async () => {
    await expect(call(undefined, readCommerceReceipt, { id: randomUUID() })).rejects.toThrow(
      /Unauthorized/,
    );
    await expect(
      call({ ...member, token: "forged" }, readCommerceReceipt, { id: randomUUID() }),
    ).rejects.toThrow(/Unauthorized/);
  });
  it("enforces administrator authorization with an actual ordinary Auth session", async () => {
    await expect(
      command(member, "configure_method", {
        code: "instapay",
        enabled: true,
        currencies: ["EGP"],
        destination: "OTHER",
        instructions: "OTHER",
      }),
    ).rejects.toThrow(/COMMERCE_ADMIN_REQUIRED/);
  });
  it("stores a private receipt but issues no access or payment on upload", async () => {
    const receipt = await upload(member);
    const details = await command<Order>(member, "order", { id: order.id });
    expect(details.review_status).toBe("pending");
    expect(details.instructions_snapshot.instructions_localized).toEqual({
      "ar-EG": "تعليمات مصرية اصطناعية",
      "ar-MSA": "تعليمات فصحى اصطناعية",
      "ar-Gulf": "تعليمات خليجية اصطناعية",
      en: "Synthetic English instructions",
    });
    expect(details.receipts?.some((x) => x.id === receipt.id)).toBe(true);
    const counts = await sql`SELECT
      (SELECT count(*) FROM billing.commerce_entitlements WHERE order_id=${order.id})::int AS access,
      (SELECT count(*) FROM billing.commerce_allocations WHERE order_id=${order.id})::int AS payments`;
    expect(counts[0]).toMatchObject({ access: 0, payments: 0 });
  });
  it("allows only the verified owner and authorized administrator to download through the handler", async () => {
    const bytes = receiptBytes(),
      receipt = await upload(member, bytes);
    for (const actor of [member, admin]) {
      const file = await read(actor, receipt.id);
      expect(Buffer.from(file.base64, "base64")).toEqual(Buffer.from(bytes));
      expect(file.mime).toBe("application/pdf");
    }
    await expect(read(other, receipt.id)).rejects.toThrow(/Receipt access denied/);
  });
  it("rejects another account's upload before creating a manifest or Storage object", async () => {
    await expect(upload(other)).rejects.toThrow(/COMMERCE_RECEIPT_FORBIDDEN/);
    const rows =
      await sql`SELECT count(*)::int AS count FROM billing.commerce_receipts WHERE order_id=${order.id}`;
    expect(rows[0].count).toBe(0);
  });
  it("denies direct Storage downloads, public URLs and signed URLs including for the owner", async () => {
    const receipt = await upload(member),
      storagePath = `${order.id}/${receipt.id}`;
    const anon = createClient<Database>(apiUrl, anonKey, { auth: { persistSession: false } });
    for (const client of [anon, member.client, other.client, admin.client]) {
      const bucket = client.storage.from("commerce-receipts");
      expect((await bucket.download(storagePath)).error).toBeTruthy();
      expect((await bucket.createSignedUrl(storagePath, 60)).error).toBeTruthy();
      const listing = await bucket.list(order.id);
      expect(listing.error || listing.data?.length === 0).toBeTruthy();
    }
    const publicFile = await fetch(
      `${apiUrl}/storage/v1/object/public/commerce-receipts/${storagePath}`,
    );
    expect(publicFile.ok).toBe(false);
  });
  it("denies direct Storage uploads and the service-only receipt RPC to customers", async () => {
    const bytes = receiptBytes();
    expect(
      (
        await member.client.storage
          .from("commerce-receipts")
          .upload(`${order.id}/${randomUUID()}`, bytes, { contentType: "application/pdf" })
      ).error,
    ).toBeTruthy();
    expect(
      (
        await member.client.rpc(
          "commerce_receipt" as never,
          {
            p_actor: admin.id,
            p_action: "read",
            p_data: { id: randomUUID() },
          } as never,
        )
      ).error,
    ).toBeTruthy();
  });
  it("rejects MIME mismatch, malformed encoding and excessive size without storing anything", async () => {
    for (const data of [
      { mime: "image/png", base64: Buffer.from(receiptBytes()).toString("base64") },
      { mime: "application/pdf", base64: "bad!encoding!" },
      { mime: "application/pdf", base64: Buffer.alloc(5 * 1024 * 1024 + 1, 65).toString("base64") },
    ])
      await expect(
        call(member, uploadCommerceReceipt, { orderId: order.id, ...data }),
      ).rejects.toThrow();
    expect(
      (
        await sql`SELECT count(*)::int AS count FROM billing.commerce_receipts WHERE order_id=${order.id}`
      )[0].count,
    ).toBe(0);
  });
  it("allows an administrator to attach an actual private object on behalf of the customer", async () => {
    const bytes = receiptBytes(),
      receipt = await upload(admin, bytes);
    expect(Buffer.from((await read(member, receipt.id)).base64, "base64")).toEqual(
      Buffer.from(bytes),
    );
    const rows =
      await sql`SELECT attached_by,user_id FROM billing.commerce_receipts WHERE id=${receipt.id}`;
    expect(rows[0]).toMatchObject({ attached_by: admin.id, user_id: member.id });
  });
  it("activates Pro only after actual administrator confirmation and preserves idempotency over HTTP", async () => {
    await upload(member);
    const data = {
      key: randomUUID(),
      method: "instapay",
      currency: order.currency,
      amount_minor: order.final_minor,
      transaction_reference: randomUUID(),
      received_at: new Date().toISOString(),
      funds_verified: true,
      allocations: [{ order_id: order.id, amount_minor: order.final_minor }],
    };
    const first = await command<{ id: string }>(admin, "confirm", data);
    expect((await command<{ id: string }>(admin, "confirm", data)).id).toBe(first.id);
    const rows =
      await sql`SELECT count(*)::int AS count FROM billing.commerce_entitlements WHERE order_id=${order.id}`;
    expect(rows[0].count).toBe(1);
    expect((await member.client.rpc("get_my_billing_access_tier")).data).toBe("pro");
    const grants =
      await sql`SELECT count(*)::int AS count FROM billing.gateway_customers WHERE user_id=${member.id}`;
    expect(grants[0].count).toBe(0);
  });
  it("rechecks the deletion gate on downloads even with an otherwise valid Auth token", async () => {
    const receipt = await upload(member);
    await sql`INSERT INTO billing.account_deletion_requests (user_id) VALUES (${member.id})`;
    try {
      // The established LC-09 boundary is the durable lifecycle, not a
      // submitted request alone. Exercise both states without a real deletion.
      expect((await read(member, receipt.id)).mime).toBe("application/pdf");
      await sql`INSERT INTO billing.account_deletion_lifecycle
        (user_id,stage,financial_retention_reference,crm_retention_reference,release_reference)
        VALUES (${member.id},'blocked','CI fixture','CI fixture','CI fixture')`;
      await expect(read(member, receipt.id)).rejects.toThrow(/Receipt access denied/);
    } finally {
      await sql`DELETE FROM billing.account_deletion_lifecycle WHERE user_id=${member.id}`;
      await sql`DELETE FROM billing.account_deletion_requests WHERE user_id=${member.id}`;
    }
  });
});
