import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=path.resolve(import.meta.dirname,'..');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.join(base,'editorial-review/index.html')).href);
const data=await page.locator('#data').textContent();
const course=JSON.parse(data);const results=[];
for(const locale of ['ar-EG','ar-MSA','ar-Gulf','en']){
 await page.selectOption('#locale',locale);
 for(let i=0;i<12;i++){
  await page.locator('nav button').nth(i).click();
  const d=course[i].locales[locale];
  const h=await page.locator('h1').textContent();
  if(h!==String(i+1)+'. '+d.title)throw Error('Wrong lesson '+locale+'/'+i);
  if(await page.locator('.question').count()!==d.quiz.length)throw Error('Missing quiz');
  if(await page.locator('.scene').count()!==d.scenes.length)throw Error('Missing scenes');
  if(await page.locator('html').getAttribute('dir')!==(locale==='en'?'ltr':'rtl'))throw Error('Direction');
  const text=await page.locator('#content').innerText();
  if(text.includes('undefined')||text.includes('[object Object]'))throw Error('Broken data rendering');
  results.push(locale+'/'+(i+1));
 }
 await page.locator('#all').click();
 if(await page.locator('h1').count()!==12)throw Error('Show all');
 await page.locator('#all').click();
}
for(const locale of ['ar-EG','en']){
 await page.setViewportSize({width:390,height:844});await page.selectOption('#locale',locale);await page.locator('nav button').nth(9).click();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 if(overflow)throw Error('Mobile overflow '+locale);
 await page.screenshot({path:path.join(base,'editorial-review/review-'+locale+'.png'),fullPage:false});
}
await browser.close();
if(errors.length)throw Error(errors.join('\n'));
const record={reviewedPackages:results.length,lessons:12,locales:4,checks:['all lesson navigation','quiz and scene count','RTL/LTR','no undefined text','show all','390px no horizontal overflow','no page errors'],humanLanguageApproval:'pending',date:new Date().toISOString()};
fs.writeFileSync(path.join(base,'evidence/editorial-viewer-qa.json'),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify(record));
