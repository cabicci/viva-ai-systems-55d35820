/** Rebuild original diagrams, cut lists and workbooks; no external generation or account calls. */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { getPilotCopy } from "../../src/lib/furniture-pilot/content";
import { calculateCabinet, SAMPLE, PILOT_ID } from "../../src/lib/furniture-pilot/model";
import { splitTechnicalText } from "../../src/lib/furniture-pilot/technical-text";
import type { SupportedLocale } from "../../src/lib/locale/types";

const output = path.resolve("public/experiments/furniture-pilot");
const locales: SupportedLocale[] = ["ar-EG", "ar-MSA", "ar-Gulf", "en"];
const escape = (value: string | number) =>
  String(value).replace(
    /[&<>"]/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!,
  );
const txt = (x: number, y: number, value: string, size = 22) =>
  `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle">${splitTechnicalText(value)
    .map((part) =>
      part.ltr
        ? `<tspan direction="ltr" unicode-bidi="embed">${escape(part.text)}</tspan>`
        : escape(part.text),
    )
    .join("")}</text>`;
const rect = (x: number, y: number, w: number, h: number, fill = "#cadfda") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#203f45" stroke-width="2"/>`;
const dim = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  tx: number,
  ty: number,
) =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#305d68" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>${txt(tx, ty, label, 21)}`;
function svg(title: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720" role="img" aria-labelledby="title"><title id="title">${escape(title)}</title><defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#305d68"/></marker></defs><rect width="960" height="720" fill="#fff"/><g font-family="DejaVu Sans, sans-serif" fill="#203f45">${txt(480, 52, title, 28)}${txt(480, 86, "Original teaching example • nominal dimensions • mm", 16)}${body}${txt(480, 684, "No approved machining allowances, fixing or load specification", 15)}</g></svg>`;
}
const front = svg(
  "Front elevation — W600 × H600",
  [
    rect(260, 150, 400, 400, "#edf5f3"),
    rect(260, 150, 12, 400),
    rect(648, 150, 12, 400),
    rect(272, 150, 376, 12),
    rect(272, 538, 376, 12),
    rect(272, 344, 376, 12, "#c2d7ed"),
    txt(266, 330, "A1", 15),
    txt(654, 330, "A2", 15),
    txt(460, 143, "B1", 17),
    txt(460, 575, "B2", 17),
    txt(460, 337, "C1", 17),
    txt(460, 254, "D1: overlay back behind body", 17),
    dim(260, 610, 660, 610, "600", 460, 638),
    dim(180, 150, 180, 550, "600", 145, 357),
    dim(272, 115, 648, 115, "564", 460, 107),
    dim(705, 162, 705, 344, "273 clear", 785, 255),
    dim(705, 356, 705, 538, "273 clear", 785, 450),
    txt(460, 590, "A / B / C thickness: 18", 17),
  ].join(""),
);
const side = svg(
  "Side elevation — D300 includes back",
  [
    rect(360, 150, 196, 400),
    rect(556, 150, 4, 400, "#c2d7ed"),
    dim(360, 610, 560, 610, "300 overall", 460, 640),
    dim(360, 120, 556, 120, "294 body", 458, 109),
    dim(270, 150, 270, 550, "600", 235, 355),
    txt(458, 346, "A1 / A2", 21),
    `<path d="M558 270 L670 220 L800 220" fill="none" stroke="#305d68" stroke-width="2"/>`,
    txt(730, 207, "D1: 6", 22),
    txt(460, 584, "Front ←                      → Rear", 17),
  ].join(""),
);
const parts = [
  { id: "A1", label: "Side", w: 294, h: 600, x: 80, y: 140 },
  { id: "A2", label: "Side", w: 294, h: 600, x: 365, y: 140 },
  { id: "D1", label: "Overlay back", w: 600, h: 600, x: 665, y: 140 },
  { id: "B1", label: "Top", w: 564, h: 294, x: 75, y: 440 },
  { id: "B2", label: "Bottom", w: 564, h: 294, x: 365, y: 440 },
  { id: "C1", label: "Middle shelf", w: 564, h: 294, x: 655, y: 440 },
];
const map = svg(
  "Part map — 6 pieces, IDs match the cut list",
  parts
    .map((p) => {
      const scale = 0.36;
      return (
        rect(p.x, p.y, p.w * scale, p.h * scale, p.id === "D1" ? "#c2d7ed" : "#cadfda") +
        txt(p.x + (p.w * scale) / 2, p.y + (p.h * scale) / 2, p.id) +
        txt(
          p.x + 105,
          p.y + p.h * scale + 28,
          `${p.label}: ${p.id.startsWith("A") ? p.h : p.w} × ${p.id.startsWith("A") ? p.w : p.h} × ${p.id === "D1" ? 6 : 18}`,
          15,
        )
      );
    })
    .join(""),
);

await mkdir(output, { recursive: true });
function localizeDrawing(source: string, locale: SupportedLocale) {
  if (locale === "en") return source;
  const translations = [
    ["Front elevation — W600 × H600", "المسقط الأمامي — عرض 600 × ارتفاع 600"],
    ["Side elevation — D300 includes back", "المسقط الجانبي — العمق 300 يشمل الظهر"],
    ["Part map — 6 pieces, IDs match the cut list", "خريطة الأجزاء — ست قطع مطابقة للقائمة"],
    ["Original teaching example • nominal dimensions • mm", "نموذج تعليمي أصلي • أبعاد اسمية • مم"],
    [
      "No approved machining allowances, fixing or load specification",
      "سماحات التصنيع والتثبيت والحمل تحتاج اعتماد الورشة",
    ],
    ["D1: overlay back behind body", "D1: الظهر يغطي الهيكل من الخلف"],
    ["A / B / C thickness: 18", "سمك A / B / C: 18 مم"],
    ["273 clear", "273 صافي"],
    ["300 overall", "300 نهائي"],
    ["294 body", "294 للهيكل"],
    ["Front ←                      → Rear", "الأمام ←                      → الخلف"],
    ["Overlay back", "ظهر خارجي"],
    ["Middle shelf", "رف أوسط"],
    ["Side", "جانب"],
    ["Top", "سقف"],
    ["Bottom", "قاع"],
  ];
  return translations.reduce((drawing, [from, to]) => drawing.replaceAll(from, to), source);
}
const geometry = calculateCabinet(SAMPLE);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.FURNITURE_PILOT_CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});
try {
  for (const locale of locales) {
    const copy = getPilotCopy(locale),
      c = copy.labels;
    const dir = locale === "en" ? "ltr" : "rtl";
    const folder = path.join(output, locale);
    await mkdir(folder, { recursive: true });
    const localizedFront = localizeDrawing(front, locale);
    const localizedSide = localizeDrawing(side, locale);
    const localizedMap = localizeDrawing(map, locale);
    await Promise.all([
      writeFile(path.join(folder, "front.svg"), localizedFront),
      writeFile(path.join(folder, "side.svg"), localizedSide),
      writeFile(path.join(folder, "exploded.svg"), localizedMap),
    ]);
    await writeFile(
      path.join(folder, "cut-list.json"),
      JSON.stringify(
        {
          lessonId: PILOT_ID,
          locale,
          units: "mm",
          assumptions: copy.sections[0].body + " " + copy.sections[0].note,
          dimensions: SAMPLE,
          panels: geometry.panels.map((p) => ({ ...p, label: c[p.key] })),
          totalPieces: 6,
          netAreaM2ByThickness: geometry.areaByThickness,
          stockBoardCount: null,
          status: "teaching-example-requires-workshop-review",
        },
        null,
        2,
      ) + "\n",
    );
    const prose = (value: string) =>
      splitTechnicalText(value)
        .map((part) => (part.ltr ? `<bdi dir="ltr">${escape(part.text)}</bdi>` : escape(part.text)))
        .join("");
    const para = (value: string) => `<p>${prose(value)}</p>`;
    const page = (title: string, body: string, n: number) =>
      `<section class="page"><div class="brand">MASAARAT · M1 · ${escape(locale)}</div><h1>${escape(title)}</h1>${body}<footer>${escape(copy.draft)} · ${n}/7</footer></section>`;
    const cutRows = geometry.panels
      .map(
        (p) =>
          `<tr><td>${escape(c[p.key])}</td><td dir="ltr">${p.ids.join(" / ")}</td>${[p.quantity, p.length, p.width, p.thickness].map((v) => `<td>${v}</td>`).join("")}</tr>`,
      )
      .join("");
    const cutTable = `<table><thead><tr>${[c.part, c.ids, c.quantity, c.length, c.panelWidth, c.thickness].map((v) => `<th>${escape(v)}</th>`).join("")}</tr></thead><tbody>${cutRows}</tbody></table>`;
    const pages = [
      page(
        copy.title,
        para(copy.intro) +
          `<div class="note">${escape(copy.scope)}</div><h2>${escape(copy.goalsTitle)}</h2><ul>${copy.goals.map((g) => `<li>${escape(g)}</li>`).join("")}</ul>` +
          para(copy.prerequisites) +
          `<h2>${escape(copy.sections[0].title)}</h2>` +
          para(copy.sections[0].body) +
          para(copy.sections[0].note) +
          `<div class="formula">W600 × H600 × D300 / t18 / b6 mm</div>`,
        1,
      ),
      page(
        c.reading,
        copy.sections
          .slice(1, 4)
          .map(
            (s) =>
              `<h2>${escape(s.title)}</h2>` +
              para(s.body) +
              `<div class="formula" dir="ltr">${escape(s.note)}</div>`,
          )
          .join("") +
          `<h2>${escape(copy.sections[4].title)}</h2>` +
          cutTable +
          para(copy.sections[4].note),
        2,
      ),
      page(
        c.drawings,
        `<div class="drawings">${localizedFront}${localizedSide}</div><div class="parts">${localizedMap}</div>` +
          para(copy.scope),
        3,
      ),
      page(
        c.quiz,
        copy.quiz
          .map(
            (q, i) =>
              `<div class="question"><h2>${i + 1}. ${escape(q.question)}</h2>${q.options.map((option) => `<p>○ ${prose(option)}</p>`).join("")}</div>`,
          )
          .join("") +
          `<div class="note">${escape(locale === "en" ? "Review explanations on page 7 after answering." : "راجع التفسيرات في الصفحة 7 بعد الإجابة.")}</div>`,
        4,
      ),
      page(
        c.assignment,
        para(c.worksheet) +
          `<table><tr><th>${escape(c.innerWidth)}</th><th>${escape(c.bodyDepth)}</th><th>${escape(c.opening)}</th></tr><tr><td class="blank"></td><td></td><td></td></tr></table>` +
          para(c.rubric) +
          para(c.assignmentNote) +
          `<h2>${escape(c.cost)}</h2>` +
          para(c.costNote) +
          `<table><thead><tr><th>${escape(locale === "en" ? "Item" : "البند")}</th><th>${escape(locale === "en" ? "Quantity / unit" : "الكمية / الوحدة")}</th><th>${escape(locale === "en" ? "Unit price / quote date" : "سعر الوحدة / تاريخ العرض")}</th><th>${escape(locale === "en" ? "Total" : "الإجمالي")}</th></tr></thead><tbody>${(locale === "en" ? ["Body stock", "Back stock", "Hardware", "Labour", "Finishing", "Transport"] : ["خامة الهيكل", "خامة الظهر", "الإكسسوارات", "العمل", "التشطيب", "النقل"]).map((v) => `<tr><td>${v}</td><td class="blank"></td><td></td><td></td></tr>`).join("")}</tbody></table><h2>${escape(copy.sections[5].title)}</h2>` +
          para(copy.sections[5].body) +
          `<div class="note">${escape(locale === "en" ? "Reviewer / date / required revisions: ________________________" : "المراجع / التاريخ / التعديلات المطلوبة: ________________________")}</div>`,
        5,
      ),
      page(
        c.video,
        `<div class="note"><strong>${escape(c.videoPending)}</strong>${para(c.videoNote)}</div>` +
          copy.sections
            .map((s, i) => `<h2>${i + 1}. ${escape(s.title)}</h2>${para(s.body)}`)
            .join("") +
          `<h2>${escape(c.sources)}</h2>` +
          para(c.sourceNote) +
          `<p dir="ltr">https://www.hse.gov.uk/woodworking/training.htm</p>`,
        6,
      ),
      page(
        c.assistant,
        para(c.guideNote) +
          copy.faq.map((f) => `<h2>${escape(f.question)}</h2>${para(f.answer)}`).join("") +
          `<h2>${escape(locale === "en" ? "Knowledge-check explanations" : "تفسيرات اختبار الفهم")}</h2>` +
          copy.quiz.map((q, i) => para(`${i + 1}. ${q.explanation}`)).join("") +
          `<div class="note">${escape(copy.sections[5].note)}</div>`,
        7,
      ),
    ];
    const html = `<!doctype html><html lang="${locale === "en" ? "en" : "ar"}" dir="${dir}"><head><meta charset="utf-8"><title>${escape(copy.title)}</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#203f45;font-family:"DejaVu Sans",sans-serif;font-size:${locale === "en" ? 12 : 13}px;line-height:1.65}.page{position:relative;min-height:264mm;page-break-after:always;padding-bottom:12mm}.page:last-child{page-break-after:auto}.brand{font-size:10px;font-weight:bold;color:#367482;border-bottom:1px solid #cadfda;padding-bottom:10px}h1{font-size:23px;line-height:1.4;margin:16px 0}h2{font-size:15px;margin:16px 0 5px}p{margin:7px 0}li{margin:7px 0}.note,.formula{background:#edf5f3;border-radius:8px;padding:12px;margin:12px 0}.formula{text-align:center;direction:ltr;font-size:14px}table{width:100%;border-collapse:collapse;margin:12px 0;font-size:10px}th,td{border:1px solid #cadfda;padding:8px;text-align:start}th{background:#edf5f3}.blank{height:33px}.question{margin-bottom:20px;break-inside:avoid}.drawings{display:flex;gap:8px;direction:ltr}.drawings svg{width:50%;height:245px}.parts svg{width:100%;height:350px;margin-top:15px}footer{position:absolute;bottom:0;inset-inline:0;border-top:1px solid #cadfda;font-size:9px;color:#5b7175;padding-top:8px}svg text{font-family:"DejaVu Sans",sans-serif}</style></head><body>${pages.join("")}</body></html>`;
    const tab = await browser.newPage({ viewport: { width: 688, height: 1100 } });
    await tab.emulateMedia({ media: "print" });
    await tab.setContent(html, { waitUntil: "load" });
    await tab.evaluate(() => document.fonts.ready);
    const overflow = await tab
      .locator(".page")
      .evaluateAll((nodes) =>
        nodes
          .map((node, i) => ({ page: i + 1, height: node.getBoundingClientRect().height }))
          .filter((v) => v.height > 1016),
      );
    if (overflow.length)
      throw new Error(`Workbook overflow ${locale}: ${JSON.stringify(overflow)}`);
    await tab.pdf({
      path: path.join(folder, "workbook.pdf"),
      printBackground: true,
      preferCSSPageSize: true,
    });
    await tab.close();
    console.log(`Generated ${locale} workbook and cut list`);
  }
} finally {
  await browser.close();
}
