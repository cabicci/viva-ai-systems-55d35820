"""New-edition authoring helpers. Exclusive creation; no provider, handover or old-edition writes."""
from pathlib import Path
from datetime import datetime, timezone
import json, hashlib

P=next(p for p in Path(__file__).resolve().parents if (p/'HANDOVER.md').exists())
R=P/'rebuild-v2'
C=P.parent/'Masaarat — Temporary'
registry=json.loads((C/'PORTABLE-STATE/registry.json').read_text(encoding='utf8'))
assert registry['role']=='masaarat-portable-registry'
assert registry['dataset_id']=='5c9e6cba-f8cd-4006-88be-ff7cc35862a1'
state=json.loads((C/registry['storage_root']/'projects/82922e08-4caf-48f5-b72e-ab2e6a87c51c/state.json').read_text(encoding='utf8'))
assert not state.get('active_session') and not state.get('external_writer')
mapping=json.loads((R/'blueprint/map.en.json').read_text(encoding='utf8'))

def save(rel, obj):
    p=R/rel; p.parent.mkdir(exist_ok=True,parents=True)
    with p.open('x',encoding='utf8',newline='\n') as f:
        f.write(obj if isinstance(obj,str) else json.dumps(obj,ensure_ascii=False,indent=2)+'\n')

def section(id,ar_title,ar,en_title,en):
    return {'id':id,'ar':{'title':ar_title,'paragraphs':ar.strip().split('\n\n')},'en':{'title':en_title,'paragraphs':en.strip().split('\n\n')}}

def question(code,stage,ar,en,criterion,options=None,answer=None,rationale=None):
    q={'id':code,'stage':stage,'type':'mcq' if options else 'constructed','ar':{'question':ar},'en':{'question':en}}
    if options: q['ar']['options'],q['en']['options']=options
    key={'id':code,'reasoningCriterion':criterion,'answerIndex':answer,'rationale':rationale or criterion}
    return q,key

def author(n,sections,outcomes,example,guided,practice,faq,summary,questions,refs,notes,visual):
    id=f'FATE2-S{n:02}'; spec=next(s for s in mapping['steps'] if s['id']==id)
    assert not (R/f'lessons/{id}').exists(), 'Existing lesson must be inspected, not overwritten'
    lesson={'id':id,'version':'written-batch-v1','sourcePages':spec['sourcePages'],'sourceItems':spec['sourceItemIDs'],'status':'written_draft_self_review_pending_not_media_complete','references':refs,'editorialNotes':notes}
    for k,l in enumerate(['ar','en']):
        lesson[l]={'title':spec['title'][l],'intro':outcomes[k][0],'outcomes':outcomes[k],
        'sections':[dict(id=s['id'],**s[l]) for s in sections],
        'example':{'title':example[k]['title'],'scenario':example[k]['scenario'],'steps':[{'text':t,'equation':e} for t,e in example[k]['steps']],'conclusion':example[k]['conclusion'],'commonError':example[k]['error']},
        'guided':{'kind':'reasoning','title':'تطبيق بإرشاد' if l=='ar' else 'Guided reasoning','scenario':guided[k]['scenario'],'prompts':guided[k]['prompts'],'support':guided[k]['support']},
        'practice':practice[k],'faq':[{'question':q,'answer':a} for q,a in faq[k]],'summary':summary[k],
        'next':('ارجع لمحطات المسار، وراجع المتطلبات المقترحة للخطوة التالية.' if l=='ar' else 'Return to the path stations and check the recommended prerequisites for the next step.')}
    public={'items':[q for q,key in questions]}
    private={'lessonID':id,'authorship':'New authored teaching cases and criteria; no recovered teacher key or expert validation claimed.','items':[dict(key,id=f'{id}-{key["id"]}') for q,key in questions]}
    for q in public['items']: q['id']=id+'-'+q['id']
    save(f'lessons/{id}/lesson.public.json',lesson)
    save(f'lessons/{id}/assessment.public.json',public)
    save(f'private/{id}-assessment-key.en.json',private)
    for l in ['ar','en']:
        v=lesson[l]; ex=v['example']; lines=['# '+v['title'],'',v['intro'],'']
        lines+=['- '+x for x in v['outcomes']]
        for s in v['sections']: lines+=['','## '+s['title'],'']+s['paragraphs']
        lines+=['','## '+ex['title'],'',ex['scenario'],'']
        for s in ex['steps']: lines+=[s['text'],'',s['equation'],'']
        lines += [ex['conclusion'],'',ex['commonError'],'','## '+v['guided']['title'],'',v['guided']['scenario']]+['- '+x for x in v['guided']['prompts']]+['',v['guided']['support']]
        lines+=['','## '+('طبّق بنفسك' if l=='ar' else 'Independent practice'),'']+['- '+x for x in v['practice']]
        for f in v['faq']:lines+=['','### '+f['question'],'',f['answer']]
        lines+=['','## '+('الخلاصة' if l=='ar' else 'Take-away'),'']+['- '+x for x in v['summary']]
        lines+=['','## '+('المراجع والإضافات' if l=='ar' else 'References and additions'),'']+['- ['+r['title']+']('+r['url']+')' for r in refs]
        save(f'lessons/{id}/lesson.{l}.md','\n\n'.join(lines)+'\n')
        ws=['# '+v['title'],'',('ورقة تطبيق — سجّل افتراضاتك وخطوات استدلالك. أمثلة التدريب افتراضية؛ مش قياسات حقلية.' if l=='ar' else 'Practice worksheet — record assumptions and reasoning. Training cases are hypothetical, not field measurements.'),'']
        for label,stage in [('قبل ما تبدأ' if l=='ar' else 'Before you start','diagnostic'),('بعد الشرح' if l=='ar' else 'After the explanation','post'),('تحدّي إضافي' if l=='ar' else 'Transfer challenge','bank')]:
            ws+=['## '+label,'']
            for q in public['items']:
                if q['stage']==stage:
                    ws += [q[l]['question']]+['- '+o for o in q[l].get('options',[])]+['','................................................................','']
        save(f'lessons/{id}/worksheet.{l}.md','\n'.join(ws))
    save(f'lessons/{id}/trace.en.json',{'lessonID':id,'sourceSHA256':json.loads((R/'RUN.en.json').read_text(encoding='utf8'))['sourceSHA256'],'sourcePages':spec['sourcePages'],'sourceItems':spec['sourceItemIDs'],'sections':{s['id']: {'sourcePages':spec['sourcePages'],'scope':'Editorial explanation plus explicitly authored training reasoning; see reference applicability.'} for s in sections},'references':refs,'notes':notes,'claimsNotAdopted':['Source claim is not validated merely by inclusion in a table or figure.'],'practicalEvidence':'Theoretical and digital rehearsal only.','assessmentIDs':[q['id'] for q in public['items']],'reviewIndependence':'Author self-check only; not an independent subject or native-language certification.'})
    save(f'lessons/{id}/media-brief.en.md',f'# {id}: teaching media contract\n\n{visual}\n\nKeep exact Arabic/English labels editable in platform fonts. Use realistic generated three-dimensional ingredients where they explain the system; do not turn the course into cartoon characters or slides with decorative zoom. Scientific schematics are labelled conceptual and not to scale. Do not fabricate measured data or causal effects. Separate display text, Egyptian/English spoken passages and captions. Charon/Kore alternate complete passages without on-screen characters. No audio has been generated for this new text. Timing must come from actual accepted audio, not paragraph length. Preserve unchanged accepted originals. Gemini imagery and TTS availability, finite budget, listening and synchronization gates apply before paid production. GitHub Actions is the authorized render route; each completed scene must be retained independently.\n')
    return id

def ref(title,url,scope): return {'title':title,'url':url,'applicability':scope,'access':'Actual returned primary passage inspected; not a claim that the entire linked standard was read.'}
