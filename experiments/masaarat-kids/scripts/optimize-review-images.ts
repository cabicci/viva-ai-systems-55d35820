import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const base=resolve(import.meta.dir,'../public/generated/illustrations');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();
let before=0,after=0;
for(const level of [1,2,3])for(let n=1;n<=12;n++)for(const locale of ['ar-EG','ar-MSA','ar-Gulf','en']){
 const folder=level===1?(n===1?base:resolve(base,'lesson-'+String(n).padStart(2,'0'))):resolve(base,'level-'+level,'lesson-'+String(n).padStart(2,'0'));
 const png=resolve(folder,locale+'.png'),webp=resolve(folder,locale+'.webp');
 const input=await readFile(png);before+=input.length;
 const encoded=await page.evaluate(async (data:string)=>{
  const img=new Image();img.src='data:image/png;base64,'+data;
  await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
  ctx.drawImage(img,0,0);
  return canvas.toDataURL('image/webp',0.95).split(',')[1];
 },input.toString('base64'));
 const output=Buffer.from(encoded,'base64');after+=output.length;
 await writeFile(webp,output);
}
await browser.close();
console.log(JSON.stringify({images:144,pngBytes:before,webpBytes:after}));
