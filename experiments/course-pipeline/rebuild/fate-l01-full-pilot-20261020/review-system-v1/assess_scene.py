"""Conservative automatic assessment. Produces holds, never accent certificates."""
import json,sys,re,hashlib
from pathlib import Path

def norm(s):return re.sub(r'[^\w\s]','',re.sub('[\u064b-\u065f\u0670\u0640]','',str(s))).replace('أ','ا').replace('إ','ا').replace('آ','ا').replace('ى','ي').strip()
def classify_alert(f,duration,script,whole_scene=False):
 a,b=f.get('start'),f.get('end');reason=f.get('reason','')
 if not isinstance(a,(int,float)) or not isinstance(b,(int,float)) or not 0<=a<b<=duration+.15:return 'hold_invalid_timing'
 if not whole_scene and (a<.8 or b>duration-.8) and any(x in reason for x in ['بداية المقطع','نهاية المقطع','انتهاء المقطع','تم قطع التسجيل']):return 'excluded_window_edge'
 if 'تنوين' in reason:return 'excluded_msa_case_ending'
 heard,expected=norm(f.get('heard','')),norm(f.get('expected',''));reference=norm(script)
 if heard and heard in reference and expected and expected not in reference and f.get('category')=='substitution':return 'hold_unsupported_proposed_change'
 return 'hold_candidate'

def main():
 R=Path(__file__).parent;sid=sys.argv[1];M=json.loads((R/'review-request.json').read_text(encoding='utf-8'));c=next(s for s in M['scenes'] if s['id']==sid);O=R/'output';O.mkdir(exist_ok=True);holds=[];alerts=[];success=0;expected=c['chunks']*2+1
 try:
  flash=json.loads((O/'flash/review.json').read_text(encoding='utf-8'));ctx=json.loads((O/'context/attempt.json').read_text(encoding='utf-8'));pro=json.loads((O/'context/analysis.json').read_text(encoding='utf-8'))
  assert ctx['audioSHA256']==flash['sceneAudioSHA256']==c['sourceAudioSHA256'],'Audio changed between passes'
  success=sum(x['status']=='COMPLETE' for x in flash['attempts'])+int(ctx['status']=='COMPLETE_REQUIRES_TRIAGE')
  if success!=expected:holds.append('missing_failed_or_invalid_analysis')
  for ch in flash['chunks']:
   for mode,entry in ch['passes'].items():
    if 'file' not in entry:continue
    obj=json.loads((O/'flash'/entry['file']).read_text(encoding='utf-8'))
    for f in obj['findings']:alerts.append({'pass':mode,'clip':ch['file'],'finding':f,'disposition':classify_alert(f,ch['end']-ch['start'],c['text'])})
  for f in pro['findings']:alerts.append({'pass':'context','finding':f,'disposition':classify_alert(f,ctx['durationSeconds'],c['text'],True)})
 except Exception as e:holds.append('review_unavailable_or_invalid_'+type(e).__name__)
 for a in alerts:
  if a['disposition'].startswith('hold'):holds.append(a['disposition'])
 if any(x.get('audioSHA256')==c.get('sourceAudioSHA256') for x in M.get('ownerRejections',[])):holds.append('owner_rejection')
 result={'schemaVersion':1,'scene':sid,'sourceAudioSHA256':c['sourceAudioSHA256'],'expectedCalls':expected,'successfulCalls':success,'status':'HOLD' if holds else 'READY_FOR_LISTENING','reasons':sorted(set(holds)),'alerts':alerts,'renderAllowed':False,'humanListeningApproved':False,'note':'Machine checks cannot auto-approve native accent. Bind exact accepted evidence through gate.py before rendering.'}
 (O/'automatic-assessment.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'scene':sid,'status':result['status'],'renderAllowed':False}));return 2 if holds else 0
if __name__=='__main__':sys.exit(main())