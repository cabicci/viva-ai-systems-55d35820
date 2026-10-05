import { chromium } from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const output = "experiments/academic/review";
await fs.mkdir(`${output}/pdf`, { recursive: true });
await fs.mkdir("tmp/academic-qa", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.ACADEMIC_CHROME,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const report = [];
for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"]) {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${process.env.ACADEMIC_REVIEW_URL || "http://127.0.0.1:4178/"}?locale=${locale}`);
    await page.locator("aside nav button").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator("html").getAttribute("dir"), locale === "en" ? "ltr" : "rtl");
    const buttons = page.locator("aside nav button");
    assert.equal(await buttons.count(), 8);
    for (let i = 0; i < 8; i++) {
      await buttons.nth(i).click();
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${locale}/${width}/tab${i} overflow`,
      );
      if (i === 0) assert.equal(await page.locator("#lesson-panel article").count(), 6);
      if (i === 3) {
        assert.equal(await page.locator("#lesson-panel input[type=radio]").count(), 18);
        await page
          .locator("#lesson-panel fieldset")
          .evaluateAll((items) => items.forEach((item) => item.querySelector("input")?.click()));
        await page.locator("#lesson-panel button").click();
        assert.ok(await page.locator("[role=status]").count());
      }
    }
    await buttons.nth(0).click();
    await page.screenshot({ path: `tmp/academic-qa/${locale}-${width}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    report.push({ locale, width, sections: 8, overflow: false, pageErrors: 0 });
    if (width === 1440) {
      await page.emulateMedia({ media: "print" });
      await page.pdf({
        path: `${output}/pdf/Lesson_Workbook_AC-BUS-M01-L01_${locale}.pdf`,
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: '<div style="width:100%;text-align:center;font:9px sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      });
    }
    await page.close();
  }
}
await browser.close();
await fs.writeFile(`${output}/browser-checks.json`, JSON.stringify(report, null, 2) + "\n");
console.log(
  "PASS: 64 locale/viewport/section visits; 4 PDFs exported; no overflow or page errors.",
);
