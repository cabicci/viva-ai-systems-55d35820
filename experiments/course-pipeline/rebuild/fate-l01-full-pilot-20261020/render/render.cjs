const fs=require('fs'),path=require('path');
const {bundle}=require('@remotion/bundler'),{selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const {execFileSync}=require('child_process');
async function main(){
 const root=__dirname,data=JSON.parse(fs.readFileSync(path.join(root,'render-data.json'),'utf8')),scene=data.scenes[0],out=path.join(root,'output');
 if(scene.locale==='ar'){
  const result=execFileSync('python',['-B',path.join(root,'pronunciation-gate.py'),'--report',path.join(root,'pronunciation-gate.json'),'--audio',path.join(root,'public',scene.audio),'--manifest',path.join(root,'manifest.json'),'--scene',scene.id],{encoding:'utf8'});
  const decision=JSON.parse(result);if(!decision.allowed)throw Error('Pronunciation review blocks this exact audio');
 }
 const serveUrl=await bundle({entryPoint:path.join(root,'Scenes.tsx'),publicDir:path.join(root,'public')});
 const composition=await selectComposition({serveUrl,id:scene.id});
 const moments=[Math.min(composition.durationInFrames-2,Math.ceil((scene.anchors[1].time+.65)*30)),Math.min(composition.durationInFrames-2,Math.ceil((Math.max(...scene.anchors.map(a=>a.time))+.65)*30))];
 for(let i=0;i<moments.length;i++)await renderStill({serveUrl,composition,frame:moments[i],output:path.join(out,`frame-${i+1}.png`),imageFormat:'png'});
 await renderMedia({serveUrl,composition,outputLocation:path.join(out,scene.id+'.mp4'),codec:'h264',audioCodec:'aac',pixelFormat:'yuv420p',colorSpace:'bt709',crf:20,concurrency:2,onProgress:({progress})=>{if(Math.floor(progress*100)%20===0)process.stdout.write('.')}});
 const probe=execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-count_frames','-of','json',path.join(out,scene.id+'.mp4')],{encoding:'utf8'});fs.writeFileSync(path.join(out,'probe.json'),probe);
 const q=JSON.parse(probe),v=q.streams.find(s=>s.codec_type==='video'),a=q.streams.find(s=>s.codec_type==='audio');if(!v||!a||v.width!==1920||v.height!==1080||Number(v.nb_read_frames)!==scene.frames)throw Error('Output media verification failed');
 fs.writeFileSync(path.join(out,'render.json'),JSON.stringify({execution:'GitHub Actions',runId:process.env.GITHUB_RUN_ID,commit:process.env.GITHUB_SHA,scene:scene.id,frames:scene.frames,durationSeconds:scene.durationSeconds,audioSHA256:scene.audioSHA256,stillsAtFrames:moments,verified:'1080p H264 AAC, decoded frame count, actual source audio hash; full human playback and accent not certified'},null,2));
 console.log('\nRendered and verified '+scene.id);
}main().catch(e=>{console.error(e);process.exitCode=1});
