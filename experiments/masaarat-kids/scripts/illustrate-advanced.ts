import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const base=resolve(import.meta.dir,'..'),locales=['ar-EG','ar-MSA','ar-Gulf','en'];
const font=(await readFile(resolve(base,'public/fonts/Cairo.ttf'))).toString('base64');
const logo=(await readFile(resolve(base,'public/brand/logo.png'))).toString('base64');
const safe=(s:string)=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const motifs=[
 '<path d="M90 90h300v230H90zM135 145h205M135 190h150M135 235h185"/><circle cx="367" cy="269" r="51"/><path d="m404 308 48 48"/>',
 '<rect x="80" y="90" width="140" height="230" rx="12"/><rect x="270" y="90" width="140" height="230" rx="12"/><path d="M115 145h70m-70 35h70m190-35h70m-70 35h70M225 205h40"/>',
 '<path d="M75 100h330v220H75zM75 160h330M75 220h330M185 100v220M295 100v220"/><circle cx="348" cy="270" r="19"/>',
 '<path d="M85 270h85V155h85V95h85v175h85M65 310h390"/><circle cx="128" cy="195" r="16"/><circle cx="298" cy="137" r="16"/>',
 '<path d="M245 77 390 125v102c0 88-48 125-145 165C148 352 100 315 100 227V125z"/><path d="m175 225 50 45 93-105"/>',
 '<circle cx="230" cy="210" r="75"/><path d="M230 135V75M155 210H85m145 75v65m75-140h90M178 160l-48-43m154 37 47-43m-48 150 48 44"/>',
 '<rect x="80" y="75" width="320" height="260" rx="18"/><path d="M115 135h250M115 190h175M115 245h215"/><circle cx="345" cy="270" r="38"/>',
 '<path d="M80 320h350M95 320V180h70v140m42 0V115h70v205m42 0V220h70v100"/><path d="m105 140 110-63 107 60"/>',
 '<rect x="65" y="85" width="160" height="225" rx="16"/><rect x="265" y="85" width="160" height="225" rx="16"/><path d="m202 198 25 27 35-55M97 132h95m-95 40h75m128-40h95m-95 40h75"/>',
 '<path d="M240 72 370 125v93c0 80-60 130-130 165-70-35-130-85-130-165v-93z"/><circle cx="240" cy="190" r="35"/><path d="M165 287q75-70 150 0"/>',
 '<circle cx="135" cy="130" r="35"/><circle cx="350" cy="130" r="35"/><circle cx="245" cy="300" r="35"/><path d="m164 154 58 115m100-115-54 115M170 130h145"/>',
 '<path d="M95 105h310v220H95zM125 155h240M125 205h180M125 255h210"/><path d="m325 275 30 30 65-75"/>'
];
const browser=await chromium.launch({channel:'chrome',headless:true});let count=0;const receipts=[];
for(const level of [2,3])for(let n=1;n<=12;n++)for(const locale of locales){
 const slug='lesson-'+String(n).padStart(2,'0'),folder=resolve(base,'curriculum/level-'+level,slug);
 const d=JSON.parse(await readFile(resolve(folder,locale+'.json'),'utf8')),b=d.imageBrief,rtl=locale!=='en';
 const labels=b.labels.slice(0,4).map((x:string,i:number)=>'<div class="tile"><span>'+String(i+1)+'</span>'+safe(x)+'</div>').join('');
 const icon='<svg viewBox="0 0 500 420" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="12" width="476" height="396" rx="30" fill="#F9FCFA" stroke="#D3E1E6" stroke-width="4"/><g fill="none" stroke="'+(level===2?'#6695A0':'#9579A9')+'" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">'+motifs[n-1]+'</g></svg>';
 const html='<!doctype html><html lang="'+(rtl?'ar':'en')+'" dir="'+(rtl?'rtl':'ltr')+'"><meta charset="utf-8"><style>@font-face{font-family:Cairo;src:url(data:font/ttf;base64,'+font+')}*{box-sizing:border-box}body{margin:0;width:1900px;height:1000px;overflow:hidden;padding:55px 76px;color:#253C50;font-family:Cairo;background:radial-gradient(at 0 0,#E2F3E9,transparent 58%),radial-gradient(at 100% 10%,#F2E7F6,transparent 58%),linear-gradient(#FAFCFF,#FFFBEF)}header{height:145px;display:flex;align-items:center;justify-content:space-between;gap:25px}h1{font-size:46px;line-height:1.4;margin:0}header img{width:230px;height:105px;object-fit:contain}main{display:grid;grid-template-columns:500px 1fr;gap:55px;align-items:center;height:570px}.tiles{display:grid;grid-template-columns:1fr 1fr;gap:20px}.tile{min-height:150px;display:flex;align-items:center;gap:18px;padding:20px;border:2px solid #C8DBDF;border-radius:24px;background:#FFF;font-size:25px;font-weight:700;line-height:1.4;overflow-wrap:anywhere}.tile:nth-child(3n){background:#F6F0FA}.tile span{width:40px;height:40px;flex:none;display:grid;place-items:center;border-radius:12px;background:#DCEFE3;font-size:21px;color:#35634D}footer{margin-top:32px;padding:24px;border-radius:21px;background:#E6F0E9;font-size:27px;font-weight:700;line-height:1.5;text-align:center}</style><body><header><h1>'+safe(b.title)+'</h1><img src="data:image/png;base64,'+logo+'"></header><main>'+icon+'<div class="tiles">'+labels+'</div></main><footer>'+safe(d.subtitle)+'</footer></body></html>';
 const page=await browser.newPage({viewport:{width:1900,height:1000}});await page.setContent(html);await page.evaluate(()=>document.fonts.ready);
 const dest=resolve(base,'public/generated/illustrations/level-'+level,slug);await mkdir(dest,{recursive:true});const file=resolve(dest,locale+'.png');await page.screenshot({path:file});await page.close();
 receipts.push({level,lesson:n,locale,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});count++;
}
await browser.close();await writeFile(resolve(base,'evidence/advanced-illustrations.json'),JSON.stringify({count,assets:receipts},null,2)+'\n');console.log('Created '+count+' separate lesson illustrations.');
