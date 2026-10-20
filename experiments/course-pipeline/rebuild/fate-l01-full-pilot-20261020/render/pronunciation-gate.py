"""Fail-closed pronunciation gate for this course. No network or generation."""
import json,hashlib,sys,argparse
from pathlib import Path

def evaluate(report,scene_id,audio_sha,script_sha,delivery_sha,model,voice):
 reasons=[]
 if report.get('schemaVersion')!=1:reasons.append('unsupported_review_schema')
 if report.get('locale')!='ar':reasons.append('wrong_review_locale')
 rows=report.get('scenes',[]);matches=[s for s in rows if s.get('id')==scene_id]
 if len(matches)!=1:return {'allowed':False,'scene':scene_id,'reasons':reasons+['missing_or_duplicate_scene']}
 s=matches[0]
 for field,actual in [('audioSHA256',audio_sha),('scriptSHA256',script_sha),('deliverySHA256',delivery_sha),('model',model),('voice',voice)]:
  if not actual or s.get(field)!=actual:reasons.append('identity_mismatch_'+field)
 if s.get('automatedComplete') is not True:reasons.append('automated_review_incomplete')
 if not isinstance(s.get('expectedCalls'),int) or s.get('expectedCalls',0)<=0 or s.get('successfulCalls')!=s.get('expectedCalls'):reasons.append('analysis_coverage_gap')
 if not isinstance(s.get('unresolvedFindingIds'),list) or s.get('unresolvedFindingIds'):reasons.append('unresolved_audio_findings')
 if s.get('ownerRejected') is not False:reasons.append('owner_rejection_or_unknown_state')
 approval=s.get('listeningApproval',{})
 if approval.get('status')!='accepted' or approval.get('audioSHA256')!=audio_sha or not approval.get('evidence'):reasons.append('required_listening_approval_missing')
 return {'allowed':not reasons,'scene':scene_id,'reasons':reasons,'reviewID':report.get('reviewID'),'note':'Machine checks do not certify native accent; approved evidence must bind this exact audio.'}

def main():
 p=argparse.ArgumentParser();p.add_argument('--report',required=True);p.add_argument('--audio',required=True);p.add_argument('--manifest',required=True);p.add_argument('--scene',required=True);a=p.parse_args()
 try:
  report=json.loads(Path(a.report).read_text(encoding='utf-8'));manifest=json.loads(Path(a.manifest).read_text(encoding='utf-8-sig'));sid=a.scene.removeprefix('ar-');row=next(s for s in manifest['locales']['ar'] if s['id']==sid)
  sha=lambda b:hashlib.sha256(b).hexdigest()
  result=evaluate(report,sid,sha(Path(a.audio).read_bytes()),sha(row['text'].encode()),sha(manifest['delivery']['ar'].encode()),manifest['ttsModel'],row['voiceName'])
 except Exception as e:result={'allowed':False,'scene':a.scene,'reasons':['missing_or_invalid_review_input'],'errorType':type(e).__name__}
 print(json.dumps(result,ensure_ascii=False,indent=2));return 0 if result['allowed'] else 2
if __name__=='__main__':sys.exit(main())