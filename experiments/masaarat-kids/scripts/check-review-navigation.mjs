import {chromium} from 'playwright';
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const base=path.resolve(import.meta.dirname,'..'),url=pathToFileURL(path.join(base,'editorial-review/index.html')).href;
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
const {course}=JSON.parse(await page.locator('#data').textContent());let reviewed=0;
for(const width of [1440,390]){
 await page.setViewportSize({width,height:900});
 for(const locale of ['ar-EG','ar-MSA','ar-Gulf','en']){
  await page.selectOption('#locale',locale);
  for(let i=0;i<12;i++){
   if(await page.locator('#lesson,select:not(#locale)').count())throw Error('Lesson dropdown remains');
   if(await page.locator('[data-open-lesson]').count()!==12)throw Error('Dashboard cards');
   await page.locator('[data-open-lesson]').nth(i).click();
   await page.locator('[data-lesson="'+(i+1)+'"]').waitFor();
   if(await page.locator('h1').textContent()!==course[i].locales[locale].title)throw Error('Wrong lesson');
   if(await page.locator('html').getAttribute('dir')!==(locale==='en'?'ltr':'rtl'))throw Error('Direction');
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Overflow');
   if(await page.locator('[data-open-lesson],#lesson').count())throw Error('Lesson selection in reader');
   if((await page.locator('#prev').count())!==(i>0?1:0))throw Error('Previous boundary');
   if((await page.locator('#next').count())!==(i<11?1:0))throw Error('Next boundary');
   await page.locator('#back-dashboard').click();await page.locator('[data-dashboard]').waitFor();reviewed++;
  }
 }
}
await page.setViewportSize({width:1440,height:1000});await page.selectOption('#locale','ar-EG');
await page.locator('#module-toggle').click();if(await page.locator('[data-open-lesson]').count())throw Error('Collapse');await page.locator('#module-toggle').click();
await page.screenshot({path:path.join(base,'editorial-review/navigation-dashboard.png')});
await page.locator('[data-open-lesson="1"]').click();await page.locator('#next').click();await page.locator('[data-lesson="2"]').waitFor();
await page.locator('#prev').click();await page.locator('[data-lesson="1"]').waitFor();
await page.goBack();await page.locator('[data-lesson="2"]').waitFor();
await page.reload();await page.locator('[data-lesson="2"]').waitFor();
await page.selectOption('#locale','en');if(await page.locator('h1').textContent()!==course[1].locales.en.title)throw Error('Locale lost route');
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(base,'editorial-review/navigation-mobile.png')});
await page.goto(url+'#/learn/12');await page.locator('#finish-path').click();await page.locator('[data-dashboard]').waitFor();
await browser.close();if(errors.length)throw Error(errors.join('\n'));
const evidence={date:new Date().toISOString(),reviewedNavigationCases:reviewed,sourcePatterns:['dashboard.tsx ModuleRow lesson cards','learn route previous/next/back links','shared Button variants'],checks:['No lesson dropdown','dashboard opens all 12 lessons in all locales','desktop/mobile','previous/next boundaries','browser Back','deep link reload','language retains lesson','module expand/collapse','no horizontal overflow','no page errors'],productionDeployment:false};
fs.writeFileSync(path.join(base,'evidence/review-navigation-qa.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
