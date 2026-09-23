import {bundle} from "@remotion/bundler";
import {renderMedia,renderStill,selectComposition} from "@remotion/renderer";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {createHash} from "node:crypto";
import {getLesson,locales,type Locale} from "../src/data";
const base=resolve(import.meta.dir,".."),preview=process.argv.includes("--preview"),stills=process.argv.includes("--stills");
const selected=process.argv.find(s=>s.startsWith("--locale="))?.split("=")[1];
if(selected&&!locales.includes(selected as Locale))throw new Error("Unsupported locale");
const targetLocales=selected?[selected as Locale]:locales;
const serveUrl=await bundle({entryPoint:resolve(base,"src/Video.tsx"),publicDir:resolve(base,"public"),webpackOverride:c=>c});
let media:Record<string,unknown>=JSON.parse(await readFile(resolve(base,"content/media.json"),"utf8"));
for(const locale of targetLocales){
 const lesson=getLesson(locale);
 let timings:{frames:number;audio?:string;textSha256?:string}[];
 if(preview)timings=lesson.scenes.map(()=>({frames:96}));
 else {timings=JSON.parse(await readFile(resolve(base,"public/generated/audio/"+locale+"/timings.json"),"utf8"));
 if(timings.length!==lesson.scenes.length||timings.some(t=>!t.audio||!Number.isInteger(t.frames)||t.frames<1))throw new Error("Complete narration timings required");
 for(const [i,t] of timings.entries()){if(t.textSha256!==createHash("sha256").update(lesson.scenes[i].narration).digest("hex"))throw new Error("Stale narration: regenerate changed scene before rendering");const audio=await readFile(resolve(base,"public",t.audio!));if(audio.length<1000)throw new Error("Missing audio");}}
 const inputProps={locale,timings,preview},composition=await selectComposition({serveUrl,id:"kids-"+locale,inputProps});
 await mkdir(resolve(base,"public/generated/videos"),{recursive:true});
 const name=locale+(preview?"-visual-preview":"")+".mp4";
 await renderMedia({serveUrl,composition,inputProps,codec:"h264",outputLocation:resolve(base,"public/generated/videos",name),concurrency:2,crf:21,overwrite:true,onProgress:p=>{if(p.renderedFrames%240===0)console.log(locale+" frames="+p.renderedFrames+"/"+composition.durationInFrames);}});
 if(stills){await mkdir(resolve(base,"public/generated/stills",locale),{recursive:true});let frame=0;for(let i=0;i<timings.length;i++){await renderStill({serveUrl,composition,inputProps,frame:frame+Math.min(36,timings[i].frames-1),output:resolve(base,"public/generated/stills",locale,String(i).padStart(2,"0")+".png"),imageFormat:"png"});frame+=timings[i].frames;}}
 media[locale]={url:"generated/videos/"+name,kind:preview?"visual-preview":"narrated",frames:composition.durationInFrames,fps:24,durationSeconds:composition.durationInFrames/24};
 await writeFile(resolve(base,"content/media.json"),JSON.stringify(media,null,2)+"\n");
 console.log("RENDERED "+locale+" "+(preview?"VISUAL_PREVIEW":"NARRATED"));
}
