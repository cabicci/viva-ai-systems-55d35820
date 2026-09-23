import eg from "../content/ar-EG.json";
import msa from "../content/ar-MSA.json";
import gulf from "../content/ar-Gulf.json";
import en from "../content/en.json";
export const lessons = {"ar-EG":eg,"ar-MSA":msa,"ar-Gulf":gulf,en};
export type Locale = keyof typeof lessons;
export type Lesson = typeof en;
export const locales = Object.keys(lessons) as Locale[];
export const localeLabels: Record<Locale,string> = {"ar-EG":"مصري","ar-MSA":"العربية الفصحى","ar-Gulf":"خليجي",en:"English"};
export function getLesson(locale: string): Lesson {
  if (!Object.hasOwn(lessons,locale)) throw new Error("Unsupported pilot locale");
  return lessons[locale as Locale];
}
export function retrieveHint(scope:{lessonId:string;locale:string;level:string},index:number) {
 const lesson=getLesson(scope.locale);
 if(scope.lessonId!==lesson.lessonId||scope.level!==lesson.level) throw new Error("Hint scope mismatch");
 const hint=lesson.hints[index]; if(!hint) throw new Error("Unknown hint");
 const source=lesson.scenes.find(s=>s.id===hint.sourceScene);
 if(!source) throw new Error("Missing source");
 return {...hint,citation:{lessonId:lesson.lessonId,locale:lesson.locale,level:lesson.level,sceneId:source.id,title:source.title}};
}
export function assemblePrompt(parts:string[]) {
 if(parts.length!==3||parts.some(p=>!p.trim())) return null;
 return parts.map(p=>p.trim().slice(0,300)).join(". ");
}
