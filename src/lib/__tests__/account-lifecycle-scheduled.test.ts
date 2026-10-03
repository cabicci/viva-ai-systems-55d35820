// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import ts from "typescript";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as mailHandlers from "../../../supabase/functions/account-welcome-job/handler";
import * as streams from "../../../supabase/functions/account-welcome-job/streams";
import * as enabled from "../../../supabase/functions/_shared/contact-mail-enabled";

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
const call = (authorization = `Bearer ${secret}`) =>
  endpoint(
    new Request("https://isolated.test/account-welcome-job", {
      method: "POST",
      headers: { Authorization: authorization },
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  batch.mockResolvedValue({ completed: 0, deferred: 0 });
  rpc.mockResolvedValue({ data: [], error: null });
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
