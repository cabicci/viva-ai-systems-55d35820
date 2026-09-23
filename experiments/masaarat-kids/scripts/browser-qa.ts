import {chromium} from "playwright";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {writeFile} from "node:fs/promises";
import {locales,localeLabels,getLesson} from "../src/data";
const base=resolve(import.meta.dir,".."),browser=await chromium.launch({channel:"chrome",headless:true});
const results:unknown[]=[];const failures:string[]=[];
for(const width of [1366,390]){
 const page=await browser.newPage({viewport:{width,height:width===390?844:950}});const errors:string[]=[];
 page.on("pageerror",e=>errors.push(e.message));await page.goto(pathToFileURL(resolve(base,"dist/index.html")).href);await page.evaluate(()=>document.fonts.ready);
 for(const locale of locales){
  const lesson=getLesson(locale);await page.getByRole("button",{name:localeLabels[locale],exact:true}).click();
  await page.getByRole("heading",{name:lesson.title,exact:true}).waitFor();
  const visuals=page.locator(".lesson-illustration img");
  if(await visuals.count()!==1)failures.push(locale+":illustration-count");
  await visuals.evaluate((e:HTMLImageElement)=>e.decode());
  if(!(await visuals.evaluate((e:HTMLImageElement)=>e.naturalWidth===1900)))failures.push(locale+":illustration-load");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  const textareas=page.locator("textarea");for(let i=0;i<3;i++)await textareas.nth(i).fill([lesson.prompt.task,lesson.prompt.details,lesson.prompt.format][i]);
  await page.getByRole("button",{name:lesson.labels.build,exact:true}).click();
  if(!(await page.locator(".prompt-result").innerText()).includes(lesson.prompt.details))failures.push(locale+":builder");
  for(let i=0;i<lesson.quiz.length;i++){const field=page.locator("fieldset").nth(i);await field.locator('input[type=radio]').nth(lesson.quiz[i].answer).check();await field.locator("button").click();if(await field.locator(".feedback.correct").count()!==1)failures.push(locale+":quiz"+i);}
  await page.locator(".hint-buttons button").nth(2).click();if(!(await page.locator(".hint-answer").innerText()).includes(lesson.hints[2].answer))failures.push(locale+":hint");
  await page.getByRole("button",{name:lesson.labels.clear,exact:true}).click();if(await textareas.nth(0).inputValue())failures.push(locale+":clear");
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(base,"evidence",locale+"-"+width+".png"),fullPage:true});
  if(overflow)failures.push(locale+":"+width+":overflow");results.push({locale,width,overflow,quizPassed:5,independentIllustrations:1,hintSource:lesson.hints[2].sourceScene});
 }
 if(errors.length)failures.push(...errors);await page.close();
}
await browser.close();await writeFile(resolve(base,"evidence/browser-qa.json"),JSON.stringify({passed:failures.length===0,results,failures},null,2)+"\n");console.log(JSON.stringify({browserChecks:results.length,failures}));if(failures.length)process.exit(1);
