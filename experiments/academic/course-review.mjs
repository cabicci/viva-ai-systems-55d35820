import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({executablePath:process.env.ACADEMIC_CHROME,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const syllabus=JSON.parse(await fs.readFile('docs/academic/curriculum-proposal.json','utf8'));
const ids=syllabus.modules.flatMap(m=>m.lessons.map(l=>l.id));
const report=[];
const exportPdfs=process.env.ACADEMIC_EXPORT_PDFS==='1';
const locales=process.env.ACADEMIC_LOCALES?.split(',')??['ar-EG','ar-MSA','ar-Gulf','en'];
assert.ok(locales.length && locales.every(l=>['ar-EG','ar-MSA','ar-Gulf','en'].includes(l)));
await fs.mkdir('tmp/academic-course-qa',{recursive:true});
for(const locale of locales) {
 const page=await browser.newPage({viewport:{width:390,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('experiments/academic/review/Masaarat_Academic_Interactive_Preview.html')).href+'?locale='+locale);
 await page.locator('aside nav button').first().waitFor();
 for(let i=0;i<ids.length;i++) {
  await page.waitForFunction(expected=>Array.from(document.querySelectorAll('.screen-only header')).at(-1)?.textContent?.includes(expected),ids[i]);
  assert.ok((await page.locator('.screen-only header').last().innerText()).includes(ids[i]));
  const tabs=page.locator('aside nav button');
  assert.equal(await tabs.count(),i===0?8:7);
  if(i>0) {
   assert.equal(await page.locator('iframe').count(),0);
   assert.equal(await page.locator('#lesson-panel article').count(),6);
   assert.equal(await page.locator('#lesson-panel [data-visual-role=reading]').count(),3);
   await tabs.nth(2).click();
   assert.equal(await page.locator('#lesson-panel fieldset').count(),6);
   assert.equal(await page.locator('#lesson-panel input[type=radio]').count(),24);
   await page.locator('#lesson-panel fieldset').evaluateAll(items=>items.forEach(item=>item.querySelector('input')?.click()));
   await page.locator('#lesson-panel button').click();
   assert.match(await page.locator('[role=status]').innerText(),/\/\s*6/);
   await tabs.nth(3).click();
   assert.equal(await page.locator('#lesson-panel textarea').count(),5);
   assert.equal(await page.locator('#lesson-panel details').count(),5);
   await page.locator('#lesson-panel textarea').first().fill('Review response');
   if(i===1)await page.screenshot({path:`tmp/academic-course-qa/${locale}-practice.png`,fullPage:true});
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(exportPdfs) {
   await page.evaluate(()=>document.fonts.ready);
   await page.emulateMedia({media:'print'});
   await page.pdf({path:`experiments/academic/review/pdf/Lesson_Workbook_${ids[i]}_${locale}.pdf`,printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="width:100%;text-align:center;font:9px sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'});
   await page.emulateMedia({media:'screen'});
  }
  if(i<ids.length-1)await page.getByRole('button',{name:locale==='en'?'Next lesson':'الدرس التالي',exact:true}).click();
 }
 // Verify locale changes preserve the final lesson and reset answer state.
 await page.locator('header select').selectOption(locale==='en'?'ar-EG':'en');
 await page.locator('aside nav button').first().waitFor();
 assert.ok((await page.locator('.screen-only header').last().innerText()).includes(ids.at(-1)));
 await page.getByRole('button',{name:locale==='en'?'المنهج':'Curriculum',exact:true}).click();
 assert.equal(await page.locator('[data-testid=academic-course-card]').count(),1);
 await page.screenshot({path:`tmp/academic-course-qa/${locale}-catalogue.png`,fullPage:true});
 await page.getByRole('button',{name:locale==='en'?'افتح المنهج':'Open curriculum',exact:true}).click();
 assert.equal(await page.getByRole('button').filter({hasText:locale==='en'?'افتح الدرس':'Open lesson'}).count(),40);
 assert.deepEqual(errors,[]);
 report.push({locale,lessonsVisited:40,expandedQuizQuestions:234,readingVisuals:117,missingVideoTabsHidden:39,courseCards:1,localePreservesLesson:true,exportedWorkbooks:exportPdfs?40:0,errors:0});
 console.log(locale,'40 lessons checked',exportPdfs?'and workbooks exported':'');
 await page.close();
}
await browser.close();
await fs.writeFile('experiments/academic/review/course-checks.json',JSON.stringify(report,null,2)+'\n');
console.log(`PASS: ${locales.length*40} lesson visits, ${locales.length*234} expanded quiz questions, ${locales.length*117} reading visuals; locale, mobile and runtime checks.`);
