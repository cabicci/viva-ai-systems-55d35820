"""One authorized coherent S11 Arabic passage repair; preserve other91 originals."""
from pathlib import Path
import json,hashlib,shutil,datetime
B=Path(__file__).parent;W=B.parents[3];R=W.parent.parent/'rebuild-v2';O=B/'s11-speech-repair-v1';O.mkdir(exist_ok=False)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def load(p):return json.loads(p.read_text(encoding='utf8'))
def text(p,s):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(s)
def save(p,v):text(p,json.dumps(v,ensure_ascii=False,indent=2)+'\n')
old=load(B/'funded-rest-v1/request.json');source=next(c for c in old['segments'] if c['id']=='S11-05-ar-EG');assert source['voice']=='Charon'
D=R/'production/rest-voice-recheck-v1/artifacts/fate-v2-rest-voice-recheck-S11-05-ar-EG'
evidence=[{'run':40303810208,'artifact':D.name,'file':f,'sha256':sha(D/f)} for f in ['review-disposition.en.json','blind-analysis.en.json','reference-analysis.en.json']]
ref=load(D/'reference-analysis.en.json');assert ref['validation']['validForReview'] and ref['validation']['targetAudioSHA256']=='a9b01f71b8b87748e5e20b4a71d704c9355a56b312b665cb0db0ee1df3c4b506'
assert any(f['heard']=='وتر' and f['expected']=='مطر' and f['certainty']=='clear' for f in ref['findings'])
original=R/'production/funded-rest-v1/artifacts/fate-v2-rest-original-S11-05-ar-EG/S11-05-ar-EG.wav';assert sha(original)==ref['validation']['targetAudioSHA256']
beforeClause='ولو نزل مطر ولقينا مادّة في الميّه';afterClause='ولو نزلت أمطار، ولقينا مادّة في الميّه';assert source['spokenText'].count(beforeClause)==1
new=source['spokenText'].replace(beforeClause,afterClause);newsha=hashlib.sha256(new.encode()).hexdigest()
L=R/'lessons/FATE2-S11/lesson.public.json';lessonsha=sha(L);assert lessonsha.startswith('8187')
draft_file=R/'media-plan/FATE2-S11/spoken-draft.en.json';script=R/'media-plan/FATE2-S11/script.ar.md';draft=load(draft_file);part=next(c for c in draft['parts'] if c['sectionID']==source['sectionID'] and c['locale']=='ar-EG');assert part['spokenText']==source['spokenText'] and part['textSHA256']==source['textSHA256']
s=script.read_text(encoding='utf8');assert s.count(source['spokenText'])==1
before={p.relative_to(R).as_posix():sha(p) for p in [draft_file,script]};H=R/'history/before-S11-05-ar-speech-repair';H.mkdir(exist_ok=False)
for p in [draft_file,script]:
 d=H/p.relative_to(R);d.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,d)
part.update(spokenText=new,textSHA256=newsha);draft['updatedUTC']=now;draft['status']='one_source_bound_spoken_repair_waiting_actual_audio';save(draft_file,draft);text(script,s.replace(source['spokenText'],new))
for n in ['method-approval.en.json','budget-authorization.en.json']:text(O/n,(B/'funded-rest-v1'/n).read_text(encoding='utf8'))
c=dict(source,id='S11-05-ar-EG-r1',originalPartID=source['id'],spokenText=new,textSHA256=newsha,sourceRepair='One coherent full worked-example passage; explicit rain clause replaces confirmed rain/string substitution. Other entire passage unchanged.')
c['requestFingerprintSHA256']=hashlib.sha256(json.dumps({'model':'gemini-3.8-flash-tts','voice':c['voice'],'locale':c['locale'],'spokenText':new,'delivery':c['delivery']},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
m={'id':'fate-v2-s11-speech-repair-v1','model':'gemini-3.8-flash-tts','analysisModel':'gemini-2.5-flash','automaticRetries':0,'maxSpeechCalls':1,'maxSpeechOutputTokens':4096,'maxAnalysisCalls':2,'providerReservationUSD':.20,'remainingPathCeilingUSD':25,'methodApprovalSHA256':sha(O/'method-approval.en.json'),'budgetAuthorizationSHA256':sha(O/'budget-authorization.en.json'),'retained':[],'segments':[c],'supersededAudio':{'run':40296268513,'artifact':'fate-v2-rest-original-S11-05-ar-EG','file':original.name,'sha256':sha(original)},'repairEvidence':evidence,'authorizedScope':'One complete S11 worked-example Arabic Charon passage, 2strict actual-audio checks and1new observational CPUclock, USD0.20 from existing remaining25ceiling. All other91 original clips retained.','wordingReview':'نزلت أمطار is natural comprehensible Egyptian narration, preserving the conditional rain event and redistribution hypothesis, including no causal source/fraction claim. No scientific or written lesson changes.'};save(O/'request.json',m)
T=B/'s02-speech-repair-v1'
for n in ['generate.py','observational_clock38.py','run_review.py','run_clock.py']:text(O/n,(T/n).read_text(encoding='utf8'))
prepare=(T/'prepare_quality.py').read_text(encoding='utf8').replace("v['voice']=='Kore'","v['voice']=='Charon'").replace('fate-v2-s02-repair-','fate-v2-s11-repair-');text(O/'prepare_quality.py',prepare)
review=(B/'rest-voice-recheck-v1/adjudicator.py').read_text(encoding='utf8').replace("O=R/'output'","O=R/'review-output'");text(O/'review_worker.py',review)
wf=(W/'.github/workflows/fate-v2-s02-speech-repair.yml').read_text(encoding='utf8').replace('s02-speech-repair','s11-speech-repair').replace('S02-02-ar-EG-r1','S11-05-ar-EG-r1').replace('fate-v2-s02-repair-','fate-v2-s11-repair-').replace('S02 Arabic','S11 Arabic').replace('other9originals','other91originals').replace('Kore','Charon')
import re
wf=re.sub(r'EXPECTED_REQUEST_SHA256: [0-9a-f]{64}','EXPECTED_REQUEST_SHA256: '+sha(O/'request.json'),wf);text(W/'.github/workflows/fate-v2-s11-speech-repair.yml',wf)
for p in O.glob('*.py'):compile(p.read_text(encoding='utf8'),str(p),'exec')
assert sha(L)==lessonsha
record={'utc':now,'scope':m['authorizedScope'],'before':before,'after':{p.relative_to(R).as_posix():sha(p) for p in [draft_file,script]},'beforeClause':beforeClause,'afterClause':afterClause,'oldTextSHA256':source['textSHA256'],'newTextSHA256':newsha,'oldSpokenText':source['spokenText'],'newSpokenText':new,'oldAudioPreserved':m['supersededAudio'],'actualDefectEvidence':evidence,'voice':'Charon','model':m['model'],'deliverySHA256':c['deliverySHA256'],'newAudioStatus':'not_generated_yet','writtenLessonSHA256Unchanged':lessonsha,'allOther91Originals':'retained unchanged; individual text/delivery/WAV hashes remain valid','globalSpokenDraftContract':'Only S11 whole-draft hash changed. Parent refreshes only affected S11 downstream contract; do not invalidate other individual accepted parts.','oldClockPolicy':'Old S11-05ar clock stays with old WAV. New recording needs new actual clock.','newProviderReservationUSD':.20,'rootDispatchRequired':True}
save(R/'media-plan/FATE2-S11/S11-05-ar-speech-repair.en.json',record);save(O/'source-change.en.json',record)
save(O/'freeze-pins.en.json',{'requestSHA256':sha(O/'request.json'),'files':{p.name:sha(p) for p in O.iterdir() if p.is_file()},'workflowSHA256':sha(W/'.github/workflows/fate-v2-s11-speech-repair.yml')})
print(json.dumps({'requestSHA256':sha(O/'request.json'),'newTextSHA256':newsha,'newSpokenDraftSHA256':sha(draft_file),'lessonSHA256':lessonsha,'voice':'Charon','speechCalls':1,'reviewCalls':2,'reserveUSD':.20}))
