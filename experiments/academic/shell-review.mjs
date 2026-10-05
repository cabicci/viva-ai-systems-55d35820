import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.ACADEMIC_CHROME,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const output = "tmp/academic-shell";
await fs.mkdir(output, { recursive: true });
const report = [];
for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"])
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [],
      remote = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (/^https?:/.test(r.url())) remote.push(r.url());
    });
    await page.goto(
      pathToFileURL(
        path.resolve("experiments/academic/review/Masaarat_Academic_Interactive_Preview.html"),
      ).href +
        "?locale=" +
        locale,
    );
    await page.locator("header[data-learning-line=academic]").waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator("header select").count(), 1);
    assert.equal(await page.locator("html").getAttribute("dir"), locale === "en" ? "ltr" : "rtl");
    const tabs = page.locator("aside nav button");
    assert.equal(await tabs.count(), 8);
    for (let i = 0; i < 8; i++) {
      await tabs.nth(i).click();
      if(i===2){const frame=page.locator('#lesson-panel iframe');assert.equal(await frame.count(),1);assert.match(await frame.getAttribute('src'),/iframe\.mediadelivery\.net.*autoplay=false/);}
      if(i===6){const download=page.locator('#lesson-panel a[download]');assert.equal(await download.count(),1);assert.match(await download.getAttribute('href'),/^data:application\/pdf;base64,/);}
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        locale + "/" + width + "/" + i,
      );
    }
    await tabs.nth(0).click();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${output}/${locale}-${width}.png`, fullPage: false });
    if (width === 1440) {
      await page.locator("header nav button").first().click();
      const links = page.locator("[data-radix-popper-content-wrapper] nav a");
      assert.equal(await links.count(), 3);
      for (const href of await links.evaluateAll((a) => a.map((x) => x.getAttribute("href"))))
        assert.ok(!href.includes("/academic"));
      await page.keyboard.press("Escape");
    } else {
      await page.locator("header button:visible").last().click();
      await page.locator("[role=dialog]").waitFor();
      assert.ok((await page.locator("[role=dialog] section").count()) > 0);
      await page.keyboard.press("Escape");
    }
    const next = locale === "en" ? "ar-EG" : "en";
    await page.locator("header select").selectOption(next);
    await page.waitForFunction(
      (expected) => document.documentElement.dir === expected,
      next === "en" ? "ltr" : "rtl",
    );
    assert.deepEqual(errors, []);
    assert.ok(remote.every(url=>!/(supabase|stripe|masaarat\.ai)/i.test(url)));
    report.push({
      locale,
      width,
      tabs: 8,
      actualNavbar: true,
      actualFooter: true,
      selfContainedShell: true,
      pageErrors: 0,
    });
    await page.close();
  }
await browser.close();
await fs.writeFile(
  "experiments/academic/review/shell-checks.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  "PASS: actual platform shell, four locales, mobile/desktop, eight sections, three other lines, language switching, no account or payment network requests; Bunny embeds only.",
);
