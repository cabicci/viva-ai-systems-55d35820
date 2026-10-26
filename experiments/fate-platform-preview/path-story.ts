export * from "../../src/lib/path-story";
import { getPathDefinition as originalDefinition } from "../../src/lib/path-story";
import source from "./source-data.json";
export function getPathDefinition(...args: Parameters<typeof originalDefinition>) {
 const base=originalDefinition(...args);const [line,locale]=args;
 const isFate=typeof window!=="undefined"&&window.location.pathname.startsWith("/academic/courses/AC-FATE");
 if(line!=="academic"||!isFate)return base;
 const en=locale==="en",count=source.blueprint.steps.length,stations=source.blueprint.stations.length;
 return {...base,title:(en?"Path ":"مسار ")+source.blueprint.path[en?"en":"ar"],
 intro:en?"Follow pesticide residues, exposure, effects and environmental fate through source-bound explanation, calculations and evidence checks.":"اتتبّع متبقيات المبيدات والتعرّض والتأثير ومصيرها في البيئة، بالشرح والحساب ومراجعة الدليل.",
 goals:en?`${count} steps across ${stations} stations: residues and food safety; environmental exposure; transfer in organisms; ecotoxicity evidence; and pesticide properties and fate.`:`${count} خطوة في ${stations} محطات: المتبقيات وسلامة الغذاء، والتعرّض البيئي، وانتقال المواد في الأحياء، والسميّة البيئية، وخواص المبيد ومصيره.`,
 audience:en?"University students with a foundation in chemistry and biology.":"لطلاب الجامعة اللي عندهم أساس في الكيمياء والأحياء.",
 requirements:en?"Basic chemistry and biology. The activities here are educational and digital; they do not certify laboratory or field competence.":"أساسيات الكيمياء والأحياء. التطبيق هنا تعليمي ورقمي؛ ما بيثبتش كفاءة معملية أو ميدانية."};
}
