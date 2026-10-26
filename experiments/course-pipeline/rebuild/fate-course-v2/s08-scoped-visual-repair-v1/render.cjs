const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const {bundle}=require('@remotion/bundler'),{selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
setTimeout(()=>{console.error('Bounded renderer watchdog exceeded8minutes; retained original inputs require inspection, no automatic provider retry');process.exit(3)},8*60*1000).unref();
function boundedExec(executable,args,options={}){
 console.log(JSON.stringify({stage:'subprocess-start',executable,operation:args.slice(0,5),timeoutMilliseconds:options.timeout||120000}));
 const actualArgs=executable==='ffmpeg'&&!args.includes('-nostdin')?['-nostdin',...args]:args;
 const r=spawnSync(executable,actualArgs,{timeout:120000,maxBuffer:16*1024*1024,...options,killSignal:'SIGKILL'});
 if(r.error||r.status!==0||r.signal||(r.stderr&&r.stderr.toString().trim())){console.error(r.stderr?.toString());throw Error('Bounded actual media validation failed: '+executable+' '+(r.error?.message||r.status||r.signal||'error stderr'));}
 console.log(JSON.stringify({stage:'subprocess-finished',executable}));return r.stdout;
}
async function main(){
 const R=__dirname,s=JSON.parse(fs.readFileSync(path.join(R,'render-data.json'),'utf8')),o=path.join(R,'output'),contracts=JSON.parse(fs.readFileSync(path.join(R,'contracts.json'),'utf8'));
 fs.mkdirSync(o,{recursive:true});const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 const c=contracts.scenes.find(x=>x.step===s.step&&x.sectionID===s.sectionID);if(!c)throw Error('Exact authored contract missing');
 if(s.audioGate?.status!=='clear'||s.audioGate.sourceAudioSHA256!==s.audio?.sha256)throw Error('Exact actual-audio qualification required');
 if(!s.audio?.sha256||sha(path.join(R,'public',s.audioFile))!==s.audio.sha256)throw Error('Original audio identity changed');
 if(s.image?.sha256&&sha(path.join(R,'public',s.imageFile))!==s.image.sha256)throw Error('Selected image identity changed');
 if(!Number.isInteger(s.audioFrames)||s.frames!==Math.ceil(s.audioFrames/800)||Math.abs(s.durationSeconds-s.audioFrames/24000)>1e-6)throw Error('Audio/frame timebase mismatch');
 for(const a of c.actions){const cue=s.actions[a.id];if(!cue||!Number.isFinite(cue.start)||!Number.isFinite(cue.end)||cue.start<0||cue.end<=cue.start||cue.end>s.durationSeconds+.05)throw Error('Missing or invalid actual-recording action clock: '+a.id);}
 console.log('Stage: bundle actual scene',s.id,s.frames);
 const serveUrl=await bundle({entryPoint:path.join(R,'Scene.tsx'),publicDir:path.join(R,'public')}),composition=await selectComposition({serveUrl,id:s.id});
 const frames=[...new Set([0,...c.actions.map(a=>Math.min(s.frames-1,Math.ceil((s.actions[a.id].start+.8)*30))),s.frames-1])].sort((a,b)=>a-b);
 if(process.argv[2]==='stills'){
  for(let i=0;i<frames.length;i++)await renderStill({serveUrl,composition,frame:frames[i],output:path.join(o,`frame-${i}.png`),imageFormat:'png'});
  fs.writeFileSync(path.join(o,'frames.en.json'),JSON.stringify({frames,actions:s.actions,step:s.step,sectionID:s.sectionID,contractKind:c.kind},null,2));return;
 }
 if(process.argv[2]!=='video')throw Error('Explicit stills or video mode required');
 let reportFrame=0;console.log('Stage: render visual');
 await renderMedia({serveUrl,composition,outputLocation:path.join(o,'visual.mp4'),codec:'h264',muted:true,pixelFormat:'yuv420p',colorSpace:'bt709',crf:20,concurrency:1,onProgress:({renderedFrames,encodedFrames})=>{if(renderedFrames>=reportFrame){console.log(JSON.stringify({stage:"render",renderedFrames,encodedFrames,totalFrames:s.frames}));reportFrame+=300}}});
 console.log('Stage: mux preserved speech');
 const out=path.join(o,s.id+'.mp4');
 boundedExec('ffmpeg',['-v','error','-i',path.join(o,'visual.mp4'),'-i',path.join(R,'public',s.audioFile),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',out]);
 console.log('Stage: full decode');
 // All-stream count_frames below invokes video/audio decoders through EOF; no output encoder required.
 const p=JSON.parse(boundedExec('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',out],{encoding:'utf8'})),v=p.streams.find(x=>x.codec_type==='video'),a=p.streams.find(x=>x.codec_type==='audio');
 if(v.width!==1920||v.height!==1080||Number(v.nb_read_frames)!==s.frames||v.r_frame_rate!=='30/1'||Number(a.sample_rate)!==24000||a.channels!==1||!(Number(a.nb_read_frames)>0)||Math.abs(Number(p.format.duration)-s.durationSeconds)>.15)throw Error('Encoded scene checks failed');
 console.log('Stage: encoded checkpoints');
 const stamp=JSON.parse(boundedExec('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',out],{encoding:'utf8'}));
 const pts=stamp.frames.map(f=>Number(f.best_effort_timestamp_time));
 if(pts.length!==s.frames||pts.some((t,i)=>!Number.isFinite(t)||(i>0&&t<=pts[i-1])))throw Error('Actual presentation frame timestamp mismatch');
 fs.writeFileSync(path.join(o,'actual-video-frame-timestamps.en.json'),JSON.stringify(stamp,null,2));
 const seeks={};
 for(let i=0;i<frames.length;i++){
  const f=frames[i],seek=f===0?0:(pts[f-1]+pts[f])/2;seeks[f]=seek;
  const args=['-v','error'];
  if(f>0)args.push('-accurate_seek','-seek_timestamp','1','-ss',seek.toFixed(9));
  args.push('-i',out,'-map','0:v:0','-an','-frames:v','1','-c:v','png','-f','image2',path.join(o,`encoded-${String(i+1).padStart(2,'0')}.png`));
  boundedExec('ffmpeg',args);
 }
 const encoded=frames.map((f,i)=>{const file=`encoded-${String(i+1).padStart(2,'0')}.png`;if(!fs.existsSync(path.join(o,file)))throw Error('Encoded checkpoint absent');return {frame:f,file,sha256:sha(path.join(o,file)),actualPresentationTimestampSeconds:pts[f],accurateSeekThresholdSeconds:seeks[f],method:"First decoded presentation frame after actual previous/current PTS midpoint; frame0 decoded directly; no select filter"};});
 fs.writeFileSync(path.join(o,'encoded-checkpoints.en.json'),JSON.stringify(encoded,null,2));
 fs.writeFileSync(path.join(o,'probe.json'),JSON.stringify(p,null,2));
 fs.writeFileSync(path.join(o,'render.en.json'),JSON.stringify({runID:process.env.GITHUB_RUN_ID,commit:process.env.GITHUB_SHA,step:s.step,sectionID:s.sectionID,contractKind:c.kind,contractSHA256:sha(path.join(R,'contracts.json')),videoSHA256:sha(out),visualSHA256:sha(path.join(o,'visual.mp4')),sourceAudioSHA256:s.audio.sha256,sourceAudioFrames:s.audioFrames,frames:s.frames,durationSeconds:s.durationSeconds,fullLessonRendered:false,humanPlaybackVerified:false,timing:'Actual-recording approximate word/cue clock supplied by verified preparation; no text-duration estimate, scaling or speech stretching',selectedImageSHA256:s.image?.sha256||null,encodedCheckpoints:encoded.length},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
