// DRAFT. Creates and removes one fresh disposable LOCAL auth user; never edits product code.
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { candidate, localBuildEnvironment, localOrigin, requireValue, sha256File } from "./local-guards.mjs";

const GATE_SHA = "adc7d2add0d0951a7349300144ce2b4aa7b4ef9a5c3c6c7e1b5cc474932a8c49";
const { repo, head } = candidate();
const localSupabase = localBuildEnvironment();
const base = localOrigin(requireValue("B023_BASE_URL"), "B023_BASE_URL");
if (base === localSupabase) throw new Error("Preview and Supabase must be separate origins");
const serviceKey = requireValue("B023_LOCAL_SERVICE_ROLE_KEY");
const gatePath = resolve(requireValue("B023_FROZEN_GATE_PATH"));
if (sha256File(gatePath) !== GATE_SHA) throw new Error("Frozen browser gate digest mismatch");
const buildReceipt = JSON.parse(readFileSync(requireValue("B023_BUILD_GRAPH_RECEIPT"), "utf8"));
if (buildReceipt.result !== "PASS" || buildReceipt.head !== head || buildReceipt.localSupabaseOrigin !== localSupabase) {
  throw new Error("Successful matching local build/module-graph receipt required");
}
const manifest = join(repo, "src/lib/lesson-visuals/contextual-v2/runtime/contextualV2BrowserManifest.json");
if (sha256File(manifest) !== buildReceipt.browserManifestSha256) throw new Error("Built manifest identity changed");
const out = resolve(requireValue("B023_BROWSER_RECEIPTS_DIR"));
const rel = relative(repo, out);
if (!(rel === ".." || rel.startsWith("../") || rel.startsWith("..\\") || isAbsolute(rel))) {
  throw new Error("Receipts and credentials must be outside the checkout");
}
mkdirSync(dirname(out), { recursive: true });
mkdirSync(out); // Exclusive fresh directory: never overwrite an earlier fixture or session.
const statePath = join(out, "local-auth-storage.json");
const fixtureId = `b023-local-admin-${randomUUID()}`;
const email = `${fixtureId}@example.test`;
const password = `${randomBytes(30).toString("base64url")}aA9!`;
const requireRepo = createRequire(join(repo, "package.json"));
const { chromium } = requireRepo("playwright");
let userId;
let browser;
let gateResult;
let failure;
let cleanupError;
const blocked = new Set();
const redact = (value) => typeof value === "string"
  ? value.split(serviceKey).join("[REDACTED]").split(password).join("[REDACTED]")
  : value;

async function localAdminRequest(path, method, payload) {
  const url = new URL(path, localSupabase);
  if (url.origin !== localSupabase) throw new Error("Admin request left local origin");
  const response = await fetch(url, {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Local fixture operation ${method} ${url.pathname} failed (HTTP ${response.status})`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function grantLocalAdminRole() {
  if (process.env.PGHOST !== "127.0.0.1" || process.env.PGPORT !== "54322" ||
      process.env.PGUSER !== "postgres" || process.env.PGDATABASE !== "postgres") {
    throw new Error("Exact disposable local PostgreSQL connection required");
  }
  const result = execFileSync("psql", [
    "-v", "ON_ERROR_STOP=1", "-v", `fixture_user_id=${userId}`, "-At", "-c",
    "INSERT INTO public.user_roles (user_id, role) VALUES (:'fixture_user_id'::uuid, 'admin') RETURNING user_id::text || E'\\t' || role::text;",
  ], { encoding: "utf8", env: process.env }).trim();
  if (result !== `${userId}\tadmin`) throw new Error("Local admin grant readback mismatch");
}

function runFrozenGate(env) {
  return new Promise((resolveGate, reject) => {
    const child = spawn(process.execPath, [gatePath], { cwd: repo, env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const deadline = setTimeout(() => { timedOut = true; child.kill(); }, 180_000);
    child.stdout.on("data", (chunk) => { stdout += chunk; if (stdout.length > 8_000_000) child.kill(); });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => { clearTimeout(deadline); reject(error); });
    child.on("close", (code) => {
      clearTimeout(deadline);
      // Gate output contains only test diagnostics; additionally redact temporary credentials.
      const safeError = redact(stderr);
      writeFileSync(join(out, "gate.stderr.log"), safeError);
      if (timedOut) return reject(new Error("Frozen browser gate exceeded 180 seconds"));
      if (code !== 0) return reject(new Error(`Frozen browser gate failed (exit ${code}); inspect local sanitized diagnostics`));
      try {
        const result = JSON.parse(stdout);
        if (result.result !== "PASS" || result.candidateGitHead !== head || result.totals?.cases !== 16 ||
          result.gateScriptSha256 !== GATE_SHA || result.browserManifestSha256 !== buildReceipt.browserManifestSha256) {
          throw new Error("Frozen gate receipt identity/count mismatch");
        }
        writeFileSync(join(out, "browser-network-gate.json"), `${JSON.stringify(result, null, 2)}\n`);
        resolveGate(result);
      } catch (error) { reject(error); }
    });
  });
}

try {
  const created = await localAdminRequest("/auth/v1/admin/users", "POST", {
    email, password, email_confirm: true,
    user_metadata: { b023_disposable_fixture: fixtureId },
  });
  userId = created?.id ?? created?.user?.id;
  if (!/^[a-f0-9-]{36}$/i.test(userId || "")) throw new Error("Local Auth did not return a fixture user UUID");
  // Runtime authority remains public.user_roles + has_role. The fixture grant uses
  // the exact loopback database because PostgREST has no service-role table grant.
  grantLocalAdminRole();
  const options = { headless: true };
  if (process.env.B023_CHROME_EXECUTABLE) options.executablePath = process.env.B023_CHROME_EXECUTABLE;
  else options.channel = process.env.B023_BROWSER_CHANNEL || "chrome";
  browser = await chromium.launch(options);
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (["http:", "https:"].includes(url.protocol) && ![base, localSupabase].includes(url.origin)) {
      blocked.add(url.origin);
      await route.abort("blockedbyclient");
    } else await route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25_000);
  await page.goto(`${base}/login?locale=en`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  const [tokenResponse, adminResponse] = await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.origin === localSupabase && url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password";
    }),
    page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.origin === localSupabase && url.pathname === "/rest/v1/rpc/has_role";
    }),
    page.locator('form button[type="submit"]').click(),
  ]);
  if (!tokenResponse.ok() || (await tokenResponse.json()).user?.id !== userId) throw new Error("Normal UI login did not authenticate the exact local fixture");
  if (!adminResponse.ok() || (await adminResponse.json()) !== true) throw new Error("Real browser has_role did not confirm local admin authority");
  await page.waitForURL((url) => url.origin === base && url.pathname === "/dashboard");
  // Capture only state produced by normal UI login; never inject a token or edit storage.
  await context.storageState({ path: statePath });
  await browser.close();
  browser = undefined;
  candidate();
  const childEnv = { ...process.env, B023_AUTH_STORAGE_STATE: statePath, B023_DISPOSABLE_FIXTURE_ID: fixtureId };
  delete childEnv.B023_LOCAL_SERVICE_ROLE_KEY;
  gateResult = await runFrozenGate(childEnv);
} catch (error) {
  failure = error;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (userId) {
    try { await localAdminRequest(`/auth/v1/admin/users/${userId}`, "DELETE"); }
    catch (error) { cleanupError = error; }
  }
  rmSync(statePath, { force: true });
}
const receipt = {
  result: !failure && !cleanupError ? "PASS" : "FAIL",
  head, localSupabaseOrigin: localSupabase, baseOrigin: base, fixtureId,
  authMethod: "normal login form → password token endpoint → dashboard has_role",
  authority: "public.user_roles(role=admin) via exact disposable local PostgreSQL fixture insert",
  fixtureDeleted: Boolean(userId) && !cleanupError,
  credentialFileRemoved: true,
  blockedExternalOrigins: [...blocked].sort(),
  cases: gateResult?.totals?.cases ?? 0,
  error: redact(failure?.message),
  cleanupError: redact(cleanupError?.message),
};
writeFileSync(join(out, "fixture-and-gate-receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
if (failure || cleanupError) process.exitCode = 1;
