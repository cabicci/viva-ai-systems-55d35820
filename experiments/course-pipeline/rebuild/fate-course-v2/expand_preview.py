"""Integrate actual written lessons in the local v2 preview, preserving its prior build."""
from batch_common import P,R,mapping
from pathlib import Path
import json,re,hashlib,html

out=R/'preview'; history=R/'history/before-full-written-preview'
history.mkdir(parents=True,exist_ok=False)
for name in ['index.html','app.js','style.css']:(history/name).write_bytes((out/name).read_bytes())
lessons={}; assessments={}
for spec in mapping['steps']:
    id=spec['id']; lessons[id]=json.loads((R/f'lessons/{id}/lesson.public.json').read_text(encoding='utf8'))
    assessments[id]=json.loads((R/f'lessons/{id}/assessment.public.json').read_text(encoding='utf8'))
payload={'lesson':lessons['FATE2-S01'],'questions':assessments['FATE2-S01'],'lessons':lessons,'assessments':assessments,'map':mapping}
page=(out/'index.html').read_text(encoding='utf8')
encoded=json.dumps(payload,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
page=re.sub(r'(<script id="public-data" type="application/json">).*?(</script>)',lambda m:m[1]+encoded+m[2],page,flags=re.S)
assert '"FATE2-S11"' in page
(out/'index.html').write_text(page,encoding='utf8')
js=(out/'app.js').read_text(encoding='utf8')
needle="let lang='ar',tab='reading',view='paths',drafts={},choices={},calcs={};"
replacement=needle+"\nlet activeID='FATE2-S01'; Object.defineProperty(data,'lesson',{get:()=>data.lessons[activeID]}); Object.defineProperty(data,'questions',{get:()=>data.assessments[activeID]});"
assert needle in js;js=js.replace(needle,replacement,1)
js=js.replace('نسخة إعادة البناء للمراجعة: المعروض مسودة الخطوة الأولى وخطة بقية المسار. الصوت والفيديو لسه ما اتنتجوش للنسخة دي.','نسخة إعادة البناء: ١١ خطوة مكتوبة بالعربي والإنجليزي، بأمثلة وأسئلة وتطبيقات. الصوت والفيديو الجديدان لسه في مرحلة الإعداد.')
js=js.replace('Rebuild review: the first written step and the proposed path plan. No new-edition audio or video has been produced.','Rebuild review: all 11 written steps in Arabic and English, with examples, questions and practice. New-edition audio and video remain in preparation.')
js=js.replace('id===data.lesson.id?', 'data.lessons[id]?').replace('href="#step/FATE2-S01"','href="#step/${id}"')
js=js.replace("calcs[lang]", "calcs[activeID+'-'+lang]")
js=js.replace("practice-${lang}-${i}","practice-${activeID}-${lang}-${i}").replace("'practice-'+lang+'-'+i","'practice-'+activeID+'-'+lang+'-'+i")
start=js.index("if(tab==='practice'){")
end=js.index("\nif(tab==='faq')",start)
original=js[start:end]
reasoning="""if(tab==='practice' && v.guided.kind==='reasoning'){
panel.innerHTML=`<h2>${esc(v.guided.title)}</h2><p>${rich(v.guided.scenario)}</p>${v.guided.prompts.map((q,i)=>`<label class="answer-field">${rich(q)}<textarea rows="4" data-draft="guided-${activeID}-${lang}-${i}">${esc(drafts['guided-'+activeID+'-'+lang+'-'+i]||'')}</textarea></label>`).join('')}<details><summary>${lang==='ar'?'إرشاد للتفكير':'Reasoning support'}</summary><p>${rich(v.guided.support)}</p></details><section class="reading-section"><h2>${lang==='ar'?'طبّق بنفسك':'Independent practice'}</h2>${v.practice.map((q,i)=>`<label class="answer-field">${rich(q)}<textarea rows="4" data-draft="practice-${activeID}-${lang}-${i}">${esc(drafts['practice-'+activeID+'-'+lang+'-'+i]||'')}</textarea></label>`).join('')}</section><p class="note">${t.local}</p>`;
}else """
js=js[:start]+reasoning+original+js[end:]
js=js.replace('href="worksheet-${lang}.html"','href="worksheet-${activeID}-${lang}.html"')
js=js.replace('${t.sourceNote}',"${lang==='ar'?'الصفحات المرتبطة بالخطوة: ':'Source pages for this step: '}${data.lesson.sourcePages.join(', ')}. ${lang==='ar'?'الأمثلة الحسابية مؤلفة للتدريب؛ الإضافات والتصحيحات موثقة.':'Numerical cases are authored for teaching; additions and corrections are documented.'}")
oldlinks='<p><a href="https://codex.fao.org/codex-texts/codex-online-databases/pesticides-residues/glossary" target="_blank" rel="noopener">Codex</a> · <a href="https://www.epa.gov/pesticide-science-and-assessing-pesticide-risks/assessing-human-health-risk-pesticides" target="_blank" rel="noopener">EPA</a></p>'
newlinks='${(data.lesson.references||[{title:"Codex",url:"https://codex.fao.org/codex-texts/codex-online-databases/pesticides-residues/glossary"},{title:"EPA",url:"https://www.epa.gov/pesticide-science-and-assessing-pesticide-risks/assessing-human-health-risk-pesticides"}]).map(r=>`<p><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a></p>`).join(\'\')}'
assert oldlinks in js;js=js.replace(oldlinks,newlinks)
oldroute="function route(){view=location.hash==='#path'?'path':location.hash==='#step/FATE2-S01'?'step':'paths';tab='reading';render()}"
newroute="function route(){const match=location.hash.match(/^#step\\/(FATE2-S\\d{2})$/); if(match&&data.lessons[match[1]]){activeID=match[1];view='step'}else{view=location.hash==='#path'?'path':'paths'} tab='reading';render()}"
assert oldroute in js;js=js.replace(oldroute,newroute)
(out/'app.js').write_text(js,encoding='utf8')
for id,lesson in lessons.items():
    for l in ['ar','en']:
        v=lesson[l]; esc=html.escape
        body=f'<h1>{esc(v["title"])}</h1><p>'+('ورقة تطبيق — سجّل السبب والوحدة والافتراض. الأجوبة المستقلة للمراجعة التعليمية.' if l=='ar' else 'Practice worksheet — show reasoning, units and assumptions. Independent responses require educational review.')+'</p>'
        for label,stage in [('قبل ما تبدأ' if l=='ar' else 'Before you start','diagnostic'),('بعد الشرح' if l=='ar' else 'After the explanation','post'),('تحدي إضافي' if l=='ar' else 'Transfer challenge','bank')]:
            body+='<h2>'+label+'</h2>'
            for q in assessments[id]['items']:
                if q['stage']==stage:
                    body+='<article><h3>'+esc(q[l]['question'])+'</h3>'+'<ol>'+''.join('<li>'+esc(o)+'</li>' for o in q[l].get('options',[]))+'</ol><div class="space"></div></article>'
        body+='<h2>'+('الممارسة المستقلة' if l=='ar' else 'Independent practice')+'</h2>'+''.join('<article><p>'+esc(q)+'</p><div class="space"></div></article>' for q in v['practice'])
        doc=f'<!doctype html><html lang="{l}" dir="{"rtl" if l=="ar" else "ltr"}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(v["title"])}</title><link rel="stylesheet" href="style.css"><style>body{{max-width:900px;margin:auto;padding:24px;line-height:2}}article{{break-inside:avoid}}.space{{height:90px;border-bottom:1px dotted #aaa}}@media print{{body{{padding:0}}}}</style><body>{body}</body></html>'
        target=out/f'worksheet-{id}-{l}.html';assert not target.exists();target.write_text(doc,encoding='utf8')
print('Integrated 11 actual bilingual steps and 22 linked printable worksheets; previous preview retained.')
