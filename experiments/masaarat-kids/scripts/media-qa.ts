import {chromium} from "playwright";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {readFile,writeFile,readdir,stat} from "node:fs/promises";
import {locales,localeLabels} from "../src/data";
const base=resolve(import.meta.dir,".."),browser=await chromium.launch({channel:"chrome",headless:true});
const media=JSON.parse(await readFile(resolve(base,"content/media.json"),"utf8"));
const page=await browser.newPage(),results=[];
await page.goto(pathToFileURL(resolve(base,"dist/index.html")).href);
for(const locale of locales){
 await page.getByRole("button",{name:localeLabels[locale],exact:true}).click();
 await page.waitForFunction(()=>{const v=document.querySelector("video");return v&&v.readyState>=1});
 const meta=await page.locator("video").evaluate((v:HTMLVideoElement)=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}));
 const entry=media[locale];
 if(!Number.isFinite(meta.duration)||Math.abs(meta.duration-entry.durationSeconds)>0.12||meta.width!==1280||meta.height!==720)throw new Error("Invalid video "+locale+" "+JSON.stringify(meta));
 const stills=(await readdir(resolve(base,"public/generated/stills",locale))).filter(p=>p.endsWith(".png"));
 if(stills.length!==12)throw new Error("Missing stills "+locale);
 if(entry.kind==="narrated"){
  const evidence=JSON.parse(await readFile(resolve(base,"evidence/narrated-"+locale+".json"),"utf8"));
  if(evidence.status!=="technical-pass"||evidence.frames!==entry.frames)throw new Error("Narration verification missing");
 }
 const file=resolve(base,"public",entry.url);
 results.push({locale,...meta,stillCount:stills.length,bytes:(await stat(file)).size,kind:entry.kind});
}
await browser.close();
const report={passed:true,results,listeningReview:"pending",generativeRagStatus:"not-connected"};
await writeFile(resolve(base,"evidence/media-validation.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report));
