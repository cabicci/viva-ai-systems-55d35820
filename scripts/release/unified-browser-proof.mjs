import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const evidence = process.env.UNIFIED_BROWSER_EVIDENCE;
if (!evidence || !path.isAbsolute(evidence)) throw Error("Absolute owned evidence directory required");
mkdirSync(evidence, { recursive: true });
const fixture = path.resolve("tests/unified-browser/context-fixture.tsx");
const ports = { name: "explicit-unified-browser-fixtures", enforce: "pre", resolveId(id) {
  const name = id.replaceAll("\\", "/").replace(/\.tsx?$/, "");
  if (["/lib/auth-context", "/lib/learner-context", "/lib/locale/locale-context", "/integrations/supabase/client"].some(suffix => name.endsWith(suffix))) return fixture;
  if (name.endsWith("/AcademicAssistantPanel") || name.endsWith("/CardPathAssistant")) return "\0unused-native-branch";
}, load(id) {
  if (id === "\0unused-native-branch") return "export const AcademicAssistantPanel=()=>null;export const CardPathAssistant=()=>null;";
} };
const result = { scope: "Actual AI CourseLessonAssistant -> floating launcher -> AssistantPanel -> common conversation -> guarded SDK helper. Real project CSS/labels/history. Fixture auth/context/SDK answers; unused native branch imports stubbed. No native host/JWT/provider/DB proof.",
  providerCalls: 0, cases: [], errors: [], externalRequestsBlocked: [] };
const server = await createServer({ configFile: false, root: process.cwd(), publicDir: false,
  envDir: path.resolve("tests/unified-browser"), cacheDir: path.join(evidence, "vite-cache"),
  resolve: { alias: { "@": path.resolve("src") } }, plugins: [ports, react(), tailwind()],
  optimizeDeps: { entries: ["tests/unified-browser/assistant-proof.html"], noDiscovery: true,
    include: ["react", "react-dom/client", "lucide-react", "clsx", "tailwind-merge"] },
  server: { host: "127.0.0.1", port: 0 } });
let browser;
try {
  await server.listen(); const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    const context = await browser.newContext({ viewport }), page = await context.newPage();
    page.on("pageerror", error => result.errors.push(error.message));
    await page.route("**/*", route => route.request().url().startsWith(origin) ? route.continue() :
      (result.externalRequestsBlocked.push(route.request().url()), route.abort()));
    const rtl = viewport.width === 390;
    await page.goto(origin + "/tests/unified-browser/assistant-proof.html");
    await page.locator("#actor-switch").waitFor();
    if (rtl) await page.locator("#locale-switch").click();
    const fab = page.locator('[aria-haspopup="dialog"]');
    await fab.waitFor({ state: "visible" });
    await page.waitForFunction(() => { const element = document.querySelector('[aria-haspopup="dialog"]'); return element && getComputedStyle(element).opacity !== "0"; });
    const box = await fab.boundingBox(), essential = await page.locator("#continue").boundingBox();
    assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height);
    assert(!(box.x < essential.x + essential.width && box.x + box.width > essential.x && box.y < essential.y + essential.height && box.y + box.height > essential.y));
    await fab.focus(); await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog"); await dialog.waitFor();
    assert.equal(await dialog.getAttribute("dir"), rtl ? "rtl" : "ltr");
    assert(await dialog.evaluate(element => element === document.activeElement));
    await dialog.getByRole("textbox").fill("Explicit browser fixture question");
    const start = performance.now(); await dialog.locator('button[type="submit"]').click();
    await dialog.getByText("Owned browser explanation", { exact: true }).waitFor();
    const fixtureTurnMs = performance.now() - start;
    assert.equal(await dialog.getByRole("link", { name: /Fixture source/ }).getAttribute("href"), `/learn/intro/fixture-source?locale=${rtl ? "ar-EG" : "en"}`);
    await page.screenshot({ path: path.join(evidence, `unified-${viewport.width}-answer.png`), fullPage: true });
    await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" });
    assert(await fab.evaluate(element => element === document.activeElement));
    await page.reload(); await page.locator("#actor-switch").waitFor();
    if (rtl) await page.locator("#locale-switch").click();
    await fab.click(); await dialog.waitFor();
    await dialog.getByText("Owned browser explanation", { exact: true }).waitFor();
    await page.keyboard.press("Escape"); await page.locator("#actor-switch").click();
    await fab.click(); await dialog.waitFor();
    assert.equal(await dialog.getByText("Owned browser explanation", { exact: true }).count(), 0);
    await dialog.getByRole("textbox").fill("Unsaved fixture draft");
    await page.keyboard.press("Escape"); await page.locator("#lesson-switch").click();
    await fab.click(); await dialog.waitFor(); assert.equal(await dialog.getByRole("textbox").inputValue(), "");
    await page.keyboard.press("Escape"); await page.locator("#deny").click(); await fab.click();
    await dialog.getByRole("textbox").fill("Denied fixture question"); await dialog.locator('button[type="submit"]').click();
    await dialog.getByRole("alert").waitFor();
    assert.equal(await dialog.getByText("Owned browser explanation", { exact: true }).count(), 0);
    await page.screenshot({ path: path.join(evidence, `unified-${viewport.width}-denied.png`), fullPage: true });
    result.cases.push({ viewport, rtl, keyboardFocusAndEscape: true, essentialControlUnobstructed: true,
      actualCitationLink: true, deviceHistoryReload: true, actorHistoryIsolation: true, lessonDraftRetired: true,
      quotaDenialContained: true, fixtureTurnMs, timingBoundary: "local synthetic SDK60ms; not model latency" });
    await context.close();
  }
  assert.equal(result.errors.length, 0); result.status = "passed";
} catch (error) { result.status = "failed"; result.error = String(error); throw error; }
finally {
  writeFileSync(path.join(evidence, `BROWSER-RESULT-${Date.now()}.json`), JSON.stringify(result, null, 2));
  await browser?.close(); await server.close();
}
