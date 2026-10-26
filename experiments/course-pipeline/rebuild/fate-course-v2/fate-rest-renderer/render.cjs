const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const {bundle}=require('@remotion/bundler'),{selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
async function main(){
 const R=__dirname,s=JSON.parse(fs.readFileSync(path.join(R,'render-data.json'),'utf8')),o=path.join(R,'output'),contracts=JSON.parse(fs.readFileSync(path.join(R,'contracts.json'),'utf8'));
 fs.mkdirSync(o,{recursive:true});const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 const c=contracts.scenes.find(x=>x.step===s.step&&x.sectionID===s.sectionID);if(!c)throw Error('Exact authored contract missing');
 if(!s.audio?.sha256||sha(path.join(R,'public',s.audioFile))!==s.audio.sha256)throw Error('Original audio identity changed');
 if(s.image?.sha256&&sha(path.join(R,'public',s.imageFile))!==s.image.sha256)throw Error('Selected image identity changed');
 if(!Number.isInteger(s.audioFrames)||s.frames!==Math.ceil(s.audioFrames/800)||Math.abs(s.durationSeconds-s.audioFrames/24000)>1e-6)throw Error('Audio/frame timebase mismatch');
 for(const a of c.actions){const cue=s.actions[a.id];if(!cue||!Number.isFinite(cue.start)||!Number.isFinite(cue.end)||cue.start<0||cue.end<=cue.start||cue.end>s.durationSeconds+.05)throw Error('Missing or invalid actual-recording action clock: '+a.id);}
 const serveUrl=await bundle({entryPoint:path.join(R,'Scene.tsx'),publicDir:path.join(R,'public')}),composition=await selectComposition({serveUrl,id:s.id});
 const frames=[...new Set([0,...c.actions.map(a=>Math.min(s.frames-1,Math.ceil((s.actions[a.id].start+.8)*30))),s.frames-1])].sort((a,b)=>a-b);
 if(process.argv[2]==='stills'){
  for(let i=0;i<frames.length;i++)await renderStill({serveUrl,composition,frame:frames[i],output:path.join(o,`frame-${i}.png`),imageFormat:'png'});
  fs.writeFileSync(path.join(o,'frames.en.json'),JSON.stringify({frames,actions:s.actions,step:s.step,sectionID:s.sectionID,contractKind:c.kind},null,2));return;
 }
 if(process.argv[2]!=='video')throw Error('Explicit stills or video mode required');
 await renderMedia({serveUrl,composition,outputLocation:path.join(o,'visual.mp4'),codec:'h264',muted:true,pixelFormat:'yuv420p',colorSpace:'bt709',crf:20,concurrency:2});
 const out=path.join(o,s.id+'.mp4');
 execFileSync('ffmpeg',['-v','error','-i',path.join(o,'visual.mp4'),'-i',path.join(R,'public',s.audioFile),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',out]);
 execFileSync('ffmpeg',['-v','error','-i',out,'-f','null','-']);
 const p=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',out],{encoding:'utf8'})),v=p.streams.find(x=>x.codec_type==='video'),a=p.streams.find(x=>x.codec_type==='audio');
 if(v.width!==1920||v.height!==1080||Number(v.nb_read_frames)!==s.frames||v.r_frame_rate!=='30/1'||Number(a.sample_rate)!==24000||a.channels!==1||Math.abs(Number(p.format.duration)-s.durationSeconds)>.15)throw Error('Encoded scene checks failed');
 const filter='select='+frames.map(f=>`eq(n\\,${f})`).join('+');
 execFileSync('ffmpeg',['-v','error','-i',out,'-vf',filter,'-fps_mode','vfr',path.join(o,'encoded-%02d.png')]);
 const encoded=frames.map((f,i)=>{const file=`encoded-${String(i+1).padStart(2,'0')}.png`;if(!fs.existsSync(path.join(o,file)))throw Error('Encoded checkpoint absent');return {frame:f,file,sha256:sha(path.join(o,file))};});
 fs.writeFileSync(path.join(o,'encoded-checkpoints.en.json'),JSON.stringify(encoded,null,2));
 fs.writeFileSync(path.join(o,'probe.json'),JSON.stringify(p,null,2));
 fs.writeFileSync(path.join(o,'render.en.json'),JSON.stringify({runID:process.env.GITHUB_RUN_ID,commit:process.env.GITHUB_SHA,step:s.step,sectionID:s.sectionID,contractKind:c.kind,contractSHA256:sha(path.join(R,'contracts.json')),videoSHA256:sha(out),visualSHA256:sha(path.join(o,'visual.mp4')),sourceAudioSHA256:s.audio.sha256,sourceAudioFrames:s.audioFrames,frames:s.frames,durationSeconds:s.durationSeconds,fullLessonRendered:false,humanPlaybackVerified:false,timing:'Actual-recording approximate word/cue clock supplied by verified preparation; no text-duration estimate, scaling or speech stretching',selectedImageSHA256:s.image?.sha256||null,encodedCheckpoints:encoded.length},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
