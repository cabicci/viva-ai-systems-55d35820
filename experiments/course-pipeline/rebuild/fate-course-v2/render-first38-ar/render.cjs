const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
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
