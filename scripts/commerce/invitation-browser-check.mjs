// Real components with synthetic local responses. All external requests are blocked.
import { build } from "esbuild";
import { chromium } from "playwright";
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { emailAccessCopy } from "../../src/lib/commerce/email-access.ts";
import { adminOfferCopy } from "../../src/lib/commerce/admin-offer-copy.ts";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixture = path.join(root, "scripts/commerce/browser-fixture");
const output =
  process.env.COMMERCE_BROWSER_OUTPUT ?? path.join(os.tmpdir(), "masaarat-invitation-browser");
await mkdir(output, { recursive: true });
const styles = (await readdir(path.join(root, ".output/public/assets"))).find(
  (name) => name.startsWith("styles-") && name.endsWith(".css"),
);
if (!styles) throw new Error("Build client first for the shipped stylesheet");
const bundle = await build({
  entryPoints: [path.join(fixture, "preview.tsx")],
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  tsconfig: path.join(root, "tsconfig.json"),
  alias: {
    "@tanstack/react-start/server": path.join(fixture, "server-stub.ts"),
    "@tanstack/react-start": path.join(fixture, "start-stub.ts"),
    "@tanstack/react-router": path.join(fixture, "router-stub.tsx"),
    "@/lib/commerce/commerce.functions": path.join(fixture, "functions-stub.ts"),
    "@/lib/commerce/email-access.functions": path.join(fixture, "access-stub.ts"),
    "@/lib/admin.functions": path.join(fixture, "access-stub.ts"),
    "@/lib/auth-context": path.join(fixture, "access-stub.ts"),
    "@": path.join(root, "src"),
  },
  define: { "import.meta.env": "{}", "process.env.NODE_ENV": '"development"' },
});
const css = await readFile(path.join(root, ".output/public/assets", styles), "utf8");
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><style>${css}</style></head><body><div id="root"></div></body></html>`;
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  ...(process.env.COMMERCE_CHROMIUM_PATH
    ? { executablePath: process.env.COMMERCE_CHROMIUM_PATH }
    : {}),
});
const results = [];
try {
  for (const width of [375, 1280])
    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage(),
        errors = [];
      await context.route("**/*", (route) => route.abort());
      page.on("pageerror", (error) => {
        errors.push(error.message);
        console.error("Fixture page error:", error.message);
      });
      await page.setContent(html);
      // The opaque-origin fixture lacks the secure-context UUID API. Keep the
      // request key synthetic; native UUID behavior is covered by the unit tests.
      await page.evaluate(() => {
        if (typeof crypto.randomUUID !== "function")
          Object.defineProperty(crypto, "randomUUID", {
            value: () => "00000000-0000-4000-8000-000000000099",
          });
      });
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.getByLabel("Locale").selectOption(locale);
      await page.getByRole("button", { name: "email-access", exact: true }).click();
      const w = emailAccessCopy(locale);
      await page.getByRole("button", { name: "registered@example.test", exact: true }).click();
      if (
        (await page.getByLabel(w.email, { exact: true }).inputValue()) !== "registered@example.test"
      )
        throw new Error("Grant email not selected");
      await page.getByLabel(w.invitation, { exact: true }).check();
      const requestedLocale = locale === "en" ? "ar-Gulf" : "en";
      await page.getByLabel(w.invitationLanguage).selectOption(requestedLocale);
      await page.getByRole("button", { name: w.create, exact: true }).click();
      await page.getByRole("status").filter({ hasText: w.saved }).waitFor();
      const sent = await page.evaluate(() => window.accessSubmission);
      if (sent.data.locale !== requestedLocale || sent.data.email !== "registered@example.test")
        throw new Error("Wrong grant parameters");
      const accessOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      await page.screenshot({
        path: path.join(output, `${locale}-${width}-grant.png`),
        fullPage: true,
      });
      await page.getByRole("button", { name: "offers", exact: true }).click();
      await page.getByRole("button", { name: "registered@example.test", exact: true }).click();
      if (
        (await page.getByLabel(adminOfferCopy(locale).emails).inputValue()) !==
        "registered@example.test"
      )
        throw new Error("Offer email not selected");
      const offersOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      await page.screenshot({
        path: path.join(output, `${locale}-${width}-offer.png`),
        fullPage: true,
      });
      results.push({ locale, width, accessOverflow, offersOverflow, errors });
      await context.close();
    }
} finally {
  await browser.close();
}
await writeFile(path.join(output, "results.json"), JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify(results));
if (
  results.some((result) => result.accessOverflow || result.offersOverflow || result.errors.length)
)
  process.exitCode = 1;
