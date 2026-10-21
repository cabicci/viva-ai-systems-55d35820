"""Align the local learner preview with the inspected AcademicLessonPage UI.

No platform writes, publication, media regeneration or handover workflow.
"""
from pathlib import Path
import hashlib
import html
import json
import re
from datetime import datetime, timezone

P = Path(__file__).resolve().parents[6]
TARGET = P / 'preview/in-chat-lesson-review.html'
if not TARGET.exists():
    # The tool lives in the independent worktree, below the owning project.
    P = next(p for p in Path(__file__).resolve().parents if (p / 'preview/in-chat-lesson-review.html').exists())
    TARGET = P / 'preview/in-chat-lesson-review.html'
W = next(p for p in Path(__file__).resolve().parents if (p / 'src/components/academic-education/AcademicLessonPage.tsx').exists())
record_dir = P / 'production/L02-L07-bilingual-v1/preview-platform-alignment'
record_dir.mkdir(exist_ok=True)
digest = lambda b: hashlib.sha256(b).hexdigest()
raw = TARGET.read_bytes()
existing_record = record_dir / 'alignment.en.json'
if existing_record.exists():
    prior = json.loads(existing_record.read_text(encoding='utf-8'))
    if digest(raw) != prior['outputSHA256']:
        raise SystemExit('Preview changed since the recorded alignment; inspect before rebuilding.')
    raw = (P / prior['preimage']).read_bytes()
    assert digest(raw) == prior['beforeSHA256']
s = raw.decode('utf-8')
preimage = record_dir / ('preimage-' + digest(raw) + '.html')
if not preimage.exists():
    preimage.write_bytes(raw)
match = re.search(r'(<script[^>]*id="masaarat-course-review-data"[^>]*>)(.*?)(</script>)', s, re.S)
data = json.loads(match[2])
manifest = json.loads((P / 'production/L02-L07-bilingual-v1/delivery/manifest.json').read_text(encoding='utf-8'))
for lesson in data['lessons']:
    for lang in ('ar', 'en'):
        v = lesson[lang]
        parts = re.split(r'(<h3>.*?</h3>)', v['reading'], flags=re.S)
        sections = [{'title': re.sub('<[^>]+>', '', parts[i]), 'body': parts[i+1]}
                    for i in range(1, len(parts)-1, 2)]
        if lesson['id'] == 'L01':
            v['goalsHtml'] = sections[0]['body']
            v['bodySections'] = sections[2:6] + sections[7:9] + [sections[-1]]
            v['practiceHtml'] = sections[9]['body']
            v['faq'] = [sections[i] for i in (3, 5, 8)]
            v['worksheet'] = '../pilot/L01-v1/worksheet-' + lang + '.html'
        else:
            v['goalsHtml'] = sections[0]['body']
            v['bodySections'] = [sections[1]]
            v['practiceHtml'] = sections[3]['body']
            # Reuse existing learner-facing retrieval answers; no private answer keys.
            body = sections[4]['body']
            pairs = re.findall(r'(?:س:|Q:)\s*(.*?[؟?])\s*(.*?)(?=(?:س:|Q:)|</p>|$)', body, re.S)
            v['faq'] = [{'title': re.sub('<[^>]+>', '', q), 'body': '<p>'+a.strip()+'</p>'} for q,a in pairs]
            if not v['faq']:
                v['faq'] = [sections[4]]
            v['worksheet'] = 'materials/' + lesson['id'] + '-worksheet-' + lang + '.html'
        entry = manifest['videos'].get(lesson['id'] + '-' + lang)
        if entry:
            v['videoPath'] = '../' + entry['video']
            v['captionPath'] = '../' + entry['captions']
        elif lesson['id'] == 'L01' and lang == 'ar':
            v['videoPath'] = '../media/L01-ar-pro-full-v1/final/L01-ar.mp4'
            v['captionPath'] = '../media/L01-ar-pro-full-v1/final/L01-ar.vtt'
        else:
            v['videoPath'] = None
        if lesson['id'] != 'L01':
            v['downloads'] = [{'label': k, 'path': f'materials/{lesson["id"]}-{k}-{lang}.html'} for k in ('worksheet','pre','post','bank')]
        else:
            v['downloads'] = [{'label': 'worksheet', 'path': v['worksheet']}]
        for f in v['downloads']:
            assert (TARGET.parent / f['path']).is_file(), f
        if v.get('videoPath'):
            assert (TARGET.parent / v['videoPath']).is_file()

s = s[:match.start(2)] + json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</',r'<\/') + s[match.end(2):]
# Match the actual platform's layout, breakpoint, labels and content organization.
css = '''
    html{font-size:16px}body{margin:0;background:oklch(.995 .003 230)}
    #masaarat-course-review{max-width:1280px;margin:auto;border-radius:0;padding:0 16px 32px;font-size:16px;line-height:2;--ms-line:light-dark(oklch(.30 .04 260 / .10),oklch(.85 .02 230 / .16));--ms-accent:light-dark(oklch(.88 .06 165 / .20),oklch(.40 .05 165 / .20));--ms-muted-bg:light-dark(oklch(.97 .012 230 / .30),oklch(.28 .02 250 / .30))}
    #masaarat-course-review .ms-top{min-height:80px;gap:24px}
    #masaarat-course-review .ms-crumb{font-size:16px;font-weight:700;color:var(--ms-blue);margin:32px 0 20px}
    #masaarat-course-review .ms-picker{margin-bottom:16px;align-items:center}
    #masaarat-course-review .ms-picker h2{font-size:16px;font-weight:400}
    #masaarat-course-review .ms-lesson-header{margin:24px 0;border:1px solid var(--ms-line);border-radius:28px;background:var(--ms-accent);padding:24px}
    #masaarat-course-review .ms-lesson-header p{margin:0;font-size:14px;font-weight:700;color:var(--ms-blue)}
    #masaarat-course-review .ms-lesson-header h1{font-size:30px;line-height:1.5;font-weight:900;margin:16px 0}
    #masaarat-course-review .ms-lesson-header .ms-intro{font-size:16px;color:var(--ms-ink);font-weight:400}
    #masaarat-course-review .ms-layout{grid-template-columns:250px minmax(0,1fr);gap:24px}
    #masaarat-course-review .ms-aside{border:1px solid var(--ms-line);border-radius:28px;padding:16px;background:var(--ms-card);position:sticky;top:96px}
    #masaarat-course-review .ms-nav{border:0;border-radius:0;padding:0;background:transparent;gap:8px}
    #masaarat-course-review .ms-tab{font-weight:700;display:block;min-height:48px;padding:12px;text-align:start;border-radius:12px}
    #masaarat-course-review .ms-tab:hover:not([aria-selected=true]){background:var(--ms-muted-bg)}
    #masaarat-course-review .ms-panel{padding:32px;border-radius:28px;scroll-margin-top:96px}
    #masaarat-course-review .ms-panel h2{font-size:20px;line-height:1.4;margin:0 0 16px}
    #masaarat-course-review .ms-panel h3{font-size:20px;line-height:1.4}
    #masaarat-course-review .ms-panel p{line-height:2;margin:0 0 16px}
    #masaarat-course-review .ms-reading-section{border-top:1px solid var(--ms-line);padding-top:20px;margin-top:24px}
    #masaarat-course-review .ms-question{border:1px solid var(--ms-line);border-radius:12px;padding:16px;margin:0 0 24px;min-width:0}
    #masaarat-course-review .ms-question legend{font-weight:700;padding:0 8px;line-height:2}
    #masaarat-course-review .ms-question:first-child{border-top:1px solid var(--ms-line);padding-top:16px}
    #masaarat-course-review .ms-options{gap:0;margin:0}
    #masaarat-course-review .ms-options label{border:0;background:var(--ms-muted-bg);border-radius:8px;margin:12px 0;padding:12px;gap:12px;line-height:1.75}
    #masaarat-course-review textarea{font-size:16px;line-height:1.75;min-height:120px}
    #masaarat-course-review .ms-video{margin:0}
    #masaarat-course-review video{display:block;aspect-ratio:16/9;width:100%;border-radius:12px;background:#101820}
    #masaarat-course-review .ms-action{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border:1px solid var(--ms-line);border-radius:12px;padding:8px 16px;margin:8px 8px 8px 0;background:var(--ms-blue);color:var(--ms-blue-ink);font-weight:700;text-decoration:none;font-size:14px;line-height:1.5}
    #masaarat-course-review .ms-action.secondary{background:var(--ms-card);color:var(--ms-ink)}
    #masaarat-course-review details{border:1px solid var(--ms-line);border-radius:12px;padding:16px;margin:0 0 24px}
    #masaarat-course-review summary{font-weight:700;line-height:1.75}
    #masaarat-course-review details>div{margin-top:16px}
    #masaarat-course-review .ms-progress{border-top:1px solid var(--ms-line);margin-top:24px;padding-top:20px}
    #masaarat-course-review .ms-progress strong{display:block;margin-bottom:12px}
    #masaarat-course-review progress{width:100%;height:8px;display:block;accent-color:var(--ms-blue)}
    #masaarat-course-review .ms-progress p,#masaarat-course-review .ms-preview-note{font-size:14px;line-height:1.75;color:var(--ms-muted)}
    #masaarat-course-review .ms-adjacent{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:24px}
    #masaarat-course-review .ms-state{color:var(--ms-muted);font-size:14px;line-height:1.75;margin-top:16px}
    @media(max-width:1023px){#masaarat-course-review .ms-layout{grid-template-columns:1fr}#masaarat-course-review .ms-aside{position:static}#masaarat-course-review .ms-nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}#masaarat-course-review .ms-panel{padding:20px}#masaarat-course-review .ms-lesson-header h1{font-size:26px}}
    @media(max-width:480px){#masaarat-course-review .ms-top strong{display:none}#masaarat-course-review .ms-picker{grid-template-columns:1fr}#masaarat-course-review .ms-lesson-header{padding:20px}#masaarat-course-review select{min-width:0;width:100%}#masaarat-course-review .ms-top select{width:auto}#masaarat-course-review .ms-action{max-width:100%;white-space:normal}}
'''
s = s.replace('  </style>', css + '\n  </style>', 1)
# The platform lesson page has no step chooser above the lesson header.
s, removed_pickers = re.subn(r'<div class="ms-picker">.*?</div>', '', s, count=1, flags=re.S)
assert removed_pickers == 1
s = s.replace('<div class="ms-layout">', '<p class="ms-preview-note" data-preview-note></p><header class="ms-lesson-header"><p data-academic-label></p><h1 data-main-title></h1><div class="ms-intro" data-intro></div></header><div class="ms-layout">', 1)
s = s.replace('<nav class="ms-nav" role="tablist" aria-label="أقسام الدرس" data-tabs></nav>', '<aside class="ms-aside"><nav class="ms-nav" role="tablist" aria-label="أقسام الخطوة" data-tabs></nav><section class="ms-progress"><strong data-progress-label></strong><progress max="3" value="0" data-progress></progress><p data-progress-note></p></section></aside>',1)
js = r'''
    (()=>{
      const root=document.getElementById('masaarat-course-review'),data=JSON.parse(document.getElementById('masaarat-course-review-data').textContent);
      const qs=s=>root.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const order=['reading','example','video','quiz','practice','faq','downloads','assistant'];
      const copy={ar:{course:'مصير المبيدات في البيئة',crumb:'ارجع للمنهج',picker:'اختار الخطوة',academic:'مسارات أكاديمي',reading:'الشرح',example:'مثال محلول',video:'الفيديو',quiz:'اختبر فهمك',practice:'طبّق بنفسك',faq:'أسئلة شائعة',downloads:'التحميلات',assistant:'المساعد الذكي',progress:'تقدم الأنشطة',preview:'معاينة محلية لشكل الدرس. التقدم والإجابات هنا للتجربة، ومش مرتبطة بحسابك على المنصة.',progressNote:'التقدم الظاهر خاص بالمعاينة الحالية بس.',markRead:'خلصت قراءة الشرح',submit:'راجع الإجابات',save:'احفظ التطبيق',restore:'رجّع الإجابة المحفوظة',saved:'اتحفظ في المعاينة الحالية فقط.',quizNote:'مراجعة الإجابات وحساب الدرجة على المنصة محتاجين الربط بخدمة التقييم. إجابتك هنا للتجربة فقط.',pre:'قبل ما تبدأ',post:'اختبار بعد الدرس',bank:'بنك الأسئلة',worksheet:'ورقة العمل',print:'افتح النسخة القابلة للطباعة',answer:'اكتب إجابتك ووضّح تفكيرك',assistantNote:'مساعد هذا المنهج يحتاج صلاحية مستقلة وتفعيل الخدمة.',previous:'الخطوة السابقة',next:'الخطوة التالية',step:'الخطوة',of:'من',sections:'أقسام الخطوة',localVideo:'الفيديو المحفوظ للمعاينة المحلية.'},en:{course:'Fate of Pesticides in the Environment',crumb:'Back to curriculum',picker:'Choose a step',academic:'Masaarat Academic',reading:'Reading',example:'Worked example',video:'Video',quiz:'Check understanding',practice:'Practice',faq:'FAQ',downloads:'Downloads',assistant:'AI assistant',progress:'Activity progress',preview:'Local lesson preview. Progress and responses here are for demonstration and are not connected to your platform account.',progressNote:'Progress applies only to this preview session.',markRead:'Mark reading complete',submit:'Submit answers',save:'Save practice submission',restore:'Restore saved response',saved:'Saved in this preview session only.',quizNote:'Answer review and grading require the platform assessment service. These responses are for demonstration only.',pre:'Before you start',post:'After-lesson test',bank:'Question bank',worksheet:'Worksheet',print:'Open printable version',answer:'Write your response and reasoning',assistantNote:'The assistant for this course requires separate access and activation.',previous:'Previous step',next:'Next step',step:'Step',of:'of',sections:'Step sections',localVideo:'Saved video for local preview.'}};
      let state={lesson:'L02',locale:'ar',tab:'reading'},drafts={},choices={},savedDrafts={},activity={};
      const key=()=>state.lesson+'-'+state.locale;
      const draftKey=(group,i)=>key()+'-'+group+'-'+i;
      function questions(items,group){return items.map((q,i)=>`<fieldset class="ms-question"><legend>${esc(q.q)}</legend>${q.options?`<div class="ms-options">${q.options.map((o,j)=>`<label><input type="radio" data-choice="${draftKey(group,i)}" name="${draftKey(group,i)}" value="${j}" ${choices[draftKey(group,i)]===String(j)?'checked':''}><span>${esc(o)}</span></label>`).join('')}</div>`:`<textarea rows="4" maxlength="5000" data-draft="${draftKey(group,i)}" aria-label="${esc(q.q)}" placeholder="${esc(copy[state.locale].answer)}">${esc(drafts[draftKey(group,i)]||'')}</textarea>`}</fieldset>`).join('')}
      function progress(){const a=activity[key()]||{};qs('[data-progress]').value=Number(!!a.read)+Number(!!a.practice)}
      function render(){
        const l=data.lessons.find(x=>x.id===state.lesson),t=copy[state.locale],v=l[state.locale],index=data.lessons.indexOf(l);
        root.dir=state.locale==='ar'?'rtl':'ltr';root.lang=state.locale==='ar'?'ar-EG':'en';
        qs('[data-course-title]').textContent=t.course;qs('[data-crumb]').textContent=t.crumb+' — '+t.course;
        qs('[data-main-title]').textContent=v.title;qs('[data-intro]').textContent=t.course;qs('[data-academic-label]').textContent=t.academic;qs('[data-preview-note]').textContent=t.preview;qs('[data-progress-label]').textContent=t.progress;qs('[data-progress-note]').textContent=t.progressNote;qs('[data-tabs]').setAttribute('aria-label',t.sections);
        qs('[data-locale]').value=state.locale;
        const tabs=order.filter(id=>id!=='video'||v.videoPath);if(!tabs.includes(state.tab))state.tab='reading';
        qs('[data-tabs]').innerHTML=tabs.map(id=>`<button type="button" class="ms-tab cursor-interaction" role="tab" id="ms-tab-${id}" data-tab="${id}" aria-selected="${id===state.tab}" aria-controls="ms-course-panel">${t[id]}</button>`).join('');
        const panel=qs('[data-panel]');panel.setAttribute('aria-labelledby','ms-tab-'+state.tab);panel.setAttribute('aria-label',t[state.tab]);
        if(state.tab==='reading')panel.innerHTML=v.goalsHtml+`<details><summary>${t.pre}</summary><div>${questions(v.pre,'pre')}</div></details>`+v.bodySections.map(s=>`<article class="ms-reading-section"><h2>${esc(s.title)}</h2>${s.body}</article>`).join('')+`<button type="button" class="ms-action" data-action="read">${t.markRead}</button><p class="ms-state" role="status"></p>`;
        if(state.tab==='example')panel.innerHTML=v.example.replace(/<h3>/g,'<h2>').replace(/<\/h3>/g,'</h2>');
        if(state.tab==='video')panel.innerHTML=`<figure class="ms-video"><video controls playsinline preload="none" poster="${v.poster}" src="${esc(v.videoPath)}" aria-label="${esc(v.title)}"><track kind="captions" src="${esc(v.captionPath)}" srclang="${state.locale==='ar'?'ar-EG':'en'}" label="${state.locale==='ar'?'العربية':'English'}"></video><figcaption class="ms-state">${t.localVideo}</figcaption></figure>`;
        if(state.tab==='quiz')panel.innerHTML=questions(v.post,'post')+`<button type="button" class="ms-action" data-action="quiz">${t.submit}</button><p class="ms-state" role="status"></p>`;
        if(state.tab==='practice')panel.innerHTML=v.practiceHtml+questions(v.practice,'practice')+`<button type="button" class="ms-action secondary" data-action="restore">${t.restore}</button><button type="button" class="ms-action" data-action="practice">${t.save}</button><p class="ms-state" role="status"></p>`;
        if(state.tab==='faq')panel.innerHTML=v.faq.map(f=>`<details><summary>${esc(f.title)}</summary><div>${f.body}</div></details>`).join('');
        if(state.tab==='downloads')panel.innerHTML=v.downloads.map(f=>`<p><a class="ms-action secondary" href="${esc(f.path)}" target="_blank" rel="noopener">${t[f.label]} — ${t.print}</a></p>`).join('')+`<details><summary>${t.bank}</summary><div>${questions(v.bank,'bank')}</div></details>`;
        if(state.tab==='assistant')panel.innerHTML=`<p>${t.assistantNote}</p>`;
        qs('[data-adjacent]').innerHTML=(index?`<button type="button" class="ms-action secondary" data-lesson-target="${data.lessons[index-1].id}">${t.previous}</button>`:'<span></span>')+(index<6?`<button type="button" class="ms-action secondary" data-lesson-target="${data.lessons[index+1].id}">${t.next}</button>`:'');
        progress();
      }
      root.addEventListener('change',e=>{if(e.target.matches('[data-locale]')){state.locale=e.target.value;render()}if(e.target.dataset.choice)choices[e.target.dataset.choice]=e.target.value});
      root.addEventListener('input',e=>{if(e.target.dataset.draft)drafts[e.target.dataset.draft]=e.target.value});
      root.addEventListener('click',e=>{const tab=e.target.closest('[data-tab]');if(tab){state.tab=tab.dataset.tab;render();const panel=qs('[data-panel]'),top=panel.getBoundingClientRect().top;if(top<96||top>innerHeight-80)panel.scrollIntoView?.({block:'start',behavior:'auto'})}const nav=e.target.closest('[data-lesson-target]');if(nav){state.lesson=nav.dataset.lessonTarget;state.tab='reading';render();qs('.ms-lesson-header').scrollIntoView?.({block:'start'})}const action=e.target.closest('[data-action]');if(!action)return;const t=copy[state.locale],a=action.dataset.action;activity[key()]??={};if(a==='read'){activity[key()].read=true;qs('[role=status]').textContent=t.saved}if(a==='quiz')qs('[role=status]').textContent=t.quizNote;if(a==='practice'){savedDrafts[key()]={...drafts};activity[key()].practice=true;qs('[role=status]').textContent=t.saved}if(a==='restore'){Object.assign(drafts,savedDrafts[key()]||{});render()}progress()});
      render();
    })();
'''
start=s.rfind('  <script>')
end=s.index('</script>',start)
s=s[:start]+'  <div class="ms-adjacent" data-adjacent></div>\n  <script>\n'+js+'  '+s[end:]
TARGET.write_text(s,encoding='utf-8')
refs=['src/components/academic-education/AcademicLessonPage.tsx','src/lib/academic-education/copy.ts','src/styles.css']
record={'updatedUTC':datetime.now(timezone.utc).isoformat(),'scope':'Local preview alignment only; no platform writes, deployment, CDN upload, generation or handover workflow.', 'tabOrder':['reading','example','video','quiz','practice','faq','downloads','assistant'],'sourceFiles':{p:digest((W/p).read_bytes()) for p in refs},'preimage':preimage.relative_to(P).as_posix(),'beforeSHA256':digest(raw),'output':TARGET.relative_to(P).as_posix(),'outputSHA256':digest(TARGET.read_bytes()),'preserved':'Original curriculum, accepted media, private keys and production delivery manifests unchanged. Existing learner data retained; separate presentation mapping added.','limitations':['Local preview only, not the deployed platform.','No account-backed progress, automatic grading or live assistant.','Local videos, not Bunny embeds.','L01 English current approved video unavailable; corresponding video tab omitted.','Existing printable HTML files are linked honestly, not described as new PDFs.']}
(record_dir/'alignment.en.json').write_text(json.dumps(record,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'output':str(TARGET),'sha256':record['outputSHA256'],'lessons':len(data['lessons']),'videoLinks':sum(bool(l[c].get('videoPath')) for l in data['lessons'] for c in ('ar','en'))}))
