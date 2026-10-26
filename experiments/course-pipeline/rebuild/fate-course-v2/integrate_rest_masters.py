"""Plan/apply a narrow preview binding from received and reviewed step masters."""
from pathlib import Path
import argparse,json,hashlib,sys,re,copy,shutil,datetime,html
B=Path(__file__).parent;sys.path.insert(0,str(B/'rest-master-assembly'))
from selection_contract import step_id,LOCALES,sha,beneath
def load(p):return json.loads(Path(p).read_text(encoding='utf8'))
def raw(s):return s.encode('utf8')
def jd(v):return json.dumps(v,ensure_ascii=False,indent=2)+'\n'
def reviewed_master(R,step,locale,m):
 video=beneath(R,m['video']);assembly=beneath(R,m['assembly']);timeline=beneath(R,m['timeline']);review=beneath(R,m['review']['path'])
 for p,h in [(video,m['sha256']),(assembly,m['assemblySHA256']),(timeline,m['timelineSHA256']),(review,m['review']['sha256'])]:
  if not p.is_file() or sha(p)!=h:raise ValueError('Actual received/reviewed master file changed: '+str(p))
 a=load(assembly);t=load(timeline);q=load(review)
 if a.get('status')!='ENCODED_AND_ORIGINAL_PCM_REUSE_VERIFIED' or a.get('allSourceAudioGatesClear') is not True or a.get('videoSHA256')!=m['sha256']:raise ValueError('Assembly source gates/encoded identity missing')
 if a.get('step')!=step or a.get('locale')!=locale or t.get('step')!=step or t.get('locale')!=locale:raise ValueError('Master belongs to another step or locale')
 if a['frames']!=t['frames'] or a['sceneCount']!=len(t['parts']) or abs(a['durationSeconds']-t['durationSeconds'])>.001:raise ValueError('Master timeline and encoded counts differ')
 if q.get('status')!='qualified_for_owner_playback' or q.get('videoSHA256')!=m['sha256']:raise ValueError('Exact full-master review required before learner binding')
 inspected=q.get('actualEncodedFramesInspected',[])
 if not inspected:raise ValueError('Actual encoded-frame review evidence missing')
 for f in inspected:
  p=beneath(R,f['path'])
  if not p.is_file() or sha(p)!=f['sha256']:raise ValueError('Inspected encoded frame changed')
 chapters=[]
 for i,p in enumerate(t['parts'],1):
  if p['sceneIndex']!=i or p['startFrame']/30!=p['startSeconds'] or p['endSeconds']<=p['startSeconds']:raise ValueError('Invalid measured chapter offset')
  title=p['title'] if isinstance(p['title'],str) else p['title'][LOCALES[locale]]
  chapters.append({'id':step+'-'+str(i).zfill(2),'sectionID':p['sectionID'],'start':p['startSeconds'],'title':title})
 if len(chapters) not in [5,6]:raise ValueError('Incomplete step master')
 return {'src':'../'+video.relative_to(R).as_posix(),'sha256':m['sha256'],'durationSeconds':a['durationSeconds'],'chapters':chapters},a,t
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--root',required=True);p.add_argument('--manifest',required=True);p.add_argument('--step',required=True);p.add_argument('--apply',action='store_true');p.add_argument('--replace-expected-json');args=p.parse_args();R=Path(args.root).resolve();step=step_id(args.step);manifest=load(args.manifest)
 if manifest.get('step')!=step:raise ValueError('Integration manifest belongs to another step')
 beforeFiles={n:(R/n).read_bytes() for n in ['preview/index.html','preview/app.js','preview/media-review.html']}
 index=beforeFiles['preview/index.html'].decode('utf8');match=re.search(r'(<script[^>]*id="public-data"[^>]*>)(.*?)(</script>)',index,re.S)
 if not match:raise ValueError('Actual learner projection missing')
 data=json.loads(match[2]);originalData=copy.deepcopy(data);run=load(R/'RUN.en.json')
 if not all(sha(R.parent/k)==h for k,h in run['oldEdition']['protectedFilePreimages'].items()):raise ValueError('Protected old edition changed')
 oldFirst=copy.deepcopy(data['lessons']['FATE2-S01'].get('video'));oldPractice=sha(R/'preview/intake-practice.js');lesson=copy.deepcopy(data['lessons'][step]);replace=load(args.replace_expected_json) if args.replace_expected_json else {};selected={};bindings={};evidence={}
 for locale,m in manifest.get('masters',{}).items():
  if locale not in LOCALES:raise ValueError('Uncommissioned locale')
  code=LOCALES[locale];binding,a,t=reviewed_master(R,step,locale,m);existing=lesson.get('video',{}).get(code)
  if existing and existing.get('sha256')!=m['sha256'] and replace.get(locale)!=existing.get('sha256'):raise ValueError('Existing selected video preserved; an explicit expected-old hash is required for replacement')
  bindings[code]=binding;lesson.setdefault('video',{})[code]=binding;selected[locale]=m;evidence[locale]={'videoSHA256':m['sha256'],'assemblySHA256':m['assemblySHA256'],'timelineSHA256':m['timelineSHA256'],'reviewSHA256':m['review']['sha256'],'frames':a['frames'],'durationSeconds':a['durationSeconds']}
 if not bindings:raise ValueError('No actually completed locale supplied')
 data['lessons'][step]=lesson
 if data['lessons']['FATE2-S01'].get('video')!=oldFirst:raise ValueError('Accepted first-step binding changed')
 for id,v in data['lessons'].items():
  if id!=step and v!=originalData['lessons'][id]:raise ValueError('Unrelated step content changed')
 for k in data:
  if k!='lessons' and data[k]!=originalData[k]:raise ValueError('Unrelated learner data changed')
 if {k:v for k,v in lesson.items() if k!='video'}!={k:v for k,v in originalData['lessons'][step].items() if k!='video'}:raise ValueError('Integration must not rewrite lesson/scientific content')
 afterIndex=index[:match.start(2)]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+index[match.end(2):]
 app=beforeFiles['preview/app.js'].decode('utf8');oldNotice="root.querySelector('[data-notice]').textContent=t.notice;";newNotice="const readyVideos=Object.values(data.lessons).filter(x=>x.video?.ar&&x.video?.en).length;root.querySelector('[data-notice]').textContent=lang==='ar'?`نسخة إعادة البناء: ١١ خطوة مكتوبة بالعربي والإنجليزي. الفيديو جاهز باللغتين في ${readyVideos} من ١١ خطوة.`:`Rebuild review: 11 written steps in Arabic and English. Complete videos are available in both languages for ${readyVideos} of the 11 steps.`;"
 if oldNotice in app:
  if app.count(oldNotice)!=1:raise ValueError('Ambiguous preview notice')
  app=app.replace(oldNotice,newNotice)
 elif newNotice not in app:raise ValueError('Unexpected preview notice implementation; inspect rather than overwrite')
 media=beforeFiles['preview/media-review.html'].decode('utf8');start='<!-- MASAARAT-RECEIVED-'+step+'-START -->';end='<!-- MASAARAT-RECEIVED-'+step+'-END -->'
 titleAr=data['lessons'][step]['ar']['title'];titleEn=data['lessons'][step]['en']['title'];block=start+'<section class="station" id="media-'+step+'"><h2>'+html.escape(titleAr)+' · '+html.escape(titleEn)+'</h2><p>نسخة للمراجعة: المشاهد المكتملة باللغتين تظهر فور استلامها والتحقق منها. التسجيلات الأصلية محفوظة.</p><div class="media-grid">'
 for code,bind in lesson.get('video',{}).items():
  if code not in ['ar','en']:raise ValueError('Unexpected existing video locale')
  label='العربي المصري' if code=='ar' else 'English';block+='<div><h3>'+label+'</h3><video controls preload="none" playsinline style="width:100%" src="'+html.escape(bind['src'],quote=True)+'"></video><p>'+f'{bind["durationSeconds"]:.2f}'+' s</p></div>'
 block+='</div></section>'+end
 if start in media:
  if media.count(start)!=1 or media.count(end)!=1:raise ValueError('Ambiguous existing media section')
  a=media.index(start);b=media.index(end)+len(end);media=media[:a]+block+media[b:]
 else:
  if media.count('</body>')!=1:raise ValueError('Expected media review document boundary')
  media=media.replace('</body>',block+'</body>')
 payloads={'preview/index.html':raw(afterIndex),'preview/app.js':raw(app),'preview/media-review.html':raw(media)}
 receiptPath='production/'+step+'-selected-masters.en.json';previousReceipt=R/receiptPath;previous=load(previousReceipt) if previousReceipt.exists() else {'step':step,'masters':{}};previous['masters'].update(selected);previous.update(updatedUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Actual qualified received explanatory masters only; written practice and private assessment keys remain separate.',fullMasterOwnerListening='Not inferred from machine/author review',platformOrBunnyUploads=0);payloads[receiptPath]=raw(jd(previous))
 expected={n:sha(R/n) for n in beforeFiles};expected[receiptPath]=sha(previousReceipt) if previousReceipt.exists() else None
 plan={'step':step,'locales':list(selected),'manifestSHA256':sha(args.manifest),'before':expected,'after':{n:hashlib.sha256(b).hexdigest() for n,b in payloads.items()},'sourceEvidence':evidence,'firstStepBindingPreserved':True,'S02PracticeModuleSHA256':oldPractice,'otherLessonContentAndPrivateKeys':'Not modified','mode':'apply' if args.apply else 'plan_only','newProviderCalls':0,'notTested':['Native browser layout,screenreader and fullnative playback','Bunny/live platform binding'],'utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 out=B/'rest-master-assembly/plans'/f'{step}-{datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")}';out.mkdir(parents=True)
 (out/'plan.en.json').write_text(jd(plan),encoding='utf8')
 for n,b in payloads.items():
  dest=out/'proposed'/n;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
 if args.apply:
  # Fresh guards immediately before the narrow authorized mutation; originals are retained.
  for n,h in expected.items():
   p=R/n
   if (p.exists() and sha(p)!=h) or (not p.exists() and h is not None):raise ValueError('Affected preimage changed after planning: '+n)
  history=R/'history'/('before-master-binding-'+out.name);history.mkdir(exist_ok=False)
  for n,b in payloads.items():
   p=R/n
   if p.exists():dest=history/n;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
   p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
   if sha(p)!=plan['after'][n]:raise ValueError('Post-write raw hash mismatch: '+n)
  if sha(R/'preview/intake-practice.js')!=oldPractice:raise ValueError('Practice module changed unexpectedly')
  plan['applied']=True;plan['history']=history.relative_to(R).as_posix();(out/'plan.en.json').write_text(jd(plan),encoding='utf8');(R/'production'/(step+'-preview-binding-'+out.name+'.en.json')).write_text(jd(plan),encoding='utf8')
 print(json.dumps({'step':step,'locales':list(selected),'applied':args.apply,'plan':str(out/'plan.en.json'),'selectedReceipt':str(R/receiptPath),'firstStepBindingPreserved':True,'newProviderCalls':0}))
if __name__=='__main__':main()
