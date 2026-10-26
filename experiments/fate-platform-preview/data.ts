import source from "./source-data.json";
import type { AcademicCourse, AcademicLesson } from "@/lib/academic-education/types";
export const courseId = "AC-FATE";
const language = (locale:string) => locale === "en" ? "en" : "ar";
export const bindings = source.blueprint.stations.flatMap((station,mi) => station.steps.map((stableID,li) => ({ stableID, moduleId: `${courseId}-M${String(mi+1).padStart(2,"0")}`, nativeId: `${courseId}-M${String(mi+1).padStart(2,"0")}-L${String(li+1).padStart(2,"0")}`, position: source.blueprint.steps.findIndex(x=>x.id===stableID)+1, station })));
export function catalogue(locale:string): AcademicCourse[] {
 const lang=language(locale);
 return [{id:courseId,title:source.blueprint.path[lang],reviewOnly:true,released:false,lessons:bindings.map(b=>({id:b.nativeId,title:source.blueprint.steps.find(x=>x.id===b.stableID)!.title[lang],moduleId:b.moduleId,position:b.position,introductory:b.stableID==="FATE2-S01"}))}];
}
export function stationTitle(id:string,locale:string) { return bindings.find(x=>x.moduleId===id)?.station.title[language(locale)]; }
function cleanInline<T>(value:T):T { if(typeof value==="string")return value.replace(/`([^`]+)`/g,"$1") as T;if(Array.isArray(value))return value.map(cleanInline) as T;if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,cleanInline(v)])) as T;return value; }
export function firstLesson(locale:string): AcademicLesson {
 const lang=language(locale),s=source.firstLesson[lang],nativeId=bindings.find(x=>x.stableID==="FATE2-S01")!.nativeId;
 const publicMCQ=source.assessment.items.filter(x=>x.type==="mcq");
 const constructed=source.assessment.items.filter(x=>x.type==="constructed");
 return cleanInline({id:nativeId,locale,title:s.title,intro:s.intro,goals:s.outcomes,
  sections:[...s.sections.map(p=>({id:p.id,title:p.title,text:p.paragraphs.join("\n\n"),reflection:""})),{id:"summary",title:lang==="en"?"Lesson summary":"ملخّص الدرس",text:s.summary.join("\n\n"),reflection:s.next}],
  example:{title:s.example.title,text:s.example.scenario+"\n\n"+s.example.commonError,steps:s.example.steps.map(p=>p.text+"\n"+p.equation),decision:s.example.conclusion},
  quiz:publicMCQ.map(q=>({id:q.id,question:q[lang].question,options:(q[lang] as {options?:string[]}).options??[]})),
  assignment:{prompt:s.guided.title+"\n\n"+s.guided.scenario,fields:[s.guided.massLabel,s.guided.amountLabel,...s.practice,...constructed.map(q=>q[lang].question)],criteria:[]},
  faq:s.faq,summary:s.summary});
}
export function firstFigures(locale:string) { const lang=language(locale);return Object.entries(source.firstLesson.visuals).map(([key,v])=>({src:`/__fate-assets/${key}.jpg`,alt:v.alt[lang],caption:v.caption[lang]})); }
export const sourceIdentities=source.sourceFiles;
