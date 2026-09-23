import {lessons,locales} from "../src/data";
import {writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const errors:string[]=[];const reference=lessons.en;
for(const locale of locales){
 const l=lessons[locale],ids=l.scenes.map(s=>s.id);
 if(l.locale!==locale)errors.push(locale+":wrong locale");
 if(l.direction!==(locale==="en"?"ltr":"rtl"))errors.push(locale+":wrong direction");
 if(JSON.stringify(ids)!==JSON.stringify(reference.scenes.map(s=>s.id)))errors.push(locale+":scene mismatch");
 if(JSON.stringify(l.skillIds)!==JSON.stringify(reference.skillIds))errors.push(locale+":skill mismatch");
 if(l.scenes.length!==12||l.quiz.length!==5||l.hints.length!==4)errors.push(locale+":incomplete lesson");
 for(const scene of l.scenes){if(!scene.narration.trim()||!scene.display.trim())errors.push(locale+":empty scene");
 if(locale==="en"&&/[\u0600-\u06ff]/.test(scene.narration))errors.push(locale+":Arabic leaked to English");
 if(locale==="ar-MSA"&&/(دلوقتي|عايز|إزاي|كده|هنتعلم|مش\s)/.test(scene.narration))errors.push(locale+":dialect leaked to MSA");
 if(locale==="ar-Gulf"&&/(دلوقتي|عايز|إزاي|كده|ما تبعتش|ما تكتبش|هنتعلّم)/.test(scene.narration))errors.push(locale+":Egyptian leaked to Gulf");}
 for(const q of l.quiz){if(q.answer<0||q.answer>=q.options.length||!q.explanation||!ids.includes(q.sourceScene))errors.push(locale+":invalid quiz "+q.id);}
 for(const h of l.hints){if(!ids.includes(h.sourceScene))errors.push(locale+":invalid hint");}
}
const report={passed:errors.length===0,locales:locales.length,scenes:locales.length*12,quizItems:locales.length*5,hints:locales.length*4,errors,limits:["Editorial checks do not replace review by a child-education specialist or native speakers.","Voice generation and listening QA remain separate gates.","Curated retrieval is not a connected generative RAG service."]};
await writeFile(resolve(import.meta.dir,"../evidence/content-validation.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report));if(errors.length)process.exit(1);
