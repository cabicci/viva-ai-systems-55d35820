import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=path.resolve(import.meta.dirname,'..');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
await page.goto(pathToFileURL(path.join(base,'editorial-review/index.html')).href);
const {course,level1Media}=JSON.parse(await page.locator('#data').textContent());
async function openLesson(i){if(await page.locator('#back-dashboard').count())await page.locator('#back-dashboard').click();await page.locator('[data-open-lesson="'+(Number(i)+1)+'"]').click();await page.locator('[data-lesson="'+(Number(i)+1)+'"]').waitFor();}
let packages=0,questions=0;
for(const locale of ['ar-EG','ar-MSA','ar-Gulf','en']){
 await page.selectOption('#locale',locale);
 for(let i=0;i<12;i++){
  await openLesson(i);const d=course[i].locales[locale];
  if(await page.locator('h1').textContent()!==d.title)throw Error('Title');
  if(await page.locator('html').getAttribute('dir')!==(locale==='en'?'ltr':'rtl'))throw Error('Direction');
  const quiz=page.locator('article>div').filter({has:page.locator('button svg.lucide-eye')});
  const reveals=page.locator('button').filter({has:page.locator('svg.lucide-eye')});
  if(await reveals.count()!==d.quiz.length)throw Error('Quiz count');
  // Shared platform quiz: predict, reveal options, select, feedback, reset on navigation.
  for(const q of d.quiz){
   const parent=page.locator('p').filter({hasText:q.question}).filter({hasNot:page.locator('p')}).last().locator('..').locator('..');
   await parent.locator('button').first().click();
   await parent.locator('li button').nth(q.answer).click();
   if(!(await parent.innerText()).includes(q.explanation))throw Error('Feedback');
   questions++;
  }
  const text=await page.locator('main').innerText();
  if(text.includes('undefined')||text.includes('[object Object]'))throw Error('Data');
  if(await page.locator('.scene,.script,.meta,#all').count())throw Error('Editorial chrome');
  if(await page.locator('video').count()!==(i===0||level1Media?.[String(i+1)]?.[locale]?.url?1:0))throw Error('Media slot');
  if(i===0){await page.locator('video').evaluate(v=>new Promise((resolve,reject)=>{if(v.readyState>=1)return resolve();v.onloadedmetadata=resolve;v.onerror=()=>reject(Error('Video source'));}));}
  {const image=page.locator('[data-lesson-image]');if(!await image.evaluate(x=>x.complete&&x.naturalWidth===1900))throw Error('Independent image');}
  if(i===9&&locale==='ar-EG')await page.screenshot({path:path.join(base,'editorial-review/desktop-ar-EG.png'),fullPage:false});
  packages++;
 }
}
for(const locale of ['ar-EG','ar-MSA','ar-Gulf','en']){
 await page.setViewportSize({width:390,height:844});await page.selectOption('#locale',locale);
 for(let i=0;i<12;i++){await openLesson(i);if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Overflow '+locale+'/'+i);}
 await page.screenshot({path:path.join(base,'editorial-review/review-'+locale+'.png'),fullPage:false});
}
await openLesson(0);await page.locator('#next').click();await page.locator('[data-lesson="2"]').waitFor();await page.locator('#prev').click();await page.locator('[data-lesson="1"]').waitFor();
await page.selectOption('#locale','ar-EG');
const fields=page.locator('#try textarea');for(let i=0;i<3;i++)await fields.nth(i).fill('fictional '+i);await page.locator('#try button').click();if(!await page.locator('[role=status]').textContent())throw Error('Builder');
await openLesson(2);await openLesson(0);if(await page.locator('#try textarea').first().inputValue())throw Error('State leaked');
await browser.close();if(errors.length||requests.length)throw Error(JSON.stringify({errors,requests}));
const record={date:new Date().toISOString(),packages,questions,sharedPlatformComponents:['IntroSection','QuizBlock'],sharedStyles:'src/styles.css',checks:['48 locale/lesson navigation','152 quiz feedback checks','4 existing video metadata loads','48 independent lesson images','48 mobile overflow checks','state reset','previous/next','prompt builder','no network submissions','no page errors'],humanVisualApproval:'pending'};
fs.writeFileSync(path.join(base,'evidence/editorial-viewer-qa.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record));