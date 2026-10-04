import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { mkdir, readFile, readdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { TechnicalDiagram } from "../../src/components/technical-education/TechnicalDiagram";
import { getTechnicalCopy } from "../../src/lib/technical-education/copy";
import type {
  TechnicalDiagramKind,
  TechnicalLesson,
} from "../../src/lib/technical-education/types";
import { getPilotCopy, PILOT_LOCALES } from "../../src/lib/furniture-pilot/content";
import { SAMPLE, calculateCabinet } from "../../src/lib/furniture-pilot/model";
import { splitTechnicalText } from "../../src/lib/furniture-pilot/technical-text";

const root = process.cwd();
const output = path.join(root, "public/experiments");
const files: { target: string; html: string; pages: number; autoPaginate: boolean }[] = [];
const manifestPath = path.join(root, "docs/experiments/technical-education/pdf-revisions.json");
let revisions: Record<string, { source: string; output: string }> = {};
try {
  revisions = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
  /* First export. */
}
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const esc = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
const txt = (text: string) =>
  splitTechnicalText(text)
    .map((part) => (part.ltr ? `<bdi dir="ltr">${esc(part.text)}</bdi>` : esc(part.text)))
    .join("");
const list = (items: string[]) =>
  `<ul>${items.map((item) => `<li>${txt(item)}</li>`).join("")}</ul>`;
function document(title: string, locale: string, type: string, pages: string[]) {
  return `<!doctype html><html lang="${locale === "en" ? "en" : "ar"}" dir="${locale === "en" ? "ltr" : "rtl"}"><meta charset="utf-8"><title>${esc(type)} - ${esc(title)}</title><style>
  @page { size:A4; margin:0; } * {box-sizing:border-box} body{margin:0;font-family:'DejaVu Sans',sans-serif;color:#203f45;font-size:13px;line-height:1.85} .page{width:210mm;height:297mm;padding:17mm 16mm 22mm;position:relative;break-after:page;overflow:hidden} .page:last-child{break-after:auto} header{display:flex;justify-content:space-between;border-bottom:2px solid #9be3c4;padding-bottom:10px;margin-bottom:16px;color:#387b83;font-size:11px} h1{font-size:23px;line-height:1.6;margin:0 0 13px} h2{font-size:17px;line-height:1.6;margin:16px 0 8px} h3{font-size:14px;margin:12px 0 6px} p{margin:6px 0 12px} li{margin:3px 0} ul{padding-inline-start:22px} .box{padding:12px;background:#eef7f4;border-radius:12px;margin-top:12px} .section{display:grid;grid-template-columns:1fr 145px;gap:15px;align-items:start;margin-top:16px} svg{width:100%;height:auto} .draw{width:100%;height:208mm;object-fit:contain} footer{position:absolute;inset-inline:16mm;bottom:12mm;border-top:1px solid #d5e5df;padding-top:6px;display:flex;justify-content:space-between;font-size:10px} .lines{height:96px;background:repeating-linear-gradient(white 0px,white 23px,#d5e5df 24px);margin:7px 0 15px} table{width:100%;border-collapse:collapse;font-size:12px} td,th{padding:10px 6px;border-bottom:1px solid #d5e5df;text-align:start} bdi{unicode-bidi:isolate} .caption{font-size:10px;color:#536e70} </style>${pages.map((body, index) => `<section class="page"><header><span dir="ltr">Masaarat · TECH</span><span>${esc(type)}</span></header><div class="content">${body}</div><footer><span>${esc(title)}</span><bdi dir="ltr">${index + 1} / ${pages.length}</bdi></footer></section>`).join("")}</html>`;
}
const push = (
  target: string,
  title: string,
  locale: string,
  type: string,
  pages: string[],
  autoPaginate = false,
) =>
  files.push({
    target,
    html: document(title, locale, type, pages),
    pages: pages.length,
    autoPaginate,
  });
const packages = await readdir(path.join(root, "src/lib/technical-education/lessons"));
for (const name of packages.filter((name) => name.endsWith(".json"))) {
  const lesson: TechnicalLesson = JSON.parse(
    await readFile(path.join(root, "src/lib/technical-education/lessons", name), "utf8"),
  );
  const c = getTechnicalCopy(lesson.locale);
  const directory = path.join(output, "technical-education", lesson.locale, lesson.id);
  const sections = lesson.sections.map(
    (section) =>
      `<div class="section"><div><h2>${txt(section.title)}</h2><p>${txt(section.text)}</p></div><div>${renderToStaticMarkup(<TechnicalDiagram kind={section.diagram} locale={lesson.locale} title={section.title} />)}<p class="caption">${txt(section.caption)}</p></div></div>`,
  );
  const legacyPages = [
    `<h1>${txt(lesson.title)}</h1><p>${txt(lesson.intro)}</p><h2>${c.goals}</h2>${list(lesson.goals)}${sections.slice(0, 2).join("")}`,
    `${sections.slice(2).join("")}<h2>${txt(lesson.example.title)}</h2><p>${txt(lesson.example.text)}</p><div class="box">${txt(lesson.example.decision)}</div><h2>${c.quiz}</h2>${lesson.quiz.map((question) => `<h3>${txt(question.question)}</h3>${list(question.options)}<p class="caption">${c.correct}: ${txt(question.options[question.correct])}. ${txt(question.explanation)}</p>`).join("")}`,
    `<h1>${c.assignment}</h1><p>${txt(lesson.assignment.prompt)}</p>${lesson.assignment.fields.map((field) => `<h3>${txt(field)}</h3><div class="lines"></div>`).join("")}<h2>${c.taskReview}</h2>${list(lesson.assignment.criteria)}`,
  ];
  // Preserve accepted first-module exports byte-for-byte. New lessons paginate by concept.
  const isExisting = lesson.id.startsWith("M01-");
  const practice = legacyPages[2];
  const flow = [
    `<div><h1>${txt(lesson.title)}</h1><p>${txt(lesson.intro)}</p><h2>${c.goals}</h2>${list(lesson.goals)}</div>`,
    ...sections,
    `<div><h2>${txt(lesson.example.title)}</h2><p>${txt(lesson.example.text)}</p><div class="box">${txt(lesson.example.decision)}</div></div>`,
    ...lesson.quiz.map(
      (question, index) =>
        `<div>${index === 0 ? `<h2>${c.quiz}</h2>` : ""}<h3>${txt(question.question)}</h3>${list(question.options)}<p class="caption">${c.correct}: ${txt(question.options[question.correct])}. ${txt(question.explanation)}</p></div>`,
    ),
    ...lesson.faq.map(
      (item, index) =>
        `<div>${index === 0 ? `<h2>${c.assistant}</h2>` : ""}<h3>${txt(item.question)}</h3><p>${txt(item.answer)}</p></div>`,
    ),
    `<div data-new-page="true">${practice}</div>`,
  ];
  const pages = isExisting ? legacyPages : [flow.join("")];
  push(
    path.join(directory, "workbook.pdf"),
    lesson.title,
    lesson.locale,
    c.workbook,
    pages,
    !isExisting,
  );
  push(path.join(directory, "worksheet.pdf"), lesson.title, lesson.locale, c.worksheet, [practice]);
  for (const section of lesson.sections) {
    const assetDir = path.join(output, "technical-education", lesson.locale);
    await mkdir(assetDir, { recursive: true });
    await Bun.write(
      path.join(assetDir, `${section.diagram}.svg`),
      renderToStaticMarkup(
        <TechnicalDiagram kind={section.diagram} locale={lesson.locale} title={section.diagram} />,
      ),
    );
  }
}
for (const locale of PILOT_LOCALES) {
  const c = getPilotCopy(locale),
    dir = path.join(output, "furniture-pilot", locale);
  await mkdir(dir, { recursive: true });
  if (locale === "ar-MSA" || locale === "ar-Gulf")
    for (const kind of ["front", "side", "exploded"])
      await copyFile(
        path.join(output, "furniture-pilot/ar-EG", `${kind}.svg`),
        path.join(dir, `${kind}.svg`),
      );
  const drawings = await Promise.all(
    ["front", "side", "exploded"].map(
      async (kind) =>
        `<h1>${txt(c.labels[kind as "front" | "side" | "exploded"])}</h1><img class="draw" src="data:image/svg+xml;base64,${Buffer.from(await readFile(path.join(dir, `${kind}.svg`))).toString("base64")}" />`,
    ),
  );
  for (const section of c.sections) {
    await Bun.write(
      path.join(dir, `cabinet-${section.id}.svg`),
      renderToStaticMarkup(
        <TechnicalDiagram
          kind={`cabinet-${section.id}` as TechnicalDiagramKind}
          locale={locale}
          title={section.title}
        />,
      ),
    );
  }
  const geometry = calculateCabinet(SAMPLE);
  const cut = `<h1>${txt(c.title)}</h1><p>${txt(c.scope)}</p><table><thead><tr>${[c.labels.part, c.labels.ids, c.labels.quantity, c.labels.length, c.labels.panelWidth, c.labels.thickness].map((t) => `<th>${txt(t)}</th>`).join("")}</tr></thead><tbody>${geometry.panels.map((p) => `<tr><td>${txt(c.labels[p.key])}</td><td dir="ltr">${p.ids.join(" / ")}</td>${[p.quantity, p.length, p.width, p.thickness].map((value) => `<td dir="ltr">${value}</td>`).join("")}</tr>`).join("")}</tbody></table><p>${txt(c.sections[4].note)}</p><div class="box">${txt(c.labels.rubric)}</div>`;
  push(
    path.join(dir, "cut-list.pdf"),
    c.title,
    locale,
    locale === "en" ? "Cut list" : "قائمة القطع",
    [cut],
  );
  push(path.join(dir, "drawings.pdf"), c.title, locale, c.labels.drawings, drawings);
  const pages = [
    `<h1>${txt(c.title)}</h1><p>${txt(c.intro)}</p><p>${txt(c.scope)}</p><h2>${txt(c.goalsTitle)}</h2>${list(c.goals)}<p>${txt(c.prerequisites)}</p>`,
    ...[0, 2, 4].map((start) =>
      c.sections
        .slice(start, start + 2)
        .map(
          (s) =>
            `<div class="section"><div><h2>${txt(s.title)}</h2><p>${txt(s.body)}</p><div class="box">${txt(s.note)}</div></div><div>${renderToStaticMarkup(<TechnicalDiagram kind={`cabinet-${s.id}` as TechnicalDiagramKind} locale={locale} title={s.title} />)}</div></div>`,
        )
        .join(""),
    ),
    `<h1>${txt(c.labels.quiz)}</h1>${c.quiz.map((q) => `<h3>${txt(q.question)}</h3>${list(q.options)}<p class="caption">${txt(q.explanation)}</p>`).join("")}`,
    `<h1>${txt(c.labels.assignment)}</h1><p>${txt(c.labels.worksheet)}</p><p>${txt(c.labels.assignmentNote)}</p>${[c.labels.innerWidth, c.labels.bodyDepth, c.labels.opening].map((t) => `<h3>${txt(t)}</h3><div class="lines"></div>`).join("")}<div class="box">${txt(c.labels.rubric)}</div>`,
    cut,
  ];
  push(
    path.join(dir, "workbook.pdf"),
    c.title,
    locale,
    locale === "en" ? "Lesson workbook" : "دليل الدرس",
    pages,
  );
}
const browser = await chromium.launch({
  executablePath: process.env.TECHNICAL_CHROME_PATH || undefined,
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await page.emulateMedia({ media: "print" });
  for (const file of files) {
    const key = path.relative(root, file.target);
    const source = hash(
      (file.autoPaginate ? "technical-pdf-flow-v1\0" : "technical-pdf-v1\0") + file.html,
    );
    if (revisions[key]?.source === source) {
      try {
        if (hash(await readFile(file.target)) === revisions[key].output) {
          console.log(`${key}: reused`);
          continue;
        }
      } catch {
        /* Rebuild missing output. */
      }
    }
    await page.setContent(file.html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    if (file.autoPaginate) {
      file.pages = await page.evaluate(() => {
        const template = document.querySelector<HTMLElement>(".page")!;
        const blocks = Array.from(template.querySelector(".content")!.children);
        const clean = template.cloneNode(true) as HTMLElement;
        clean.querySelector(".content")!.replaceChildren();
        template.remove();
        let current: HTMLElement;
        const nextPage = () => {
          current = clean.cloneNode(true) as HTMLElement;
          document.body.append(current);
        };
        const overflows = () =>
          current.querySelector(".content")!.getBoundingClientRect().bottom >
          current.querySelector("footer")!.getBoundingClientRect().top - 8;
        nextPage();
        for (const block of blocks) {
          if (
            block.hasAttribute("data-new-page") &&
            current!.querySelector(".content")!.children.length
          )
            nextPage();
          let content = current!.querySelector(".content")!;
          content.append(block);
          if (overflows()) {
            block.remove();
            if (!content.children.length)
              throw new Error(
                "An explanation block exceeds an A4 page; split the authored concept.",
              );
            nextPage();
            content = current!.querySelector(".content")!;
            content.append(block);
            if (overflows())
              throw new Error(
                "An explanation block exceeds an A4 page; split the authored concept.",
              );
          }
        }
        const pages = Array.from(document.querySelectorAll(".page"));
        pages.forEach((element, index) => {
          element.querySelector("footer bdi")!.textContent = `${index + 1} / ${pages.length}`;
        });
        return pages.length;
      });
    }
    const clashes = await page.locator(".page").evaluateAll((pages) =>
      pages.flatMap((page, index) => {
        const body = page.querySelector(".content")!.getBoundingClientRect();
        const footer = page.querySelector("footer")!.getBoundingClientRect();
        return body.bottom > footer.top - 8 ? [index + 1] : [];
      }),
    );
    if (clashes.length)
      throw new Error(`PDF content/footer overlap: ${file.target}, pages ${clashes}`);
    await mkdir(path.dirname(file.target), { recursive: true });
    await page.pdf({ path: file.target, printBackground: true, preferCSSPageSize: true });
    revisions[key] = { source, output: hash(await readFile(file.target)) };
    console.log(`${path.relative(root, file.target)}: ${file.pages} pages`);
  }
  await Bun.write(manifestPath, JSON.stringify(revisions, null, 2) + "\n");
} finally {
  await browser.close();
}
