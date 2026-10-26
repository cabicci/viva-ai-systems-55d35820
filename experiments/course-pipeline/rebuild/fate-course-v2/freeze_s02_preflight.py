from pathlib import Path
from decimal import Decimal as D
import json,hashlib,re,sys,shutil,datetime
R=Path(sys.argv[1]).resolve();P=R.parent;B=Path(__file__).parent;now=datetime.datetime.now(datetime.timezone.utc).isoformat();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf8'))
def save(p,v):
 p.parent.mkdir(parents=True,exist_ok=True)
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
checks=load(R/'media-plan/FATE2-S02/interaction-checks.en.json');assert checks['errors']==[] and checks['sourceSHA256']==sha(R/'preview/intake-practice.js')
lesson=load(R/'lessons/FATE2-S02/lesson.public.json');draft=load(R/'media-plan/FATE2-S02/spoken-draft.en.json');scene=load(R/'media-plan/FATE2-S02/scene-plan.en.json');run=load(R/'RUN.en.json')
assert all(sha(P/k)==h for k,h in run['oldEdition']['protectedFilePreimages'].items())
assert sha(P/'sources/Fate-Pesticides-Dr E. Swelam.pdf')==run['sourceSHA256']
assert scene['sourceLessonSHA256']==sha(R/'lessons/FATE2-S02/lesson.public.json') and scene['spokenRequestSHA256']==sha(R/'media-plan/FATE2-S02/spoken-draft.en.json')
assert [s['id'] for s in lesson['ar']['sections']]==[s['id'] for s in lesson['en']['sections']]
assert [x['equation'] for x in lesson['ar']['example']['steps']]==[x['equation'] for x in lesson['en']['example']['steps']]
assert len(draft['parts'])==10
calc=(D('.20')*D('.15')+D('.05')*D('.40'))/D('50');assert calc==D('.0010') and calc/D('.010')*100==10 and D('.08')*D('.25')/D('40')==D('.00050')
index=(R/'preview/index.html').read_text(encoding='utf8');m=re.search(r'<script[^>]*id="public-data"[^>]*>(.*?)</script>',index,re.S);assert m;data=json.loads(m[1]);assert data['lessons']['FATE2-S02']==lesson
previous=load(B/'media-s01-voice38/request.json')
delivery={locale:next(p['delivery'] for p in previous['audio'] if p['locale']==locale) for locale in ['ar-EG','en']} if 'audio' in previous else None
if delivery is None:
 source=load(B/'remaining-scenes38/request.json');delivery={'ar-EG':next(p['delivery'] for p in source['parts'] if p['locale']=='ar'),'en':next(p['delivery'] for p in source['parts'] if p['locale']=='en')}
parts=[]
for locale in ['ar-EG','en']:
 lane=[p for p in draft['parts'] if p['locale']==locale];assert len(lane)==5
 assert [p['sectionID'] for p in lane]==[s['id'] for s in scene['scenes']]
 for i,p in enumerate(lane):
  assert p['voice']==('Charon' if i%2==0 else 'Kore') and p['textSHA256']==hashlib.sha256(p['spokenText'].encode()).hexdigest() and p['sourceLessonSHA256']==sha(R/'lessons/FATE2-S02/lesson.public.json')
  fingerprint={'model':'gemini-3.8-flash-tts','voice':p['voice'],'locale':locale,'spokenText':p['spokenText'],'delivery':delivery[locale],'format':'original provider audio plus decoded WAV/PCM16mono24k; preserve before review'}
  parts.append(dict(p,id=f'S02-{i+1:02}-'+locale,delivery=delivery[locale],deliverySHA256=hashlib.sha256(delivery[locale].encode()).hexdigest(),requestFingerprintSHA256=hashlib.sha256(json.dumps(fingerprint,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()))
O=B/'s02-preflight-v1';O.mkdir(exist_ok=False)
req={'schema':'course-media-preflight.v1','id':'FATE2-S02-preflight-v1','status':'WAITING_NEXT_BATCH_BUDGET_NOT_DISPATCHED','sourcePDFSHA256':run['sourceSHA256'],'sourceLessonSHA256':sha(R/'lessons/FATE2-S02/lesson.public.json'),'scenePlanSHA256':sha(R/'media-plan/FATE2-S02/scene-plan.en.json'),'speechModel':'gemini-3.8-flash-tts','voices':['Charon','Kore'],'funding':{'authorized':False,'ceilingUSD':None,'reason':'Owner25USD applied to first-step batch; next-batch choice remains unanswered. Skill continuation does not refill it.'},'newProviderCalls':0,'productionRoute':'GitHub Actions only after finite funding and fresh service availability verification','ownerAcceptedMethod':'production/voice38-proof-v1/owner-acceptance.en.json','ownerSyncStyle':'production/FATE2-S01-sync-owner-acceptance.en.json','parts':parts,'timing':'No new actual recording exists; timestamps not estimated. Derive actual clocks only after preserving and reviewing originals.','disclosure':'Ordinary public explanation/worked-example only, no private assessment solutions.'}
save(O/'preflight.en.json',req);shutil.copyfile(R/'media-plan/FATE2-S02/scene-plan.en.json',O/'scene-plan.en.json');shutil.copyfile(R/'lessons/FATE2-S02/lesson.public.json',O/'lesson.public.json')
save(R/'media-plan/FATE2-S02/production-preflight.en.json',{'utc':now,'status':req['status'],'worktreeRelativePackage':'Worktrees/actor-0c0df2131ade371ac908/experiments/course-pipeline/rebuild/fate-course-v2/s02-preflight-v1','preflightSHA256':sha(O/'preflight.en.json'),'parts':len(parts),'newProviderCalls':0,'budgetDependency':req['funding'],'checks':'interaction-checks.en.json','sourceReview':'definition-review.en.json'})
review={'utc':now,'scope':'S02 Arabic/English revised reading and spoken plan, interactive guided arithmetic and scene contracts.','reviewer':'Same author assistant; no independent/native certification.','inputHashes':{str(p.relative_to(R)).replace('\\','/'):sha(p) for p in [R/'lessons/FATE2-S02/lesson.public.json',R/'lessons/FATE2-S02/lesson.ar.md',R/'lessons/FATE2-S02/lesson.en.md',R/'media-plan/FATE2-S02/spoken-draft.en.json',R/'media-plan/FATE2-S02/scene-plan.en.json',R/'preview/intake-practice.js',R/'preview/index.html',R/'preview/app.js']},'verified':['Actual Codex and EPA primary passages reopened; lifetime/appreciable-risk/recommended-limit qualifiers completed.','Arithmetic and percentage checked separately using Decimal, including existing transfer case.','Aligned section identities, worked equations and five coherent alternating-voice passages per locale.','Actual current embedded learner lesson equals the revised authored public lesson.','Appropriate Arabic shadda, spoken acronym and numeric contexts revised; written lesson/captions remain separate.','217in-memory behavior checks including154existing tab views, actual current module identity, invalid/error/zero/reveal/reset/locale isolation.','No originalPDF, prior selected speech/video, private answer keys or old edition controls changed.'],'notTested':['New actual speech, acoustic/native pronunciation and exact timing: not yet generated.','New imagery or synchronized motion: contracts only.','Native browser pixels, physicaldevice/assistive interaction and full native playback.','Independent expert/native language review.'],'disposition':'Ready for a bounded funded media request after funding; guided interactive preview available now.','reuses':['Accepted3.8Charon/Kore delivery method, no new method acceptance invented.','Existing qualitative sample image only within declared role.','Earlier batch-review remains historical for its pinned inputs; this receipt supersedes only the changed S02 scope.']}
save(R/'media-plan/FATE2-S02/skills-review.en.json',review)
for s in run['stageQueue']:
 if s['id']=='s02-practice-and-spoken':s['status']='guided_interaction_checked_spoken_scene_plan_ready_waiting_finite_media_budget';s['outputs']+=['media-plan/FATE2-S02/skills-review.en.json','media-plan/FATE2-S02/production-preflight.en.json']
 if s['id']=='content-review':s['status']='written_batch_prior_review_retained_with_S02_scoped_recheck';s['outputs'].append('media-plan/FATE2-S02/skills-review.en.json')
run['stoppingPoint']='S01 bilingual masters remain selected and unchanged. S02 revised source-complete definitions, contextual Egyptian/English spoken plans,5scene contracts and guided intake interaction are saved and checked.10future speech requests are frozen as NOT_DISPATCHED. No new paid production started.'
run['nextAction']='Receive owner next-batch ceiling decision, then verify live model availability and fund only a finite scoped GitHub Actions request. Preserve first-step audio and unchanged assets. Without funding, continue only independent unpaid skill stages.'
run['pendingDecisions']=[{'id':'next-media-batch-ceiling','question':'25USD remaining path,10USD nextbatch, or unpaidstagesonly?','status':'awaiting_actual_owner_answer','previousCeilingScope':'first-step-only','automaticRefill':False}];run['updatedUTC']=now;save(R/'RUN.en.json',run)
print(json.dumps({'frozenParts':len(parts),'arithmetic':'passed','consumerParity':'passed','paidDispatch':'not_started','preflightSHA256':sha(O/'preflight.en.json')}))
