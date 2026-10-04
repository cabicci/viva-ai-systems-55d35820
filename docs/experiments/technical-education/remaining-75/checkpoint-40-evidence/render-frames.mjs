import {bundle} from '/workspace/scratch/61b6becf6b09/masaarat/remotion/node_modules/@remotion/bundler/dist/index.js';
import {openBrowser,selectComposition,renderStill} from '/workspace/scratch/61b6becf6b09/masaarat/remotion/node_modules/@remotion/renderer/dist/index.js';
import {readFile,writeFile} from 'node:fs/promises';
const root='/workspace/scratch/61b6becf6b09/masaarat';
const fonts={};for(const [subset,suffix] of [['arabic','QyyS4J0'],['latin-ext','SCyS4J0'],['latin','RiyS']])fonts[`https://fonts.gstatic.com/s/cairo/v31/SLXVc1nY6HkvangtZmpQdkhzfH5lkSsc${suffix}.woff2`]='data:font/woff2;base64,'+(await readFile('/tmp/technical-fonts/'+subset+'.woff2')).toString('base64');
const serveUrl=await bundle({entryPoint:root+'/remotion/src/furniture/index.tsx',outDir:'/tmp/technical-40-qa/bundle',publicDir:root+'/remotion/public'});
const browser=await openBrowser('chrome',{browserExecutable:'/tmp/technical-chrome/chromium'});
const original=browser.newPage.bind(browser);const proof=[];
browser.newPage=async opts=>{const page=await original(opts);await page.evaluateOnNewDocument(map=>{const Face=window.FontFace;window.FontFace=class extends Face{constructor(family,source,desc){let local=source;for(const [url,data] of Object.entries(map))local=local.replace(url,data);super(family,local,desc);}};},fonts);return page;};
try{
for(const locale of ['ar-EG','ar-MSA','ar-Gulf','en'])for(const id of ["M06-L01", "M06-L02", "M06-L03", "M06-L04", "M07-L01", "M07-L02", "M07-L03", "M07-L04", "M08-L01", "M08-L02", "M08-L03", "M09-L01", "M09-L02", "M09-L03", "M09-L04", "M10-L01", "M10-L02", "M10-L03", "M11-L01", "M11-L02"]){
let props,comp;
if(id==='pilot'){props={locale,sceneFrames:Array(7).fill(90),narrated:true};comp='furniture-pilot-assembly';}
else{const lesson=JSON.parse(await readFile(`${root}/src/lib/technical-education/lessons/${id}__${locale}.json`));const first=lesson.sections[0].diagram;const scenes=[{title:lesson.title,detail:lesson.goals[0],spoken:lesson.intro,diagram:first},...lesson.sections.map(s=>({title:s.title,detail:s.text.split('.')[0]+'.',spoken:s.text,diagram:s.diagram})),{title:lesson.example.title,detail:lesson.example.decision,spoken:'',diagram:first}];props={locale,title:lesson.title,scenes,sceneFrames:Array(5).fill(90)};comp='technical-lesson-explainer';}
const composition=await selectComposition({serveUrl,id:comp,inputProps:props,puppeteerInstance:browser});
for(let i=0;i<props.sceneFrames.length;i++){
const output=`/tmp/technical-40-qa/${id}-${locale}-${i}.png`;await renderStill({serveUrl,composition,inputProps:props,frame:i*90+30,output,puppeteerInstance:browser,imageFormat:'png'});}
proof.push({id,locale,frames:props.sceneFrames.length,font:'Cairo',status:'rendered'});console.log(id,locale,'rendered');}
await writeFile('/tmp/technical-40-qa/results.json',JSON.stringify(proof,null,2));
}finally{await browser.close({silent:true});}
