from batch_common import *
import re,html
history=R/'history/before-reading-visuals';history.mkdir(exist_ok=False)
for rel in ['lessons/FATE2-S01/lesson.public.json','preview/index.html','preview/app.js','lessons/FATE2-S03/trace.en.json','source-audit/corrections.en.json','source-audit/references.en.json']:
 p=history/rel;p.parent.mkdir(exist_ok=True,parents=True);p.write_bytes((R/rel).read_bytes())
visuals=json.loads((R/'media-plan/FATE2-S01/visual-review.en.json').read_text(encoding='utf8'))['items']
vmap={x['id']:x for x in visuals}
p=R/'lessons/FATE2-S01/lesson.public.json';s=json.loads(p.read_text(encoding='utf8'))
s['visuals']={section:{'src':'../'+vmap[asset]['file'],'alt':{'ar':ar,'en':en},'caption':{'ar':'تصوّر تعليمي مولّد؛ مش نتيجة تجربة أو دليل تعرّض.','en':'Generated teaching illustration; not experimental or exposure evidence.'},'sha256':vmap[asset]['sha256']} for section,asset,ar,en in [('opening','result-versus-claim','فلفل في صينية عينات، وورقة تقرير وميزان بلا قراءة.','Peppers in a sample tray, blank report and balance without a reading.'),('residue','sample-basis','ثمرة فلفل كاملة وجزء مقطوع، وصينية وزن ووعاء فارغان.','Whole and sectioned pepper, an empty balance pan and container.'),('pathway','source-pathway-receptor','تصوّر مقطعي لحقل ومجرى مائي؛ لا يثبت حدوث انتقال أو ضرر.','Conceptual field-to-stream cutaway; it does not establish transport or harm.') ]}
p.write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
page=R/'preview/index.html';text=page.read_text(encoding='utf8');m=re.search(r'(<script id="public-data" type="application/json">)(.*?)(</script>)',text,re.S);payload=json.loads(m[2]);payload['lessons']['FATE2-S01']=s;payload['lesson']=s
text=text[:m.start(2)]+json.dumps(payload,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+text[m.end(2):];page.write_text(text,encoding='utf8')
app=R/'preview/app.js';text=app.read_text(encoding='utf8');old='${paragraphs(s.paragraphs)}</article>';new='${paragraphs(s.paragraphs)}${data.lesson.visuals?.[s.id]?`<figure style="margin:20px 0"><img src="${esc(data.lesson.visuals[s.id].src)}" alt="${esc(data.lesson.visuals[s.id].alt[lang])}" style="display:block;width:100%;height:auto;border-radius:18px" loading="lazy"><figcaption class="note">${esc(data.lesson.visuals[s.id].caption[lang])}</figcaption></figure>`:\'\'}</article>'
assert old in text;text=text.replace(old,new);app.write_text(text,encoding='utf8')

# Reconcile the repaired trace and the same correction/reference register, preserving its preimage.
p=R/'lessons/FATE2-S03/trace.en.json';a=json.loads(p.read_text(encoding='utf8'));a['sections']['evidence-and-committee-scope']={'sourcePages':[8],'sourceItems':[f'SRC01-P08-REG{i:02}' for i in range(1,7)]+[f'SRC01-P08-CCPR{i:02}' for i in range(1,7)],'scope':'Explicit six toxicological evidence types and six current committee terms; repaired consumer verified.'};a['references']=json.loads((R/'lessons/FATE2-S03/lesson.public.json').read_text(encoding='utf8'))['references'];p.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
p=R/'source-audit/references.en.json';a=json.loads(p.read_text(encoding='utf8'));urls={x['url'] for x in a['references']};newrefs=json.loads((R/'source-audit/batch-reference-receipt.en.json').read_text(encoding='utf8'))['references']
for i,x in enumerate(newrefs):
 if x['url'] not in urls:a['references'].append({'id':f'BATCH-REF-{i+1:02}',**x});urls.add(x['url'])
p.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
p=R/'source-audit/corrections.en.json';a=json.loads(p.read_text(encoding='utf8'))
for c in a['corrections']:
 if c['id']=='C12':c.update(status='resolved_for_bounded_current_role_teaching_in_S03_no_local_compliance_claim',evidence=['source-audit/references.en.json','source-audit/written-coverage-review.en.json'],impact=['FATE2-S03 reading in both locales','S03 trace','embedded learner preview'])
 if c['id']=='C09':c.update(status='qualified_in_S06_S07_no_fat_only_or_fixed_transfer_rule',impact=['FATE2-S06','FATE2-S07'])
p.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

esc=html.escape;rows=[]
for i in range(1,7):
 cols=[]
 for locale,label in [('ar-EG','العربي'),('en','English')]:
  id=f'S01-{i:02}-{locale}';folder=R/'production/FATE2-S01-voice38-v1/artifacts'/('fate-v2-full38-original-'+id);v=json.loads((folder/'verification.json').read_text(encoding='utf8'));f=folder/(id+'.wav');assert hashlib.sha256(f.read_bytes()).hexdigest()==v['wavSHA256'];src='../'+f.relative_to(R).as_posix()
  cols.append(f'<div><h3>{label} · {esc(v["voice"])} · {v["durationSeconds"]:.2f}s</h3><audio controls preload="none" src="{esc(src)}"></audio><p class="note">Gemini3.8 · التسجيل الأصلي محفوظ؛ مراجعة كل جزء مستقلة.</p></div>')
 rows.append(f'<section class="station"><h2>المقطع {i}</h2><div class="media-grid">'+''.join(cols)+'</div></section>')
figures=''.join('<figure class="station"><img style="width:100%;height:auto" src="../'+esc(x['file'])+'" alt="'+esc(x['id'])+'"><figcaption>تصوّر تعليمي مولّد، وليس نتيجة تجربة. الصورة المسطّحة لها مظهر ثلاثي الأبعاد؛ مش نموذج هندسي تفاعلي.</figcaption></figure>' for x in visuals)
doc='<!doctype html><html lang="ar-EG" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>مراجعة وسائط الخطوة الأولى</title><link rel="stylesheet" href="style.css"><style>body{max-width:1200px;margin:auto;padding:24px;line-height:1.9}audio{width:100%}.media-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}@media(max-width:700px){.media-grid{grid-template-columns:1fr}}</style><body><a href="index.html#step/FATE2-S01">ارجع للخطوة الأولى</a><h1>صوت وصور الخطوة الأولى</h1><p>مراجعة إنتاج النسخة الجديدة. طريقة الإلقاء بالنموذج Gemini3.8 معتمدة؛ اعتماد العينة لا يعني مراجعة كل تسجيل لاحق. عينة المزامنة والفيديو الكامل لهم مراجعة منفصلة.</p>'+''.join(rows)+'<h2>الصور المحفوظة</h2>'+figures+'</body></html>'
save('preview/media-review.html',doc)
save('display-media-change.en.json',{'change':'Three inspected generated illustration ingredients added to S01 reading; owner-only media review page exposes12 actual3.8 originals and three images.','unchangedSpeech':'No spoken text/delivery/voice/model request changed for these display additions; no TTS invalidation.','traceRepair':'S03 trace and same source correction/reference registers reconciled with actual repaired reading.','previousEditionChanged':False,'native3DClaimed':False,'notTested':['Native browser pixels','Print pagination','Final video acceptance']})
print('Added three real illustrations to S01 reading and a playable12-recording owner review page; reconciled trace/corrections.')
