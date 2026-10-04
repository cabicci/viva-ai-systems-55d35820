// Isolated real components and local synthetic RPCs. Every external request is blocked.
import { build } from "esbuild";
import { chromium } from "playwright";
import { commerceCopy } from "../../src/lib/commerce/copy.ts";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixture = path.join(repo, "scripts/commerce/browser-fixture");
const output = process.env.COMMERCE_BROWSER_OUTPUT ?? path.join(repo, "docs/commerce/evidence");
await mkdir(output, { recursive: true });
const css = (await readdir(path.join(repo, ".output/public/assets"))).find(
  (f) => f.startsWith("styles-") && f.endsWith(".css"),
);
if (!css) throw new Error("Build first to use the shipped stylesheet");
const bundled = await build({
  entryPoints: [path.join(fixture, "preview.tsx")],
  bundle: true,
  write: false,
  format: "esm",
  jsx: "automatic",
  tsconfig: path.join(repo, "tsconfig.json"),
  alias: {
    "@tanstack/react-start/server": path.join(fixture, "server-stub.ts"),
    "@tanstack/react-start": path.join(fixture, "start-stub.ts"),
    "@tanstack/react-router": path.join(fixture, "router-stub.tsx"),
    "@/lib/commerce/commerce.functions": path.join(fixture, "functions-stub.ts"),
    "@": path.join(repo, "src"),
  },
  define: { "import.meta.env": "{}", "process.env.NODE_ENV": '"development"' },
});
const files = {
  "index.html": await readFile(path.join(fixture, "index.html")),
  "app.js": Buffer.from(bundled.outputFiles[0].contents),
  "styles.css": await readFile(path.join(repo, ".output/public/assets", css)),
};
const browser = await chromium.launch({
  headless: true,
  ...(process.env.COMMERCE_CHROMIUM_PATH
    ? { executablePath: process.env.COMMERCE_CHROMIUM_PATH }
    : {}),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const results = [];
try {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 1280, height: 900 },
  ])
    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"]) {
      const context = await browser.newContext({ viewport }),
        page = await context.newPage(),
        errors = [];
      await context.route("**/*", (route) => route.abort());
      await page.route("http://127.0.0.1:4181/**", async (route) => {
        const name = new URL(route.request().url()).pathname.slice(1) || "index.html";
        if (!(name in files)) return route.abort();
        await route.fulfill({
          body: files[name],
          contentType: name.endsWith(".js")
            ? "text/javascript"
            : name.endsWith(".css")
              ? "text/css"
              : "text/html",
        });
      });
      page.on("pageerror", (err) => errors.push(err.message));
      await page.goto("http://127.0.0.1:4181");
      await page.getByLabel("Locale").selectOption(locale);
      const w = commerceCopy(locale);
      await page.getByRole("combobox", { name: w.methods }).selectOption("instapay");
      await page.getByRole("button", { name: w.quote, exact: true }).click();
      await page.getByRole("button", { name: w.continue, exact: true }).click();
      await page.getByText("SYNTHETIC-ORDER", { exact: true }).waitFor();
      const paymentOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      await page.getByRole("button", { name: "groups", exact: true }).click();
      await page
        .getByRole("combobox", { name: w.groupName })
        .selectOption("00000000-0000-4000-8000-000000000001");
      await page.getByLabel(w.paste).fill("member@example.test\nother@example.test");
      await page.getByRole("button", { name: w.preview, exact: true }).first().click();
      await page.getByRole("button", { name: w.preview, exact: true }).last().click();
      await page.getByRole("button", { name: w.quote, exact: true }).click();
      if (await page.getByRole("button", { name: new RegExp(w.import) }).isDisabled())
        throw new Error("Commit unavailable after validation");
      const groupOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      await page.screenshot({
        path: path.join(output, `${locale}-${viewport.width}-groups.png`),
        fullPage: true,
      });
      await page.getByRole("button", { name: "review", exact: true }).click();
      await page
        .getByRole("combobox", { name: w.allocateExisting })
        .selectOption("00000000-0000-4000-8000-000000000005");
      await page.getByRole("checkbox", { name: /SYNTHETIC-REVIEW/ }).check();
      await page.getByRole("checkbox", { name: w.funds, exact: true }).first().check();
      const paymentForm = page
        .locator("form")
        .filter({ has: page.getByRole("combobox", { name: w.allocateExisting }) });
      if (await paymentForm.getByLabel(w.transaction, { exact: true }).count())
        throw new Error("Already confirmed funds require another payment reference");
      await page.getByRole("button", { name: w.allocateExisting, exact: true }).click();
      if ((await page.evaluate(() => window.reviewActions?.[0])) !== "allocate")
        throw new Error("Allocation recorded as a new payment");
      const reviewOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      await page.screenshot({
        path: path.join(output, `${locale}-${viewport.width}-review.png`),
        fullPage: true,
      });
      results.push({
        locale,
        width: viewport.width,
        paymentOverflow,
        groupOverflow,
        reviewOverflow,
        errors,
      });
      await context.close();
    }
} finally {
  await browser.close();
}
await writeFile(path.join(output, "browser-results.json"), JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify(results));
if (
  results.some((r) => r.paymentOverflow || r.groupOverflow || r.reviewOverflow || r.errors.length)
)
  process.exitCode = 1;
