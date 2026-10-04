// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import ts from "typescript";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as mailHandlers from "../../../supabase/functions/account-welcome-job/handler";
import * as streams from "../../../supabase/functions/account-welcome-job/streams";
import * as enabled from "../../../supabase/functions/_shared/contact-mail-enabled";
import * as immediate from "../../../supabase/functions/_shared/immediate-mail-request";
import * as contact from "../../../supabase/functions/_shared/contact-mail-worker";
import * as commerce from "../../../supabase/functions/_shared/commerce-payment-mail-worker";
const send = vi.fn();

const compiled = ts.transpileModule(
  readFileSync("supabase/functions/account-welcome-job/index.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const secret = "existing-scheduler-test-only-token";
let endpoint: (request: Request) => Promise<Response>;
let environment: Record<string, string>;
const rpc = vi.fn();
const createClient = vi.fn(() => ({ rpc }));
const batch = vi.fn();
const call = (authorization = `Bearer ${secret}`, body?: string) =>
  endpoint(
    new Request("https://isolated.test/account-welcome-job", {
      method: "POST",
      headers: { Authorization: authorization },
      body,
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  batch.mockResolvedValue({ completed: 0, deferred: 0 });
  rpc.mockResolvedValue({ data: [], error: null });
  send.mockResolvedValue({ ok: true, emailId: "synthetic-provider-id" });
  environment = {
    ACCOUNT_WELCOME_JOB_SECRET: secret,
    SUPABASE_URL: "https://isolated.test",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-existing-service-key",
    STRIPE_SECRET_KEY: "sk_test_synthetic_only",
    ACCOUNT_DELETION_ENABLED: "true",
    ACCOUNT_FINANCIAL_PURGE_ENABLED: "true",
  };
  new Function("require", "Deno", "exports", compiled)(
    (name: string) => {
      if (name.startsWith("npm:")) return { createClient };
      if (name.endsWith("/handler.ts")) return mailHandlers;
      if (name.endsWith("/streams.ts")) return streams;
      if (name.endsWith("/contact-mail-enabled.ts")) return enabled;
      if (name.endsWith("/immediate-mail-request.ts")) return immediate;
      if (name.endsWith("/contact-mail-worker.ts")) return contact;
      if (name.endsWith("/commerce-payment-mail-worker.ts")) return commerce;
      if (name.endsWith("/resend.ts")) return { sendTransactionalEmail: send };
      if (name.endsWith("/account-lifecycle-worker.ts"))
        return { createAccountLifecycleWorker: () => ({ runBatch: batch }) };
      return {};
    },
    {
      env: { get: (name: string) => environment[name] },
      serve: (fn: typeof endpoint) => {
        endpoint = fn;
      },
    },
    {},
  );
});

describe("packaged lifecycle dependency boundary", () => {
  it("keeps every relative shared dependency inside the platform-packaged shared directory", () => {
    const shared = resolve("supabase/functions/_shared") + sep;
    const seen = new Set<string>();
    const inspect = (file: string) => {
      expect(file.startsWith(shared), "Edge packaging excludes sibling function directories").toBe(
        true,
      );
      if (seen.has(file)) return;
      seen.add(file);
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      for (const statement of source.statements) {
        if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
        const specifier = statement.moduleSpecifier;
        if (!specifier || !ts.isStringLiteral(specifier) || !specifier.text.startsWith("."))
          continue;
        inspect(resolve(dirname(file), specifier.text));
      }
    };
    inspect(resolve("supabase/functions/_shared/account-lifecycle-worker.ts"));
    inspect(resolve("supabase/functions/_shared/account-welcome-worker.ts"));
    inspect(resolve("supabase/functions/_shared/immediate-mail-request.ts"));
    inspect(resolve("supabase/functions/_shared/contact-mail-worker.ts"));
    inspect(resolve("supabase/functions/_shared/commerce-payment-mail-worker.ts"));
  });
});

describe("target-only immediate worker entrypoint", () => {
  const id = "b08ff00f-e77a-4489-925f-8336d814a750";
  const request = (stream: string) => JSON.stringify({ immediate: { stream, id } });
  beforeEach(() => {
    environment.ACCOUNT_WELCOME_ENABLED = "true";
    environment.SUBSCRIPTION_MAIL_ENABLED = "true";
    environment.CONTACT_MAIL_DIRECT_ENABLED = "true";
    environment.RESEND_API_KEY = "synthetic-existing-mail-key";
    environment.RESEND_FROM_EMAIL = "notifications@mail.masaarat.ai";
  });
  it.each([
    ["welcome", "claim_account_welcome_email", "p_user"],
    ["contact", "claim_contact_acknowledgement", "p_id"],
  ])(
    "claims only the requested %s and never unrelated mail or deletion",
    async (stream, name, key) => {
      const response = await call(undefined, request(stream));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ [stream]: { accepted: 0, deferred: 0 } });
      expect(rpc).toHaveBeenCalledExactlyOnceWith(name, { [key]: id });
      expect(batch).not.toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
    },
  );
  it.each([
    ["commerce", "order_id"],
    ["commerce_receipt", "receipt_id"],
  ])(
    "claims only the requested %s without running deletion or unrelated mail",
    async (stream, key) => {
      const response = await call(undefined, request(stream));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ [stream]: { accepted: 0, deferred: 0 } });
      expect(rpc).toHaveBeenCalledExactlyOnceWith("commerce_payment_mail", {
        p_action: "claim",
        p_data: { [key]: id },
      });
      expect(batch).not.toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
      rpc.mockClear();
      environment.SUBSCRIPTION_MAIL_ENABLED = "false";
      expect(await (await call(undefined, request(stream))).json()).toEqual({ enabled: false });
      expect(rpc).not.toHaveBeenCalled();
    },
  );
  it("sends frozen contact content through the same Edge transport and records its lease", async () => {
    rpc.mockImplementation(async (name) => ({
      error: null,
      data:
        name === "claim_contact_acknowledgement"
          ? [
              {
                id,
                claim_token: "lease",
                recipient: "visitor@example.test",
                sender: "info@mail.masaarat.ai",
                subject: "Frozen",
                text_body: "Saved text",
                html_body: "Saved html",
              },
            ]
          : true,
    }));
    expect(await (await call(undefined, request("contact"))).json()).toEqual({
      contact: { accepted: 1, deferred: 0 },
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "info@mail.masaarat.ai", enabled: true }),
      expect.objectContaining({ subject: "Frozen", idempotencyKey: `contact-ack-v1/${id}` }),
    );
    expect(rpc).toHaveBeenLastCalledWith("complete_contact_acknowledgement", {
      p_id: id,
      p_claim: "lease",
      p_email_id: "synthetic-provider-id",
      p_block: false,
    });
    expect(batch).not.toHaveBeenCalled();
  });
  it.each([
    request("lifecycle"),
    request("subscription"),
    '{"immediate":{}}',
    '{"immediate":null}',
    '{"immediate":{"stream":"welcome","id":"not-a-uuid"}}',
    '{"immediate":{},"padding":"' + "x".repeat(4096) + '"}',
    "invalid-json",
  ])("rejects malformed scope before any database access", async (body) => {
    expect((await call(undefined, body)).status).toBe(400);
    expect(createClient).not.toHaveBeenCalled();
    expect(batch).not.toHaveBeenCalled();
  });
  it("rejects browser credentials before parsing an immediate request", async () => {
    expect((await call("Bearer browser-jwt", "invalid-json")).status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
  });
  it("does not substitute lifecycle or other mail when the requested stream is disabled", async () => {
    environment.ACCOUNT_WELCOME_ENABLED = "false";
    expect(await (await call(undefined, request("welcome"))).json()).toEqual({ enabled: false });
    expect(rpc).not.toHaveBeenCalled();
    expect(batch).not.toHaveBeenCalled();
  });
  it("preserves legacy cron JSON as a batch request", async () => {
    expect((await call(undefined, JSON.stringify({ source: "cron" }))).status).toBe(200);
    expect(batch).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls.map((c) => c[0])).toContain("claim_account_welcome_emails_v2");
  });
});

describe("lifecycle through the existing protected scheduled entrypoint", () => {
  it("runs enabled lifecycle without a new lifecycle token, Vault binding or Resend key", async () => {
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ lifecycle: { completed: 0, deferred: 0 } });
    expect(batch).toHaveBeenCalledExactlyOnceWith({
      deletionEnabled: true,
      financialEnabled: true,
    });
  });
  it("rejects browser JWTs and missing credentials before any database access", async () => {
    expect((await call("Bearer browser-jwt")).status).toBe(401);
    delete environment.ACCOUNT_WELCOME_JOB_SECRET;
    expect((await call()).status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
    expect(batch).not.toHaveBeenCalled();
  });
  it("keeps account and financial switches separate", async () => {
    environment.ACCOUNT_DELETION_ENABLED = "false";
    expect((await call()).status).toBe(200);
    expect(batch).toHaveBeenCalledExactlyOnceWith({
      deletionEnabled: false,
      financialEnabled: true,
    });
    batch.mockClear();
    environment.ACCOUNT_FINANCIAL_PURGE_ENABLED = "false";
    expect(await (await call()).json()).toEqual({ enabled: false });
    expect(batch).not.toHaveBeenCalled();
  });
  it("keeps lifecycle running if an enabled mail stream is unconfigured", async () => {
    environment.ACCOUNT_WELCOME_ENABLED = "true";
    const response = await call();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      welcome: { error: "mail_stream_failed" },
      lifecycle: { completed: 0, deferred: 0 },
    });
    expect(batch).toHaveBeenCalledTimes(1);
  });
  it.each([undefined, "sk_live_synthetic_only"])(
    "blocks invalid Stripe credentials without preventing mail: %s",
    async (stripeKey) => {
      if (stripeKey) environment.STRIPE_SECRET_KEY = stripeKey;
      else delete environment.STRIPE_SECRET_KEY;
      environment.ACCOUNT_WELCOME_ENABLED = "true";
      environment.RESEND_API_KEY = "synthetic-existing-mail-key";
      environment.RESEND_FROM_EMAIL = "hello@example.test";
      const response = await call();
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({
        welcome: { accepted: 0, deferred: 0 },
        lifecycle: { error: "mail_stream_failed" },
      });
      expect(batch).not.toHaveBeenCalled();
    },
  );
});
