import type { RagPackageLocale } from "./types";

/** Egyptian source wording is preserved from 6865fd44538226f52053c07c6713a91348b8462a.
 * The three localized corrections are review candidates under CURRENT-LESSON-RAG-PARITY-v2.
 * Including a candidate here does not approve a source release or deployment.
 */
export const CURRENT_INTRO_MODEL_CONCEPTS: Record<RagPackageLocale, Readonly<{ term: string; meaning: string; example: string }>> = Object.freeze({
  "ar-EG": Object.freeze({
    term: "Model (موديل)",
    meaning: "نظام ذكاء اصطناعي اتدرّب على بيانات وأمثلة، وبيستخدم الأنماط اللي اتعلمها عشان يولّد رد على طلبك. ده غير تطبيق الدردشة اللي بتستخدمه.",
    example: "ChatGPT تطبيق دردشة بيشغّل موديلات؛ الموديل هو اللي بيعالج طلبك ويولّد الرد. اسم التطبيق واسم الموديل مش نفس الحاجة.",
  }),
  "ar-MSA": Object.freeze({
    term: "Model (موديل)",
    meaning: "نظام ذكاء اصطناعي مُدرَّب على بيانات وأمثلة، يستخدم الأنماط التي تعلّمها لتوليد رد على طلبك. وهو مختلف عن تطبيق الدردشة الذي تستخدمه.",
    example: "ChatGPT تطبيق دردشة يشغّل نماذج ذكاء اصطناعي؛ النموذج هو الذي يعالج طلبك ويولّد الرد. اسم التطبيق واسم النموذج ليسا الشيء نفسه.",
  }),
  "ar-Gulf": Object.freeze({
    term: "Model (موديل)",
    meaning: "نظام ذكاء اصطناعي تدرّب على بيانات وأمثلة، ويستخدم الأنماط اللي تعلّمها عشان يولّد رد على طلبك. هذا غير تطبيق الدردشة اللي تستخدمه.",
    example: "ChatGPT تطبيق دردشة يشغّل موديلات؛ الموديل هو اللي يعالج طلبك ويولّد الرد. اسم التطبيق واسم الموديل مو نفس الشي.",
  }),
  en: Object.freeze({
    term: "Model",
    meaning: "An AI system trained on data and examples that uses the patterns it learned to generate a response to your request. It is different from the chat application you use.",
    example: "ChatGPT is a chat application that runs AI models; the model processes your request and generates the response. The application name and the model name are not the same thing.",
  }),
});

export const CURRENT_INTRO_MODEL_CONCEPT = CURRENT_INTRO_MODEL_CONCEPTS["ar-EG"];
