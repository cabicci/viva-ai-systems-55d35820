// Real UI components, synthetic Auth/Verify only. Block every external request.
import { build } from "esbuild";
import { chromium } from "playwright";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixture = path.join(repo, "scripts/communications/browser-fixture");
const css = (await readdir(path.join(repo, ".output/public/assets"))).find(
  (f) => f.startsWith("styles-") && f.endsWith(".css"),
);
if (!css) throw new Error("Build first to use shipped CSS");
const bundled = await build({
  entryPoints: [path.join(fixture, "preview.tsx")],
  bundle: true,
  write: false,
  format: "esm",
  jsx: "automatic",
  tsconfig: path.join(repo, "tsconfig.json"),
  alias: {
    "@tanstack/react-start/server": path.join(
      repo,
      "scripts/commerce/browser-fixture/server-stub.ts",
    ),
    "@tanstack/react-start": path.join(repo, "scripts/commerce/browser-fixture/start-stub.ts"),
    "@tanstack/react-router": path.join(fixture, "router-stub.ts"),
    "@/lib/communications/phone.functions": path.join(fixture, "functions-stub.ts"),
    "@/lib/auth-context": path.join(fixture, "auth-stub.ts"),
    "@/integrations/supabase/client": path.join(fixture, "auth-stub.ts"),
    sonner: path.join(fixture, "auth-stub.ts"),
    "@/components/auth/AuthShell": path.join(fixture, "shell-stub.tsx"),
    "@/lib/locale/resolve-route-head-locale": path.join(fixture, "head-stub.ts"),
    "@": path.join(repo, "src"),
  },
  define: { "import.meta.env": "{}", "process.env.NODE_ENV": '"development"' },
});
const files = {
  "index.html": await readFile(path.join(fixture, "index.html")),
  "app.js": Buffer.from(bundled.outputFiles[0].contents),
  "styles.css": await readFile(path.join(repo, ".output/public/assets", css)),
};
if (process.argv.includes("--bundle-only")) {
  console.log("Isolated browser fixture bundles successfully");
  process.exit(0);
}
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const results = [];
const requireTrue = (value, message) => {
  if (!value) throw new Error(message);
};
try {
  for (const width of [375, 1280])
    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"])
      for (const channel of ["whatsapp", "sms"]) {
        const context = await browser.newContext({ viewport: { width, height: 900 } }),
          page = await context.newPage(),
          errors = [];
        await context.route("**/*", (route) => route.abort());
        await page.route("http://127.0.0.1:4183/**", async (route) => {
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
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto("http://127.0.0.1:4183");
        await page.getByLabel("Locale").selectOption(locale);
        await page.locator("#signup-full-name").fill("Synthetic Name");
        await page.locator('input[type="email"]').fill("synthetic@example.test");
        const password = page.locator("#signup-password"),
          confirmation = page.locator("#signup-password-confirm");
        await password.fill("SyntheticPassword");
        await confirmation.fill("DifferentPassword");
        const eye = page.locator('button[aria-controls="signup-password"]');
        await eye.click();
        requireTrue(
          (await password.getAttribute("type")) === "text",
          "Eye did not reveal password",
        );
        requireTrue(
          (await confirmation.getAttribute("type")) === "password",
          "Eye changed another field",
        );
        const fits = await eye.evaluate((el) => {
          const b = el.getBoundingClientRect(),
            svg = el.querySelector("svg").getBoundingClientRect(),
            input = el.parentElement.querySelector("input").getBoundingClientRect();
          return (
            b.width >= 36 &&
            b.height >= 36 &&
            svg.left >= b.left &&
            svg.right <= b.right &&
            svg.top >= b.top &&
            svg.bottom <= b.bottom &&
            b.left >= input.left &&
            b.right <= input.right
          );
        });
        requireTrue(fits, "Eye is clipped or too small");
        await eye.click();
        requireTrue(
          (await password.getAttribute("type")) === "password",
          "Eye did not hide password",
        );
        await page.locator('form button[type="submit"]').click();
        requireTrue(
          await page.evaluate(
            () => window.phoneTest.signups.length === 0 && window.phoneTest.errors.length === 1,
          ),
          "Mismatch reached Auth",
        );
        await confirmation.fill("SyntheticPassword");
        await page.locator('form button[type="submit"]').click();
        await page.waitForFunction(() => window.phoneTest.signups.length === 1);
        requireTrue(
          await page.evaluate(() => !("confirmPassword" in window.phoneTest.signups[0])),
          "Confirmation sent to Auth",
        );
        const phone = page.locator("section").last();
        await phone.locator('input[type="radio"][value="whatsapp"]').waitFor();
        requireTrue(
          await phone.locator('input[value="whatsapp"]').isChecked(),
          "WhatsApp is not preferred",
        );
        if (channel === "sms") await phone.locator('input[value="sms"]').check();
        await phone.locator('input[type="tel"]').fill("+201012345678");
        await phone.getByRole("button").click();
        await phone.locator('input[autocomplete="one-time-code"]').waitFor();
        requireTrue(
          await page.evaluate(
            (c) =>
              window.phoneTest.sends.length === 1 && window.phoneTest.sends[0].data.channel === c,
            channel,
          ),
          "Wrong or duplicate channel send",
        );
        requireTrue(
          await phone.locator('input[value="whatsapp"]').isDisabled(),
          "Active attempt channel is unlocked",
        );
        const code = phone.locator('input[autocomplete="one-time-code"]');
        await code.fill("123456");
        await phone.getByRole("button").click();
        await phone.getByRole("alert").waitFor();
        requireTrue((await code.inputValue()) === "", "OTP retained after request");
        requireTrue(
          await page.evaluate(() => window.phoneTest.phone === null),
          "Incorrect code granted ownership",
        );
        await code.fill("654321");
        await phone.getByRole("button").click();
        await phone.locator("bdi").waitFor();
        requireTrue(
          (await phone.locator("bdi").textContent()) === "+201012345678",
          "Approved number not shown",
        );
        requireTrue(
          await page.evaluate(() => window.phoneTest.sends.length === 1),
          "Verification sent again",
        );
        requireTrue(
          (await phone.getAttribute("dir")) === (locale === "en" ? "ltr" : "rtl"),
          "Wrong direction",
        );
        requireTrue(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          "Horizontal overflow",
        );
        requireTrue(errors.length === 0, `Browser errors: ${errors.join(", ")}`);
        results.push({ locale, width, channel, passed: true });
        await context.close();
      }
} finally {
  await browser.close();
}
console.log(JSON.stringify(results));
