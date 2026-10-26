export * from "../../src/lib/learning-lines";
import { getLineCopy as originalCopy } from "../../src/lib/learning-lines";
export function getLineCopy(...args: Parameters<typeof originalCopy>) { const base=originalCopy(...args);return {...base,academicIntro:args[0]==="en"?"University learning paths combining explanation, worked examples, practice and assessment.":"مسارات جامعية بتجمع الشرح والأمثلة والتطبيق والتقييم حسب موضوعك."}; }
