#!/usr/bin/env python3
"""
Generate masaarat-ai-book.pdf from /tmp/book-content.json.

Pipeline:
  1. Load JSON dumped by scripts/extract-book-content.ts
  2. Build a single HTML document (RTL, Cairo font embedded base64)
  3. Render to PDF via headless Chromium

Output: /mnt/documents/masaarat-ai-book.pdf
"""
import base64
import html
import io
import json
import os
import subprocess
import sys
from pathlib import Path

import qrcode

ROOT = Path("/dev-server")
BOOK_JSON = Path("/tmp/book-content.json")
HTML_OUT = Path("/tmp/masaarat-ai-book.html")
PDF_OUT = Path("/mnt/documents/masaarat-ai-book.pdf")
DIAGRAM_DIR = ROOT / "src/assets/lessons/diagrams"
BRAND_ICON_DIR = ROOT / "public/brand/icons"
FONT_PATH = ROOT / "src/assets/fonts/Cairo.ttf"

PATH_META = {
    "intro":     {"label": "المقدمة",  "color": "#6366f1", "icon": "ai-brain.svg"},
    "builder":   {"label": "Builder",   "color": "#0ea5e9", "icon": "path-builder.svg"},
    "creator":   {"label": "Creator",   "color": "#ec4899", "icon": "path-creator.svg"},
    "automator": {"label": "Automator", "color": "#14b8a6", "icon": "path-automator.svg"},
    "analyst":   {"label": "Analyst",   "color": "#f59e0b", "icon": "path-analyst.svg"},
    "business":  {"label": "Business",  "color": "#a855f7", "icon": "path-business.svg"},
}


def esc(s):
    return html.escape(s or "", quote=True).replace("\n", "<br>")


def file_b64(p: Path) -> str:
    return base64.b64encode(p.read_bytes()).decode("ascii")


def qr_data_url(url: str) -> str:
    img = qrcode.make(url, box_size=4, border=1)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def image_data_url(path_str: str):
    """Resolve a screenshot src to a data URL. Returns None on failure."""
    if not path_str:
        return None
    p = Path(path_str)
    if not p.is_absolute():
        # likely "@/assets/..." or "/lessons/..."
        if path_str.startswith("@/"):
            p = ROOT / "src" / path_str[2:]
        else:
            p = ROOT / path_str.lstrip("/")
    if not p.exists():
        return None
    ext = p.suffix.lower().lstrip(".")
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
            "svg": "image/svg+xml", "webp": "image/webp"}.get(ext, "application/octet-stream")
    return f"data:{mime};base64,{file_b64(p)}"


def find_diagram_svg(diagram_id: str):
    """Match a diagram id like 'audience-persona' to a file in DIAGRAM_DIR."""
    if not DIAGRAM_DIR.exists():
        return None
    for f in DIAGRAM_DIR.glob("*.svg"):
        if f.stem.endswith(diagram_id):
            return f.read_text(encoding="utf-8")
    return None


# ---------- Block renderers ----------

def render_paragraphs(b):
    parts = "".join(f"<p>{esc(x)}</p>" for x in b.get("paragraphs", []))
    return f'<div class="bk para">{parts}</div>'


def render_comparison(b):
    l, r = b["left"], b["right"]
    return f'''<div class="bk compare">
      <div class="col left"><div class="lbl">{esc(l["label"])}</div><p>{esc(l["body"])}</p></div>
      <div class="col right"><div class="lbl">{esc(r["label"])}</div><p>{esc(r["body"])}</p></div>
    </div>'''


def render_concepts(b):
    rows = "".join(
        f'<tr><td class="term">{esc(it["term"])}</td><td>{esc(it.get("meaning",""))}'
        + (f'<br><span class="ex">مثال: {esc(it["example"])}</span>' if it.get("example") else "")
        + "</td></tr>"
        for it in b["items"]
    )
    return f'<div class="bk concepts"><table>{rows}</table></div>'


def render_quiz(b):
    out = ['<div class="bk quiz"><div class="qhdr">اختبار سريع</div>']
    for i, q in enumerate(b["items"], 1):
        opts = "".join(
            f'<li class="{ "correct" if idx == q["correctIndex"] else "" }">{esc(o)}</li>'
            for idx, o in enumerate(q["options"])
        )
        out.append(
            f'<div class="qitem"><div class="qq">{i}. {esc(q["question"])}</div>'
            f'<ol class="qopts">{opts}</ol>'
            f'<div class="qexp"><b>الشرح:</b> {esc(q.get("explanation",""))}</div></div>'
        )
    out.append("</div>")
    return "".join(out)


def render_mission(b):
    return f'''<div class="bk mission">
      <div class="mhdr">المهمة العملية</div>
      <p class="mintro">{esc(b.get("intro",""))}</p>
      <div class="mprompt">{esc(b.get("prompt",""))}</div>
    </div>'''


def render_lesson_video(b, lesson_url):
    url = b.get("url") or lesson_url
    if not lesson_url and not (b.get("url","").startswith("http")):
        return ""  # nothing to QR
    qr_url = lesson_url or url
    qr = qr_data_url(qr_url) if qr_url else None
    cap = esc(b.get("caption", ""))
    dur = esc(b.get("durationLabel", ""))
    qr_html = f'<img src="{qr}" class="qr" alt="QR">' if qr else ''
    return f'''<div class="bk video">
      <div class="vleft">
        <div class="vlabel">🎬 شاهد الدرس بالفيديو</div>
        <div class="vurl">{esc(qr_url)}</div>
        {f'<div class="vdur">المدة: {dur}</div>' if dur else ''}
        {f'<p class="vcap">{cap}</p>' if cap else ''}
      </div>
      {qr_html}
    </div>'''


def render_screenshot(b):
    data = image_data_url(b.get("src", ""))
    if not data:
        return f'<div class="bk shot empty">[لقطة شاشة: {esc(b.get("label","") or b.get("alt",""))}] {esc(b.get("caption",""))}</div>'
    return f'''<div class="bk shot">
      <img src="{data}" alt="{esc(b.get("alt",""))}">
      {f'<div class="cap">{esc(b.get("caption",""))}</div>' if b.get("caption") else ''}
    </div>'''


def render_diagram(b):
    svg = find_diagram_svg(b["id"])
    label = esc(b.get("label", "") or b["id"])
    cap = esc(b.get("caption", ""))
    if svg:
        # strip width/height to let CSS scale it
        return f'<div class="bk diag"><div class="dlabel">{label}</div><div class="dsvg">{svg}</div>{f"<div class=\"cap\">{cap}</div>" if cap else ""}</div>'
    return f'<div class="bk diag empty"><div class="dlabel">📊 {label}</div><div class="cap">{cap}</div></div>'


def render_flow(b):
    items = "".join(f'<div class="fstep">{i+1}. {esc(s)}</div>' for i, s in enumerate(b["steps"]))
    return f'<div class="bk flow">{items}</div>'


def render_numbered(b):
    items = "".join(f"<li>{esc(x)}</li>" for x in b["items"])
    return f'<div class="bk numbered"><ol>{items}</ol></div>'


def render_block(b, lesson_url=None):
    k = b["kind"]
    fn = {
        "paragraphs":  render_paragraphs,
        "comparison":  render_comparison,
        "concepts":    render_concepts,
        "quiz":        render_quiz,
        "mission":     render_mission,
        "screenshot":  render_screenshot,
        "diagram":     render_diagram,
        "flow":        render_flow,
        "numberedList": render_numbered,
    }.get(k)
    if k == "lessonVideo":
        return render_lesson_video(b, lesson_url)
    if fn:
        return fn(b)
    return f'<div class="bk other">[{esc(k)}]</div>'


# ---------- Document ----------

def build_html(data):
    font_b64 = file_b64(FONT_PATH)
    css = f"""
    @font-face {{
      font-family: 'Cairo';
      src: url(data:font/ttf;base64,{font_b64}) format('truetype');
      font-weight: 100 900;
    }}
    @page {{
      size: A4;
      margin: 18mm 16mm 20mm 16mm;
      @bottom-center {{ content: counter(page); font-family: Cairo; color: #888; font-size: 9pt; }}
    }}
    @page :first {{ margin: 0; @bottom-center {{ content: none; }} }}
    html, body {{ margin: 0; padding: 0; font-family: 'Cairo', sans-serif; color: #1f2937; direction: rtl; line-height: 1.75; font-size: 11pt; }}
    h1, h2, h3, h4 {{ font-family: 'Cairo'; line-height: 1.35; margin: 0; }}
    a {{ color: #2563eb; text-decoration: none; word-break: break-all; }}
    .pagebreak {{ page-break-before: always; }}
    .nobreak {{ page-break-inside: avoid; }}

    /* COVER */
    .cover {{ height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 40mm 20mm; box-sizing: border-box;
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%); color: white; }}
    .cover .brand {{ font-size: 16pt; letter-spacing: 2px; opacity: 0.8; }}
    .cover .title-block {{ text-align: center; }}
    .cover h1 {{ font-size: 48pt; font-weight: 900; margin-bottom: 12mm; }}
    .cover .sub {{ font-size: 18pt; opacity: 0.85; line-height: 1.6; }}
    .cover .meta {{ text-align: center; font-size: 11pt; opacity: 0.7; }}

    /* TOC */
    .toc h1 {{ font-size: 26pt; margin-bottom: 8mm; color: #0f172a; }}
    .toc-section {{ margin-bottom: 8mm; }}
    .toc-section h2 {{ font-size: 16pt; padding: 4mm 6mm; border-radius: 6px; color: white; margin-bottom: 4mm; }}
    .toc-section ol {{ margin: 0; padding: 0 8mm; }}
    .toc-section li {{ margin: 1.5mm 0; color: #374151; font-size: 10.5pt; }}
    .toc-section li b {{ color: #6b7280; font-weight: 500; }}

    /* PATH DIVIDER */
    .pdivider {{ height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; }}
    .pdivider .ptag {{ font-size: 14pt; opacity: 0.7; letter-spacing: 3px; margin-bottom: 8mm; }}
    .pdivider h1 {{ font-size: 56pt; font-weight: 900; margin-bottom: 6mm; }}
    .pdivider .ptagline {{ font-size: 16pt; opacity: 0.9; max-width: 140mm; line-height: 1.6; }}
    .pdivider .picon {{ width: 80mm; height: 80mm; margin-bottom: 12mm; opacity: 0.95; }}
    .pdivider .picon svg {{ width: 100%; height: 100%; }}

    /* MODULE */
    .module-hdr {{ margin: 12mm 0 6mm; padding: 4mm 6mm; border-radius: 6px; background: #f3f4f6; border-right: 6px solid var(--accent, #6366f1); }}
    .module-hdr .mtag {{ font-size: 9pt; color: #6b7280; letter-spacing: 2px; }}
    .module-hdr h2 {{ font-size: 18pt; color: #111827; margin-top: 2mm; }}
    .module-hdr .msub {{ font-size: 10.5pt; color: #4b5563; margin-top: 2mm; }}

    /* LESSON */
    .lesson {{ page-break-before: always; padding-top: 4mm; }}
    .lesson > .lhdr {{ padding-bottom: 5mm; border-bottom: 2px solid var(--accent, #6366f1); margin-bottom: 6mm; }}
    .lesson .lnum {{ font-size: 10pt; color: var(--accent, #6366f1); letter-spacing: 2px; font-weight: 700; }}
    .lesson h2 {{ font-size: 22pt; color: #0f172a; margin-top: 2mm; }}

    /* SECTIONS */
    .section {{ margin: 8mm 0; }}
    .section .eyebrow {{ font-size: 9pt; color: var(--accent, #6366f1); letter-spacing: 2px; font-weight: 700; margin-bottom: 2mm; }}
    .section h3 {{ font-size: 14pt; color: #0f172a; margin-bottom: 4mm; }}

    /* BLOCKS */
    .bk {{ margin: 4mm 0; page-break-inside: avoid; }}
    .para p {{ margin: 0 0 3mm; text-align: justify; }}

    .compare {{ display: flex; gap: 4mm; }}
    .compare .col {{ flex: 1; padding: 4mm; border-radius: 6px; border: 1px solid #e5e7eb; }}
    .compare .left {{ background: #fef2f2; border-color: #fecaca; }}
    .compare .right {{ background: #f0fdf4; border-color: #bbf7d0; }}
    .compare .lbl {{ font-weight: 700; margin-bottom: 2mm; font-size: 10pt; }}
    .compare .left .lbl {{ color: #b91c1c; }}
    .compare .right .lbl {{ color: #15803d; }}
    .compare p {{ margin: 0; font-size: 10.5pt; }}

    .concepts table {{ width: 100%; border-collapse: collapse; font-size: 10.5pt; }}
    .concepts td {{ padding: 3mm; border-bottom: 1px solid #e5e7eb; vertical-align: top; }}
    .concepts .term {{ font-weight: 700; color: var(--accent, #6366f1); width: 35%; }}
    .concepts .ex {{ color: #6b7280; font-size: 9.5pt; }}

    .quiz {{ background: #f9fafb; border-radius: 6px; padding: 5mm; border: 1px solid #e5e7eb; }}
    .quiz .qhdr {{ font-weight: 700; font-size: 12pt; margin-bottom: 4mm; color: #1f2937; }}
    .quiz .qitem {{ margin-bottom: 5mm; }}
    .quiz .qq {{ font-weight: 600; margin-bottom: 2mm; }}
    .quiz .qopts {{ margin: 0; padding-right: 6mm; font-size: 10pt; }}
    .quiz .qopts li {{ margin: 1mm 0; }}
    .quiz .qopts li.correct {{ color: #15803d; font-weight: 700; }}
    .quiz .qopts li.correct::after {{ content: " ✓"; }}
    .quiz .qexp {{ font-size: 9.5pt; color: #4b5563; margin-top: 2mm; padding: 2mm 3mm; background: white; border-right: 3px solid #10b981; }}

    .mission {{ border: 2px dashed var(--accent, #6366f1); border-radius: 8px; padding: 5mm; background: #faf5ff; }}
    .mission .mhdr {{ font-weight: 700; font-size: 13pt; color: var(--accent, #6366f1); margin-bottom: 3mm; }}
    .mission .mintro {{ margin-bottom: 3mm; }}
    .mission .mprompt {{ background: white; padding: 4mm; border-radius: 4px; white-space: pre-wrap; font-size: 10pt; }}

    .video {{ display: flex; align-items: center; gap: 5mm; background: #f0f9ff; border-radius: 6px; padding: 4mm; border-right: 4px solid #0ea5e9; }}
    .video .vleft {{ flex: 1; }}
    .video .vlabel {{ font-weight: 700; font-size: 11pt; color: #0c4a6e; }}
    .video .vurl {{ font-size: 8.5pt; color: #0369a1; margin-top: 1mm; }}
    .video .vdur, .video .vcap {{ font-size: 9.5pt; color: #475569; margin-top: 1mm; }}
    .video .qr {{ width: 22mm; height: 22mm; background: white; padding: 1mm; border-radius: 3px; }}

    .shot img {{ max-width: 100%; max-height: 110mm; border-radius: 4px; border: 1px solid #e5e7eb; display: block; margin: 0 auto; }}
    .shot .cap, .diag .cap {{ font-size: 9.5pt; color: #6b7280; text-align: center; margin-top: 2mm; font-style: italic; }}
    .shot.empty {{ background: #f3f4f6; padding: 6mm; border-radius: 4px; color: #6b7280; font-size: 10pt; text-align: center; }}

    .diag {{ background: #fafafa; padding: 4mm; border-radius: 6px; }}
    .diag .dlabel {{ font-weight: 700; font-size: 10.5pt; color: #374151; margin-bottom: 3mm; text-align: center; }}
    .diag .dsvg {{ text-align: center; }}
    .diag .dsvg svg {{ max-width: 100%; max-height: 90mm; height: auto; }}
    .diag.empty {{ border: 1px dashed #d1d5db; text-align: center; color: #6b7280; }}

    .flow {{ display: flex; gap: 3mm; }}
    .flow .fstep {{ flex: 1; padding: 4mm; background: #eef2ff; border-radius: 4px; font-size: 10pt; text-align: center; }}

    .numbered ol {{ padding-right: 6mm; }}
    .numbered li {{ margin: 2mm 0; }}

    /* ENDING */
    .ending {{ padding: 30mm 20mm; text-align: center; }}
    .ending h1 {{ font-size: 32pt; margin-bottom: 10mm; }}
    .ending p {{ font-size: 13pt; line-height: 1.9; max-width: 130mm; margin: 0 auto 4mm; color: #374151; }}
    .ending .link {{ font-size: 12pt; color: #2563eb; margin-top: 8mm; }}
    """

    parts = [
        "<!DOCTYPE html><html lang='ar' dir='rtl'><head><meta charset='utf-8'>",
        f"<title>كتاب مساراتAI</title><style>{css}</style></head><body>",
    ]

    # --- COVER ---
    parts.append("""
    <section class='cover'>
      <div class='brand'>مساراتAI · masaarat.ai</div>
      <div class='title-block'>
        <h1>كتاب مساراتAI</h1>
        <div class='sub'>المقدمة + ٥ مسارات كاملة<br>Builder · Creator · Automator · Analyst · Business</div>
      </div>
      <div class='meta'>إصدار 1.0 · يونيو 2026</div>
    </section>
    """)

    # --- TOC ---
    parts.append("<section class='pagebreak toc'><h1>الفهرس</h1>")
    for path in data["paths"]:
        meta = PATH_META.get(path["id"], {"label": path["title"], "color": "#6366f1"})
        parts.append(f'<div class="toc-section">'
                     f'<h2 style="background:{meta["color"]}">{esc(meta["label"])} — {esc(path["title"])}</h2>'
                     f'<ol>')
        for mod in path["modules"]:
            for lsn in mod["lessons"]:
                parts.append(f'<li><b>{esc(mod["title"])}</b> · {esc(lsn["title"])}</li>')
        parts.append("</ol></div>")
    parts.append("</section>")

    # --- PATHS ---
    for path in data["paths"]:
        meta = PATH_META.get(path["id"], {"label": path["title"], "color": "#6366f1", "icon": None})
        color = meta["color"]
        icon_svg = ""
        if meta.get("icon"):
            icon_path = BRAND_ICON_DIR / meta["icon"]
            if icon_path.exists():
                icon_svg = icon_path.read_text(encoding="utf-8")

        # Path divider
        parts.append(f"""<section class='pagebreak pdivider' style='background: linear-gradient(135deg, {color} 0%, #1e1b4b 100%);'>
          <div class='picon'>{icon_svg}</div>
          <div class='ptag'>{esc(meta["label"])}</div>
          <h1>{esc(path["title"])}</h1>
          <div class='ptagline'>{esc(path.get("tagline",""))}</div>
        </section>""")

        # Modules & lessons
        for mod in path["modules"]:
            parts.append(f"""<div class='module-hdr' style='--accent:{color}'>
              <div class='mtag'>وحدة {mod["order"]}</div>
              <h2>{esc(mod["title"])}</h2>
              {f'<div class="msub">{esc(mod["subtitle"])}</div>' if mod.get("subtitle") else ''}
            </div>""")

            for lsn in mod["lessons"]:
                parts.append(f"""<article class='lesson' style='--accent:{color}'>
                  <div class='lhdr'>
                    <div class='lnum'>{esc(meta["label"])} · {esc(mod["title"])}</div>
                    <h2>{esc(lsn["title"])}</h2>
                  </div>""")

                for sec in lsn["sections"]:
                    parts.append(f"""<div class='section'>
                      {f'<div class="eyebrow">{esc(sec["eyebrow"])}</div>' if sec.get("eyebrow") else ''}
                      {f'<h3>{esc(sec["title"])}</h3>' if sec.get("title") else ''}
                      {render_block(sec["block"], lsn.get("videoUrl"))}
                    </div>""")

                parts.append("</article>")

    # --- ENDING ---
    parts.append("""<section class='pagebreak ending'>
      <h1>وصلت لآخر الكتاب 🎉</h1>
      <p>الكتاب ده مش نهاية — هو خريطة. التطبيق على المنصة هو اللي بيحوّل الكلام لمهارة.</p>
      <p>كمل رحلتك من الداشبورد، اشترك في المجتمع، وابعتلنا اللي بنيته.</p>
      <div class='link'>masaarat.ai</div>
    </section>""")

    parts.append("</body></html>")
    return "".join(parts)


def main():
    print("→ Loading content…", flush=True)
    data = json.loads(BOOK_JSON.read_text(encoding="utf-8"))
    total_lessons = sum(len(m["lessons"]) for p in data["paths"] for m in p["modules"])
    print(f"  paths={len(data['paths'])} lessons={total_lessons}", flush=True)

    print("→ Building HTML…", flush=True)
    html_str = build_html(data)
    HTML_OUT.write_text(html_str, encoding="utf-8")
    print(f"  wrote {HTML_OUT} ({len(html_str)//1024} KB)", flush=True)

    PDF_OUT.parent.mkdir(parents=True, exist_ok=True)
    print("→ Rendering PDF via headless Chromium…", flush=True)
    cmd = [
        "chromium", "--headless=new", "--no-sandbox", "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={PDF_OUT}",
        f"file://{HTML_OUT}",
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if res.returncode != 0 or not PDF_OUT.exists():
        print("STDOUT:", res.stdout)
        print("STDERR:", res.stderr)
        sys.exit(1)
    size_mb = PDF_OUT.stat().st_size / 1024 / 1024
    print(f"✓ {PDF_OUT}  ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
