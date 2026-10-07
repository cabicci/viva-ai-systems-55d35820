import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const temporary = mkdtempSync(resolve(tmpdir(), "masaarat-social-card-"));
const fonts = resolve(root, "src/lib/lesson-visuals/v1/fonts");
const xmlEscape = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const fontConfig = resolve(temporary, "fonts.conf");
writeFileSync(
  fontConfig,
  `<fontconfig><include>/etc/fonts/fonts.conf</include><dir>${xmlEscape(fonts)}</dir><cachedir>${temporary}</cachedir></fontconfig>`,
);
process.env.FONTCONFIG_FILE = fontConfig;
const { default: sharp } = await import("sharp");
const destination = resolve(root, "public/brand/masaarat-og-all-domains-20261007.png");
mkdirSync(dirname(destination), { recursive: true });

// Only the backdrop and copy are drawn. Composite the approved original PNG
// at its exact natural dimensions; do not generate, recolour or redraw it.
const artwork = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#e6f6f5"/>
  <circle cx="1090" cy="105" r="86" fill="#dfeaf4" opacity=".7"/>
  <circle cx="1040" cy="544" r="63" fill="#e7f5df" opacity=".7"/>
  <g fill="none" stroke-width="3" opacity=".55">
    <path d="M-40 505 Q110 430 182 284 Q225 185 306 116" stroke="#99bef6"/>
    <path d="M-25 529 Q126 454 198 308 Q241 209 322 140" stroke="#83d5c9"/>
    <path d="M-10 553 Q142 478 214 332 Q257 233 338 164" stroke="#e1bedb"/>
    <path d="M5 577 Q158 502 230 356 Q273 257 354 188" stroke="#cfcef3"/>
  </g>
  <g font-family="Tajawal" font-weight="700" text-anchor="middle" direction="rtl">
    <text x="600" y="389" font-size="60" fill="#1e293b">تعلّم يفتح لك طرقًا جديدة</text>
    <text x="600" y="482" font-size="31" fill="#475569">ذكاء اصطناعي • تعليم للأطفال • تعليم فني • تعليم أكاديمي</text>
  </g>
</svg>`;
try {
  await sharp(Buffer.from(artwork))
    .composite([
      { input: resolve(root, "public/brand/masaarat-logo-lockup.png"), left: 313, top: 112 },
    ])
    .png()
    .toFile(destination);
  console.log(destination);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
