// Real Auth/PostgREST and product UI against the disposable loopback stack only.
// No payment provider, production data, mail delivery or Kids media is contacted.
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { candidate, localBuildEnvironment, localOrigin, requireValue } from "./local-guards.mjs";
const { repo, head } = candidate();
const origin = localBuildEnvironment();
const base = localOrigin(requireValue("B023_BASE_URL"), "B023_BASE_URL");
assert.notEqual(origin, base);
assert.equal(process.env.PGHOST, "127.0.0.1");
assert.equal(process.env.PGPORT, "54322");
assert.equal(process.env.PGUSER, "postgres");
assert.equal(process.env.PGDATABASE, "postgres");
const service = requireValue("B023_LOCAL_SERVICE_ROLE_KEY");
const anon = requireValue("VITE_SUPABASE_PUBLISHABLE_KEY");
const out = join(requireValue("B023_BROWSER_RECEIPTS_DIR"), "persistence");
mkdirSync(out); // Never overwrite a previous receipt.
const { chromium } = createRequire(join(repo, "package.json"))("playwright");
const locales = ["en", "ar-EG", "ar-MSA", "ar-Gulf"];
const children = [randomUUID(), randomUUID()];
const policy = randomUUID();
const password = `${randomBytes(30).toString("base64url")}aA9!`;
const users = [];
const checks = [];
let browser, page, failure;
const quote = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const sql = (query) =>
  execFileSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-qAt"], {
    input: query,
    encoding: "utf8",
    env: process.env,
  }).trim();
async function request(path, method, data, token = service) {
  const url = new URL(path, origin);
  assert.equal(url.origin, origin);
  const response = await fetch(url, {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(20000),
    headers: {
      apikey: token === service ? service : anon,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const text = await response.text();
  return { status: response.status, ok: response.ok, data: text ? JSON.parse(text) : null };
}
async function rpc(name, data, token) {
  const result = await request(`/rest/v1/rpc/${name}`, "POST", data, token);
  assert.equal(result.ok, true, `${name} HTTP ${result.status}: ${result.data?.code ?? ""}`);
  return result.data;
}
async function newSession(email) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (["http:", "https:"].includes(url.protocol) && ![origin, base].includes(url.origin))
      await route.abort("blockedbyclient");
    else await route.continue();
  });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(`${base}/login?locale=en`);
  await page.locator("input[type=email]").fill(email);
  await page.locator("input[type=password]").fill(password);
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => new URL(r.url()).pathname === "/auth/v1/token" && r.request().method() === "POST",
    ),
    page.locator("form button[type=submit]").click(),
  ]);
  assert.equal(response.ok(), true);
  const session = await response.json(); // Kept in memory, never in receipts or browser storage injection.
  await page.waitForURL((u) => u.pathname === "/my-learning");
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await page.waitForFunction(() => document.cookie.includes("masaarat_access_token="));
  return { context, token: session.access_token, id: session.user.id };
}
async function cards(locale) {
  await page.goto(`${base}/my-learning?locale=${locale}`);
  for (const id of [
    "ai:ai",
    "technical:furniture",
    "academic:AC-BUS",
    ...children.map((id) => `kids:${id}`),
  ])
    await page.locator(`[data-journey-path="${id}"]`).waitFor({ state: "visible", timeout: 45000 });
  assert.equal(await page.locator("main [role=alert]").count(), 0);
  assert.match(await page.locator('[data-journey-path="academic:AC-BUS"]').innerText(), /1 \/ 2/);
  assert.match(
    await page.locator('[data-journey-path="technical:furniture"]').innerText(),
    /1 \/ 80/,
  );
  assert.match(
    await page.locator(`[data-journey-path="kids:${children[0]}"]`).innerText(),
    new RegExp(`${locale === "en" ? 1 : 0} / 3`),
  );
  assert.match(
    await page.locator(`[data-journey-path="kids:${children[1]}"]`).innerText(),
    /0 \/ 3/,
  );
  for (const [size, width, height] of [
    ["desktop", 1365, 900],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
      `${locale}/${size} overflow`,
    );
    await page.screenshot({ path: join(out, `journey-${locale}-${size}.png`), fullPage: true });
  }
  checks.push(`populated-five-cards-${locale}-desktop-mobile`);
}
try {
  for (const kind of ["parent", "other"]) {
    const email = `journey-${kind}-${randomUUID()}@example.test`;
    const result = await request("/auth/v1/admin/users", "POST", {
      email,
      password,
      email_confirm: true,
    });
    assert.equal(result.ok, true);
    const id = result.data.id ?? result.data.user?.id;
    assert.match(id, /^[a-f0-9-]{36}$/);
    users.push({ id, email });
  }
  const user = users[0].id;
  // Fixture grants exercise the real entitlement authority, not a payment transaction.
  sql(`BEGIN;
    UPDATE billing.commerce_control SET access_enabled=true WHERE singleton;
    WITH g AS (INSERT INTO billing.commerce_grants(user_id,package,reason,request_key)
      SELECT '${user}',p,'Disposable journey access fixture','journey-'||gen_random_uuid() FROM unnest(ARRAY['pro_plus','technical','academic','kids']) p RETURNING id,user_id,package)
    INSERT INTO billing.commerce_entitlements(user_id,package,grant_id,starts_at,ends_at)
      SELECT user_id,package,id,now()-interval '1 hour',now()+interval '1 day' FROM g;
    UPDATE public.academic_courses SET enabled=true WHERE id='AC-BUS';
    UPDATE public.kids_release_control SET accepts_child_data=true,lesson_access_enabled=true WHERE singleton;
    UPDATE public.kids_market_release SET accepts_child_data=true,reviewed_at=now(),review_reference='disposable-journey-fixture' WHERE country_code='EG';
    INSERT INTO public.kids_consent_policies(id,country_code,version,locale,notice_text,consent_text,review_reference,enabled)
      VALUES('${policy}','EG','journey-${policy}','en',repeat('Synthetic local privacy fixture. ',4),'Synthetic parent consent fixture.','disposable-journey-fixture',true);
    INSERT INTO public.kids_parent_access_requests(parent_id,parent_email,status,country_code,adult_confirmed)
      VALUES('${user}',${quote(users[0].email)},'approved','EG',true);
    INSERT INTO public.kids_parent_attestations(parent_id,policy_id,country_code) VALUES('${user}','${policy}','EG');
    INSERT INTO public.kids_profiles(id,parent_id,display_name,level_id) VALUES
      ('${children[0]}','${user}','Child A','level-1'),('${children[1]}','${user}','Child B','level-1');
    INSERT INTO public.kids_profile_consents(profile_id,parent_id,policy_id,guardian_reference)
      SELECT id,'${user}','${policy}','synthetic-local-parent' FROM public.kids_profiles WHERE parent_id='${user}';
    INSERT INTO public.kids_content_approvals(level_id,lesson_number,locale,approved_at,approval_reference,approved_sha256)
      SELECT 'level-1',n,l,now(),'disposable-journey-fixture',repeat('0',64) FROM generate_series(1,3) n CROSS JOIN unnest(ARRAY['en','ar-EG','ar-MSA','ar-Gulf']) l;
    INSERT INTO public.technical_progress(user_id,lesson_id,read,quiz_passed,practice_reviewed) VALUES('${user}','M01-L01',true,true,true);
    INSERT INTO public.academic_progress(user_id,course_id,lesson_id,read,quiz_passed,practice_submitted) VALUES('${user}','AC-BUS','AC-BUS-M01-L01',true,true,true);
    COMMIT;`);
  for (const locale of locales) {
    const pilot = JSON.parse(
      readFileSync(join(repo, `experiments/academic/content/${locale}.json`), "utf8"),
    );
    for (const n of [1, 2]) {
      const id = `AC-BUS-M01-L0${n}`;
      const payload = { ...pilot, id, locale };
      sql(`INSERT INTO public.academic_lesson_content(course_id,lesson_id,locale,position,introductory,approved,payload,source_sha256)
        VALUES('AC-BUS','${id}','${locale}',${n},${n === 1},true,${quote(JSON.stringify(payload))}::jsonb,repeat('0',64));`);
      sql(`INSERT INTO public.technical_lesson_content(lesson_id,locale,kind,payload,video_guid,source_sha256)
        VALUES('M01-L0${n}','${locale}','lesson','{}','00000000-0000-4000-8000-000000000001',repeat('0',64));`);
    }
  }
  browser = await chromium.launch({
    executablePath: requireValue("B023_CHROME_EXECUTABLE"),
    headless: true,
  });
  let session = await newSession(users[0].email);
  assert.equal(session.id, user);
  assert.equal(await rpc("has_role", { _user_id: user, _role: "admin" }, session.token), false);
  assert.equal(
    await rpc(
      "academic_can_access",
      { p_course: "AC-BUS", p_lesson: "AC-BUS-M01-L02", p_locale: "en" },
      session.token,
    ),
    true,
  );
  assert.equal(await rpc("technical_can_access", { p_lesson: "M01-L02" }, session.token), true);
  assert.equal(
    await rpc(
      "kids_can_access_lesson",
      {
        requested_profile: children[0],
        requested_level: "level-1",
        requested_lesson: 3,
        requested_locale: "en",
      },
      session.token,
    ),
    true,
  );
  checks.push("ordinary-nonadmin-paid-access-authority");
  // Actual product Academic route must write its own bookmark.
  await Promise.all([
    page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/rest/v1/journey_visits" &&
        r.request().method() === "POST" &&
        r.ok(),
    ),
    page.goto(`${base}/academic/learn/AC-BUS-M01-L02?locale=en`),
  ]);
  assert.equal(
    sql(`SELECT lesson_id FROM public.journey_visits WHERE user_id='${user}' AND line='academic';`),
    "AC-BUS-M01-L02",
  );
  checks.push("academic-authorized-page-records-resume");
  // Real authenticated RPC writes. Kids media is deliberately not stubbed or accepted by this test.
  const completeArgs = { p_profile: children[0], p_level: "level-1", p_lesson: 3, p_locale: "en" };
  assert.equal(await rpc("complete_kids_step", completeArgs, session.token), true);
  assert.equal(await rpc("complete_kids_step", completeArgs, session.token), true);
  for (const [index, child] of children.entries()) {
    const result = await request(
      "/rest/v1/journey_visits",
      "POST",
      {
        user_id: user,
        line: "kids",
        course_id: "level-1",
        subject_id: child,
        profile_id: child,
        lesson_id: String(index + 1),
        locale: "en",
      },
      session.token,
    );
    assert.equal(result.ok, true);
  }
  for (const locale of locales) await cards(locale);
  await page.setViewportSize({ width: 1365, height: 900 });
  await page.goto(`${base}/my-learning?locale=en`);
  const childB = page.locator(`[data-journey-path="kids:${children[1]}"]`);
  await childB.getByRole("link", { name: "Path contents", exact: true }).click();
  assert.equal(
    await page.evaluate((id) => localStorage.getItem(`masaarat:kids:active-profile:${id}`), user),
    children[1],
  );
  checks.push("child-contents-selects-correct-profile");
  await page.goto(`${base}/my-learning?locale=en`);
  await page.getByRole("button", { name: "My account", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForFunction(() => !document.cookie.includes("masaarat_access_token="));
  await session.context.close();
  session = await newSession(users[0].email); // Empty browser context: no cached progress or injected storage.
  await cards("en");
  const visits = await request(
    `/rest/v1/journey_visits?user_id=eq.${user}`,
    "GET",
    undefined,
    session.token,
  );
  assert.equal(visits.ok, true);
  assert.equal(visits.data.length, 3);
  assert.deepEqual(
    (await rpc("kids_journey", { p_profile: children[0], p_locale: "en" }, session.token))
      .completed,
    [3],
  );
  assert.deepEqual(
    (await rpc("kids_journey", { p_profile: children[1], p_locale: "en" }, session.token))
      .completed,
    [],
  );
  assert.match(
    await page.locator('[data-journey-path="academic:AC-BUS"] a').first().getAttribute("href"),
    /AC-BUS-M01-L02/,
  );
  assert.equal(
    sql(`SELECT count(*) FROM public.kids_lesson_progress WHERE profile_id='${children[0]}';`),
    "1",
  );
  checks.push("fresh-login-restores-adult-and-two-child-bookmarks-and-completion");
  await session.context.close();
  const other = await newSession(users[1].email);
  const foreign = await request(
    `/rest/v1/journey_visits?user_id=eq.${user}`,
    "GET",
    undefined,
    other.token,
  );
  assert.deepEqual(foreign.data, []);
  const denied = await request(
    "/rest/v1/rpc/complete_kids_step",
    "POST",
    completeArgs,
    other.token,
  );
  assert.equal(denied.ok, false);
  const leaked = await request(
    "/rest/v1/rpc/kids_journey",
    "POST",
    { p_profile: children[0], p_locale: "en" },
    other.token,
  );
  assert.equal(leaked.ok, false);
  assert.equal(
    sql(`SELECT count(*) FROM public.kids_lesson_progress WHERE profile_id='${children[0]}';`),
    "1",
  );
  checks.push("other-account-cannot-read-or-mutate-child-progress");
} catch (error) {
  failure = error;
  if (page && !page.isClosed()) {
    await page.screenshot({ path: join(out, "failure.png"), fullPage: true }).catch(() => {});
    writeFileSync(
      join(out, "failure-ui.txt"),
      await page
        .locator("main")
        .innerText()
        .catch(() => "unavailable"),
    );
  }
} finally {
  if (browser) await browser.close();
  for (const { id } of users) {
    const result = await request(`/auth/v1/admin/users/${id}`, "DELETE");
    if (!result.ok) failure ??= new Error("Disposable auth cleanup failed");
  }
  if (users.length)
    sql(
      `DELETE FROM billing.commerce_grants WHERE user_id IN (${users.map((u) => quote(u.id)).join(",")});`,
    );
}
const receipt = {
  result: failure ? "FAIL" : "PASS",
  head,
  checks,
  scope:
    "Disposable real Auth/PostgREST + product UI; synthetic grants, two child profiles; no payment transaction or Kids media acceptance",
  error: failure?.message?.replaceAll(password, "[REDACTED]").replaceAll(service, "[REDACTED]"),
};
writeFileSync(join(out, "receipt.json"), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
if (failure) process.exitCode = 1;
