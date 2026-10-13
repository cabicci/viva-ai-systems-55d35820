import {createRequire} from 'node:module';
import {readFile,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(root,'../..');
const require=createRequire(path.join(repo,'remotion/package.json'));
const {bundle}=require('@remotion/bundler');
const {openBrowser,selectComposition,renderStill}=require('@remotion/renderer');
const visualReceipt=JSON.parse(await readFile(path.join(root,'output/visuals/receipt.json'),'utf8'));
if(!visualReceipt.generated)throw new Error('Complete Gemini visuals are required for current style review');
const visuals={};
await mkdir(path.join(repo,'remotion/public/course-pipeline'),{recursive:true});
for(const asset of visualReceipt.assets){
 await copyFile(path.join(root,'output/visuals',asset.filename),path.join(repo,'remotion/public/course-pipeline',asset.filename));
 for(const scene of asset.scenes)visuals[scene]=`course-pipeline/${asset.filename}`;
}
const serveUrl=await bundle({entryPoint:path.join(repo,'remotion/src/course-pipeline/index.tsx'),publicDir:path.join(repo,'remotion/public')});
const browser=await openBrowser('chrome');
await mkdir(path.join(root,'review-evidence'),{recursive:true});
try{
 for(const locale of ['ar-EG','en','it','de']){
  const lesson=JSON.parse(await readFile(path.join(root,'course',locale+'.json'),'utf8'));
  const inputProps={locale,dir:lesson.dir,title:lesson.subtitle,eyebrow:lesson.eyebrow,scenes:lesson.scenes.map((s,i)=>({...s,startFrame:i*300,durationInFrames:300})),durationInFrames:2400,visuals};
  const composition=await selectComposition({serveUrl,id:'CoursePilot',inputProps,puppeteerInstance:browser});
  for(let i=0;i<8;i++)await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame:i*300+180,output:path.join(root,'review-evidence',`${locale}-${i+1}.png`),scale:.6});
  console.log(`${locale}: 8 scene frames rendered`);
 }
}finally{await browser.close({silent:true});}
