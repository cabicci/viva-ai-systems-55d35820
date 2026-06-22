/** Deterministic Gulf topic titles keyed by normalized titleEn (pilot + common catalog). */
export const GULF_TOPIC_TITLE_BY_TITLE_EN: Readonly<Record<string, string>> = {
  "what is ai": "وش هو الـ AI؟",
  "idea to page": "من الفكرة للصفحة",
  "reactive vs proactive": "Reactive مقابل Proactive",
  "tokens and training": "التوكنز والتدريب",
  "parameters (temperature)": "إعدادات الحرارة",
  "transition — from language to app": "من اللغة للتطبيق",
  "frontend (application interface)": "واجهة التطبيق",
  "backend & api (mail carrier)": "الـ Backend والـ API",
  "wireframe — sketch before you build": "الوايرفريم قبل البناء",
  "first prompt to lovable": "أول برومبت في Lovable",
  "sessions & jwt": "الجلسات والـ JWT",
  "agents — ai takes decisions": "الوكلاء وقرارات الـ AI",
  "from automation to insight": "من الأتمتة للرؤية",
  "feeling to question": "من الإحساس للسؤال",
  "right question rule": "قاعدة السؤال الصح",
  "three sources": "ثلاث مصادر",
  "ai summarization": "تلخيص بالـ AI",
  "automated dashboard": "لوحة تلقائية",
  "pattern vs outlier": "النمط مقابل الشذوذ",
  "question mistakes": "أخطاء الأسئلة",
  "from decisions to business": "من القرارات للأعمال",
  "where you are on the map": "مكانك على الخريطة",
  "webhooks & apis": "الويبهوكس والـ APIs",
  "rag in automation": "RAG في الأتمتة",
  "from decisions to leadership": "من القرارات للقيادة",
  "strategic / operational / admin": "استراتيجي وتشغيلي وإداري",
  "why content is not posting": "ليش المحتوى مو مجرد نشر",
  "hook — first seconds": "الهوك في أول ثواني",
  "cta — move the viewer": "CTA يحرك المشاهد",
  "thumbnails and captions": "الثمبنيلز والكابشنز",
};

const GULF_PHRASE_BY_ENGLISH: Readonly<Record<string, string>> = {
  feeling: "الإحساس",
  question: "السؤال",
  idea: "الفكرة",
  page: "الصفحة",
  automation: "الأتمتة",
  insight: "الرؤية",
  decisions: "القرارات",
  business: "الأعمال",
  pattern: "النمط",
  outlier: "الشذوذ",
};

export function normalizeTitleEnKey(titleEn: string): string {
  return titleEn.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Heuristic for simple "A to B" catalog titles when no explicit map entry exists. */
export function heuristicGulfTitleFromTitleEn(titleEn: string): string | null {
  const trimmed = titleEn.trim();
  const toMatch = trimmed.match(/^(.+?)\s+to\s+(.+)$/i);
  if (!toMatch) return null;

  const fromPhrase = gulfPhraseForEnglishWords(toMatch[1]!);
  const toPhrase = gulfPhraseForEnglishWords(toMatch[2]!);
  if (!fromPhrase || !toPhrase) return null;

  return `من ${fromPhrase} ل${toPhrase}`;
}

function gulfPhraseForEnglishWords(englishPhrase: string): string | null {
  const words = englishPhrase.trim().toLowerCase().split(/\s+/);
  if (words.length === 0) return null;

  const mapped = words.map((word) => GULF_PHRASE_BY_ENGLISH[word] ?? null);
  if (mapped.some((value) => value === null)) return null;

  const [first, ...rest] = mapped as string[];
  if (rest.length === 0) return first!;
  return [first, ...rest].join(" ");
}

export function lookupGulfTopicTitle(titleEn: string): string | null {
  const key = normalizeTitleEnKey(titleEn);
  const mapped = GULF_TOPIC_TITLE_BY_TITLE_EN[key];
  if (mapped) return mapped;
  return heuristicGulfTitleFromTitleEn(titleEn);
}
