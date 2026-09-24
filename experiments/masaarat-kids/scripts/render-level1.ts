import {bundle} from '@remotion/bundler';
import {renderMedia,selectComposition} from '@remotion/renderer';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const base=resolve(import.meta.dir,'..'),number=Number(process.argv.find(x=>x.startsWith('--lesson='))?.split('=')[1]),level=Number(process.argv.find(x=>x.startsWith('--level='))?.split('=')[1]||'1'),locale=process.argv.find(x=>x.startsWith('--locale='))?.split('=')[1],preview=process.argv.includes('--preview');
if(!Number.isInteger(number)||number<1||number>12||![1,2,3].includes(level)||(level===1&&number===1)||!['ar-EG','ar-MSA','ar-Gulf','en'].includes(locale||''))throw Error('Specify supported level, lesson and locale');
const lesson=String(number).padStart(2,'0'),source=JSON.parse(await readFile(resolve(base,level===1?'content/level1-video.json':'content/advanced-video.json'),'utf8'))[(level===1?'':level+'/')+lesson+'/'+locale];
let timings:{frames:number;audio?:string;textSha256?:string}[];
if(preview)timings=source.scenes.map(()=>({frames:72}));
else{
 timings=JSON.parse(await readFile(resolve(base,'public/generated/audio/level'+level+'/lesson-'+lesson,locale!,'timings.json'),'utf8'));
 if(timings.length!==7)throw Error('Seven narration segments required');
 for(const [i,t] of timings.entries()){if(t.textSha256!==createHash('sha256').update(source.scenes[i].narration).digest('hex'))throw Error('Stale narration');if(!t.audio||!Number.isInteger(t.frames)||t.frames<1||(await readFile(resolve(base,'public',t.audio))).length<1000)throw Error('Missing audio');}
}
const serveUrl=await bundle({entryPoint:resolve(base,'src/VideoLevel1.tsx'),publicDir:resolve(base,'public'),webpackOverride:c=>c});
const inputProps={level,lesson:number,locale,timings},composition=await selectComposition({serveUrl,id:'kids-l'+level+'-'+lesson+'-'+locale,inputProps});
const folder=resolve(base,'public/generated/videos/level'+level+'/lesson-'+lesson);await mkdir(folder,{recursive:true});
const output=resolve(folder,locale+(preview?'-preview':'')+'.mp4');
await renderMedia({serveUrl,composition,inputProps,codec:'h264',outputLocation:output,concurrency:2,crf:21,overwrite:true,onProgress:p=>{if(p.renderedFrames%300===0)console.log('frames '+p.renderedFrames+'/'+composition.durationInFrames)}});
const media={level,lesson:number,locale,url:'generated/videos/level'+level+'/lesson-'+lesson+'/'+locale+'.mp4',kind:preview?'visual-preview':'narrated',frames:composition.durationInFrames,fps:24,durationSeconds:composition.durationInFrames/24};
await writeFile(resolve(folder,locale+(preview?'-preview':'')+'.json'),JSON.stringify(media,null,2)+'\n');
console.log('RENDERED '+lesson+'/'+locale+' '+media.durationSeconds.toFixed(1)+'s');
