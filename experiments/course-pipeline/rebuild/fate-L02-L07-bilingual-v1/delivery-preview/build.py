"""Build a local, dependency-free course reading/practice preview.

This preview is deliberately not a deployed Masaarat lesson or media release.
The private assessment bank is never copied into preview/.
"""
from __future__ import annotations

import html
import json
import re
import argparse
from pathlib import Path

args=argparse.ArgumentParser();args.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);ROOT=args.parse_args().root
HERE = Path(__file__).resolve().parent


def inline(value: str) -> str:
    value = html.escape(value)
    value = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", value)
    value = re.sub(r"`([^`]+)`", r"<code>\1</code>", value)
    return value


def markdown(fragment: str) -> str:
    result = []
    for paragraph in re.split(r"\n\s*\n", fragment.strip()):
        lines = paragraph.strip().splitlines()
        if not lines:
            continue
        first = lines[0]
        if first.startswith("### "):
            result.append(f"<h3>{inline(first[4:])}</h3>")
            if len(lines) > 1:
                result.append("<p>" + "<br>".join(inline(x) for x in lines[1:]) + "</p>")
        elif first.startswith("## "):
            result.append(f"<h2>{inline(first[3:])}</h2>")
        elif first.startswith("# "):
            result.append(f"<h1>{inline(first[2:])}</h1>")
        else:
            result.append("<p>" + "<br>".join(inline(x) for x in lines) + "</p>")
    return "\n".join(result)


LESSONS = [
    ("L01", "food-residues"), ("L02", "limits-regulation"),
    ("L03", "exposure-toxicology"), ("L04", "bioaccumulation"),
    ("L05", "bioconcentration-metrics"), ("L06", "ecotoxicity"),
    ("L07", "properties-fate"),
]


def main() -> None:
    data = []
    for lesson_id, slug in LESSONS:
        text = (ROOT / "curriculum" / f"{lesson_id}-{slug}.md").read_text(encoding="utf-8")
        head, rest = text.split("## English learner package", 1)
        english, arabic = rest.split("## الحزمة التعليمية بالمصري", 1)
        arabic, references = arabic.rsplit("References:", 1)
        title = head.splitlines()[0].removeprefix("# ")
        en_title, ar_title = [x.strip() for x in title.split(" | ", 1)]
        rebuilt=ROOT/'curriculum/rebuild/batch-L02-L07-v1'/lesson_id
        if rebuilt.exists():
            english=(rebuilt/'lesson.en.md').read_text(encoding='utf-8');arabic=(rebuilt/'lesson.ar.md').read_text(encoding='utf-8')
            en_title=english.splitlines()[0].removeprefix('# ');ar_title=arabic.splitlines()[0].removeprefix('# ')
            english=english.split('\n',1)[1];arabic=arabic.split('\n',1)[1]
        data.append({"id": lesson_id, "enTitle": en_title, "arTitle": ar_title,
                     "en": markdown(english), "ar": markdown(arabic),
                     "references": "References:" + references.strip(),
                     "source": head.strip().splitlines()[2:]})
    (HERE / "course-data.js").write_text("window.COURSE_DATA = " + json.dumps(data, ensure_ascii=False).replace("</", "<\\/") + ";\n", encoding="utf-8")
    print(f"Built reading preview for {len(data)} lessons; private bank excluded.")
    bank=json.loads((ROOT/'assessment/rebuild-L02-L07-v1/questions.json').read_text(encoding='utf-8'))['items']
    materials=HERE/'materials';materials.mkdir(exist_ok=True)
    def page(title,body,locale):
        return '<!doctype html><html lang="'+locale+'" dir="'+('rtl' if locale=='ar' else 'ltr')+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(title)+'</title><style>@font-face{font-family:Tajawal;src:url(../assets/Tajawal-Regular.woff2)}body{font-family:Tajawal,Arial,sans-serif;max-width:900px;margin:32px auto;padding:24px;line-height:1.9;color:#183b50}article{break-inside:avoid;border-bottom:1px solid #ccdce4;padding:20px 0}li{margin:12px 0}.answer{height:100px;border-bottom:1px dashed #999}button{padding:10px 24px}@media print{button{display:none}body{margin:0}}bdi,code{unicode-bidi:isolate}</style><button onclick="window.print()">'+('طباعة' if locale=='ar' else 'Print')+'</button><h1>'+html.escape(title)+'</h1>'+body+'</html>'
    for lesson_id,_ in LESSONS[1:]:
        for locale in ['ar','en']:
            for kind in ['pre','post','bank']:
                title=({'pre':'أسئلة قبل الدرس','post':'أسئلة بعد الدرس','bank':'بنك أسئلة الدرس'} if locale=='ar' else {'pre':'Before the lesson','post':'After the lesson','bank':'Lesson question bank'})[kind]+' — '+lesson_id
                body=''
                for q in bank:
                    if q['lesson']!=lesson_id or (kind!='bank' and q['use']!=kind):continue
                    item=q[locale];body+='<article><h2>'+html.escape(q['id'])+'</h2><p>'+inline(item['q'])+'</p>'
                    if item.get('options'):body+='<ul>'+''.join('<li>□ '+inline(x)+'</li>' for x in item['options'])+'</ul>'
                    else:body+='<div class="answer"></div>'
                    body+='</article>'
                (materials/(lesson_id+'-'+kind+'-'+locale+'.html')).write_text(page(title,body,locale),encoding='utf-8')
            text=(ROOT/'assessment/rebuild-L02-L07-v1'/(lesson_id+'-worksheet.'+locale+'.md')).read_text(encoding='utf-8')
            (materials/(lesson_id+'-worksheet-'+locale+'.html')).write_text(page(('ورقة عمل' if locale=='ar' else 'Worksheet')+' — '+lesson_id,markdown(text),locale),encoding='utf-8')


if __name__ == "__main__":
    main()
