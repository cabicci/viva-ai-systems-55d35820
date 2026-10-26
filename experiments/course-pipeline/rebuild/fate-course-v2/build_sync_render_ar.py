"""A bounded first-scene sample, never a full-lesson render approval."""
from batch_common import *
import shutil
W=next(p for p in Path(__file__).resolve().parents if (p/'.git').exists());B=Path(__file__).parent;T=B/'render-first38-ar';T.mkdir(exist_ok=False)
id='S01-01-ar-EG';orig=R/'production/FATE2-S01-voice38-v1/artifacts'/('fate-v2-full38-original-'+id);v=json.loads((orig/'verification.json').read_text(encoding='utf8'));align=R/'production/sync-first38-v1/artifacts'/('fate-v2-sync38-'+id);check=json.loads((align/'verification.json').read_text(encoding='utf8'));assert check['readyForRenderReview'] and check['audioSHA256']==v['wavSHA256']
old=W/'experiments/course-pipeline/rebuild/fate-L02-L07-bilingual-v1/render-proof1';brand=json.loads((old/'request.json').read_text(encoding='utf8'))['brandAssets']
M={'id':'fate-v2-first38-ar-sync-sample-v1','scope':'Only first complete scene; not the full lesson','sampleAuthorized':True,'fullLessonRenderAllowed':False,'newSpeechCalls':0,'scene':{'id':'FateV2S01ArabicSample','sceneIndex':1,'locale':'ar','title':'نتيجة التحليل تجاوب أنهي سؤال؟','audio':{'run':40254395212,'artifact':'fate-v2-full38-original-'+id,'file':id+'.wav','sha256':v['wavSHA256']},'alignment':{'run':40254734962,'artifact':'fate-v2-sync38-'+id,'file':'timing.json','sha256':hashlib.sha256((align/'timing.json').read_bytes()).hexdigest()},'image':{'run':40253298480,'artifact':'fate-v2-image-result-versus-claim','file':'result-versus-claim.jpg','sha256':'b3fd228678f4c5e19df85ba30199ba81cb93da476195d3fcb90c164805bb3872'},'audioFrames':v['frames'],'textSHA256':check['textSHA256'],'deliverySHA256':check['deliverySHA256']},'brandAssets':brand,'method':'Actual-audio approximate word/action cues, no estimated timing or time stretching. Rendered3D-looking illustration, not native geometry.'}
def put(n,x):
 with (T/n).open('w',encoding='utf8',newline='\n') as f:f.write(x if isinstance(x,str) else json.dumps(x,ensure_ascii=False,indent=2)+'\n')
put('request.json',M)
for name in ['package.json','package-lock.json']:shutil.copyfile(old/name,T/name)
put('prepare.py','''from pathlib import Path
import json,os,subprocess,hashlib,shutil,wave,math,re
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text());C=M['scene'];O=R/'output';O.mkdir(exist_ok=True);P=R/'public';P.mkdir(exist_ok=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and M['sampleAuthorized'] and not M['fullLessonRenderAllowed'] and M['newSpeechCalls']==0 and C['sceneIndex']==1
def get(ref,name):
 d=R/'downloads'/name;d.mkdir(exist_ok=False,parents=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True);f=d/ref['file'];assert sha(f)==ref['sha256'];return f
a=get(C['audio'],'audio');image=get(C['image'],'image');timing=get(C['alignment'],'timing');V=json.loads((timing.parent/'verification.json').read_text());assert V['readyForRenderReview'] and not V['timingProblems'] and V['audioSHA256']==C['audio']['sha256'] and V['textSHA256']==C['textSHA256'] and V['deliverySHA256']==C['deliverySHA256'] and V['model']=='gemini-3.8-flash-tts'
with wave.open(str(a),'rb') as f:
 assert (f.getnchannels(),f.getsampwidth(),f.getframerate())==(1,2,24000) and f.getnframes()==C['audioFrames'];duration=f.getnframes()/f.getframerate()
for f in [a,image]:shutil.copyfile(f,P/f.name)
for asset in M['brandAssets']:
 f=Path(os.environ['GITHUB_WORKSPACE'])/asset['path'];assert sha(f)==asset['sha256'];shutil.copyfile(f,P/asset['name'])
t=json.loads(timing.read_text()); actions={x['id']:x for x in t['actions']};assert set(actions)=={'sample-result','exposure','risk-evidence'}
for x in t['captions']:x['text']=re.sub('[\\u064b-\\u065f\\u0670]','',x['text'])
data=dict(C,audioFile=a.name,imageFile=image.name,durationSeconds=duration,frames=math.ceil(duration*30),actions=actions,captions=t['captions'],wordTimings=t['words'])
(R/'render-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\\n');(O/'timing-and-inputs.en.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\\n');(O/'assets.en.json').write_text(json.dumps([{'file':f.name,'sha256':sha(f)} for f in P.iterdir()],indent=2)+'\\n')
''')
put('Scene.tsx','''import React,{useState,useEffect} from 'react';
import {AbsoluteFill,Audio,Composition,Img,registerRoot,staticFile,useCurrentFrame,delayRender,continueRender,cancelRender} from 'remotion';
import s from './render-data.json';
const ink='#183b50',blue='#4f8eaa',mint='#d7eee5',clamp=(x:number)=>Math.max(0,Math.min(1,x));
function Scene(){const f=useCurrentFrame(),t=f/30,ar=s.locale==='ar',T=(a:string,e:string)=>ar?a:e;
 const [h]=useState(()=>delayRender('Cairo'));useEffect(()=>{new FontFace('Cairo',`url("${staticFile('Cairo.ttf')}")`).load().then(x=>{document.fonts.add(x);continueRender(h)}).catch(cancelRender)},[h]);
 const cue=(id:string)=>clamp((t-(s.actions as any)[id].start)/.55),r=cue('sample-result'),e=cue('exposure'),k=cue('risk-evidence');const cap=s.captions.find(c=>t>=c.start&&t<c.end);
 const card=(y:number,p:number,title:string,sub:string,bg:string)=> <div style={{position:'absolute',right:66,top:y,width:660,padding:'22px 28px',borderRadius:22,background:bg,border:'1px solid #c5dce4',boxShadow:'0 8px 24px #17394a0b',opacity:p,transform:`translateX(${(1-p)*45}px)`,direction:ar?'rtl':'ltr'}}><div style={{fontSize:36,fontWeight:800,lineHeight:1.6}}>{title}</div><div style={{fontSize:25,lineHeight:1.7,marginTop:5,color:'#456576'}}>{sub}</div></div>;
 return <AbsoluteFill style={{fontFamily:'Cairo',background:'#f6fafb',color:ink}}>
 <Audio src={staticFile(s.audioFile)}/><Img src={staticFile(s.imageFile)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
 <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,rgba(247,251,251,.95),transparent 28%),linear-gradient(90deg,transparent 50%,rgba(247,251,251,.65) 78%)'}}/>
 <Img src={staticFile('masaarat-logo-lockup.png')} style={{position:'absolute',left:50,top:22,width:190,height:98,objectFit:'contain'}}/>
 <header style={{position:'absolute',right:65,top:32,width:1250,textAlign:ar?'right':'left',direction:ar?'rtl':'ltr'}}><div style={{fontSize:25,color:blue}}>{T('مسارات · مصير المبيدات في البيئة','Masaarat · Fate of pesticides in the environment')}</div><h1 style={{fontSize:46,lineHeight:1.7,margin:'6px 0'}}>{s.title}</h1></header>
 {card(222,r,T('نتيجة في عيّنة','A sample result'),T('هوية المادة · أساس العيّنة · طريقة القياس','Identity · sample basis · analytical method'),'rgba(255,255,255,.96)')}
 {card(420,e,T('التعرّض سؤال له بياناته','Exposure needs its own evidence'),T('مين؟ بأي طريق؟ قد إيه؟ لمدة قد إيه؟','Who? Which route? How much? How long?'),'rgba(235,246,248,.97)')}
 {card(650,k,T('نربط دليل الضرر بدليل التعرّض','Connect effect and exposure evidence'),T('اسم المادة وحده مش تشخيص تسمّم','A substance name alone is not a poisoning diagnosis'),'rgba(225,241,232,.98)')}
 <svg viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}><g opacity={r*(1-e*.5)}><path d="M650 565 Q900 400 1110 310" stroke={blue} strokeWidth="4" strokeDasharray="8 8" fill="none" pathLength="1" strokeDashoffset={1-r}/><circle cx={650+clamp((t-s.actions['sample-result'].start)/1.4)*460} cy={565-clamp((t-s.actions['sample-result'].start)/1.4)*255} r="9" fill={blue}/></g><g opacity={k}><path d="M1160 600 V635" stroke={blue} strokeWidth="4" strokeDasharray="6 6"/><circle cx="1160" cy="622" r="20" fill="white" stroke={blue} strokeWidth="2"/><text x="1160" y="632" fontSize="27" textAnchor="middle" fill={ink}>?</text></g></svg>
 <div style={{position:'absolute',left:52,bottom:176,width:920,fontSize:22,lineHeight:1.7,direction:ar?'rtl':'ltr',background:'rgba(248,252,251,.9)',padding:'10px 18px',borderRadius:12}}>{T('تصوّر تعليمي مُولّد؛ الصورة مش نتيجة تجربة. كل استنتاج محتاج دليله.','Generated teaching illustration, not experimental evidence. Each conclusion needs its own support.')}</div>
 <div style={{position:'absolute',left:55,right:55,bottom:30,minHeight:116,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:20,background:ink,color:'white',padding:'12px 30px',fontSize:33,lineHeight:1.65,textAlign:'center',direction:ar?'rtl':'ltr'}}>{cap?.text||''}</div>
 </AbsoluteFill>}
registerRoot(()=> <Composition id={s.id} component={Scene} durationInFrames={s.frames} fps={30} width={1920} height={1080}/>);
''')
put('render.cjs','''const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const {bundle}=require('@remotion/bundler'),{selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
async function main(){const R=__dirname,s=JSON.parse(fs.readFileSync(path.join(R,'render-data.json'),'utf8')),o=path.join(R,'output');const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(sha(path.join(R,'public',s.audioFile))!==s.audio.sha256)throw Error('Original audio identity changed');
const serveUrl=await bundle({entryPoint:path.join(R,'Scene.tsx'),publicDir:path.join(R,'public')}),composition=await selectComposition({serveUrl,id:s.id});
const frames=[0,...Object.values(s.actions).map(a=>Math.min(s.frames-1,Math.ceil((a.start+.8)*30)))];
if(process.argv[2]==='stills'){for(let i=0;i<frames.length;i++)await renderStill({serveUrl,composition,frame:frames[i],output:path.join(o,`frame-${i}.png`),imageFormat:'png'});fs.writeFileSync(path.join(o,'frames.en.json'),JSON.stringify({frames,actions:s.actions},null,2));return;}
if(process.argv[2]!=='video')throw Error('Explicit render mode required');
await renderMedia({serveUrl,composition,outputLocation:path.join(o,'visual.mp4'),codec:'h264',muted:true,pixelFormat:'yuv420p',colorSpace:'bt709',crf:20,concurrency:2});
execFileSync('ffmpeg',['-v','error','-i',path.join(o,'visual.mp4'),'-i',path.join(R,'public',s.audioFile),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',path.join(o,s.id+'.mp4')]);
const p=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',path.join(o,s.id+'.mp4')],{encoding:'utf8'})),v=p.streams.find(x=>x.codec_type==='video');if(v.width!==1920||v.height!==1080||Number(v.nb_read_frames)!==s.frames||Math.abs(Number(p.format.duration)-s.durationSeconds)>.15)throw Error('Encoded sample checks failed');
fs.writeFileSync(path.join(o,'probe.json'),JSON.stringify(p,null,2));fs.writeFileSync(path.join(o,'render.en.json'),JSON.stringify({runID:process.env.GITHUB_RUN_ID,commit:process.env.GITHUB_SHA,videoSHA256:sha(path.join(o,s.id+'.mp4')),sourceAudioSHA256:s.audio.sha256,sourceAudioFrames:s.audioFrames,frames:s.frames,durationSeconds:s.durationSeconds,fullLessonRendered:false,humanPlaybackVerified:false,timing:'Actual-recording approximate word/cue clock; no text-length estimates or time stretching'},null,2));}
main().catch(e=>{console.error(e);process.exitCode=1});
''')
pkg=T.relative_to(W).as_posix();h=hashlib.sha256((T/'request.json').read_bytes()).hexdigest()
wf=f'''name: Fate v2 first Arabic3.8 synchronized sample
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [{pkg}/request.json]
permissions:
  contents: read
  actions: read
env:
  PACKAGE: {pkg}
  EXPECTED_REQUEST_SHA256: {h}
  GH_TOKEN: ${{{{ github.token }}}}
jobs:
  sample:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify exact originals and valid acoustic cues
        run: python "$PACKAGE/prepare.py"
      - name: Install pinned existing renderer dependencies
        working-directory: {pkg}
        run: npm ci --no-audit --no-fund
      - name: Render explanatory checkpoints
        run: node "$PACKAGE/render.cjs" stills
      - name: Deliver each visible checkpoint immediately
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-ar-sync38-stills
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
      - name: Render and decode-verify only the bounded sample
        run: |
          command -v ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y ffmpeg)
          node "$PACKAGE/render.cjs" video
      - name: Deliver completed sample without waiting for other jobs
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-ar-sync38-sample
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
'''
with (W/'.github/workflows/fate-v2-render-first38-ar.yml').open('x',encoding='utf8',newline='\n') as f:f.write(wf)
save('media-plan/FATE2-S01/ar-sync-render-request.en.json',M)
print('Prepared exact44.32s Arabic synchronization sample and checkpoint frames; unchanged speech, existing image, no full lesson render.')
