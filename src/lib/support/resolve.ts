// Deterministic understanding of one (already redacted) question plus the thread's prior
// opaque topic. Decides whether to clarify, refuse private content, or which public facts
// and which single official link apply. The model only phrases what this allows.
import { cleanTopic, type SupportArea, type SupportMarket, type SupportTerm, type TopicRef } from "./context";
import { AREA_LINKS, pricingFacts, programFacts, url, type CatalogueLesson, type SupportLang } from "./sources";

const AR_DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g;
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(AR_DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const has = (re: RegExp, n: string) => re.test(n);

// All patterns run on normalize()d text (alef/ya/ta-marbuta folded, lowercase).
const INTL_RE = /(برا مصر|بره مصر|خارج مصر|مش في مصر|مش ف مصر|دولار|\busd\b|\$|dollar|international|outside egypt|abroad|not in egypt|دولي|السعوديه|الامارات|الكويت|قطر|الخليج|الاردن|المغرب|الجزاير|العراق|عمان|البحرين|ليبيا|تونس|لبنان|saudi|uae|dubai|kuwait|qatar|oman|bahrain|jordan|morocco|\busa\b|\buk\b|europe|germany|canada|france)/;
const EG_RE = /(مصر|مصري|بالجنيه|جنيه|جنيه|\begp\b|egypt|egyptian|cairo|القاهره|اسكندريه)/;
const KIDS_RE = /(اطفال|طفل|ابني|بنتي|ولادي|عيالي|كيدز|\bkids?\b|child|children|\bson\b|daughter)/;
const ACADEMIC_RE = /(اكاديمي|academic|اداره الاعمال|business management)/;
const TECH_RE = /(تقني|technical|نجار|اثاث|موبيليا|furniture|carpentr)/;
const AI_RE = /(ذكاء اصطناعي|الذكاء الاصطناعي|\bai\b|builder|creator|automator|analyst|chatgpt|prompt|برومبت|pro plus|\bpro\b|(?:^|\s)برو(?:\s|$)|برو ?بلس)/;
const PRO_PLUS_RE = /(pro ?plus|pro\+|برو ?بلس)/;
const PRO_RE = /(\bpro\b|(?:^|\s)برو(?:\s|$))/;
const LIFETIME_RE = /(مدي الحياه|lifetime|for life|دفعه واحده)/;
const TOPUP_RE = /(اسئله زياده|اسيله زياده|extra questions|top ?up|باقه اسئله|more questions)/;
const PRICE_RE = /(سعر|اسعار|بكام|تكلفه|تكلف|بيتكلف|فلوس|ادفع|price|pricing|cost|how much|fee|subscri|اشتراك|اشترك|باقه|باقات|\bplan|خصم|discount)/;
const MONTH_RE = /(شهري|الشهر|شهر|monthly|month)/;
const YEAR_RE = /(سنوي|السنه|سنه|سنويا|yearly|annual|year)/;
const OTHER_TERM_RE = /(ربع سنوي|3 شهور|تلات شهور|quarter|6 شهور|نص سنه|semi ?annual|half ?year|weekly|اسبوعي)/;
const LESSON_RE = /(درس|الدرس|دروس|lesson|خطوه|step)/;
const PROGRAM_RE = /(منهج|مناهج|مسار|مسارات|كورس|كورسات|course|curricul|program|بتدرسوا|بتعلموا|تتعلم|اتعلم|ادرس|study|learn)/;
const PRIVATE_RE = /(ابعت(لي)? (الدرس|المحتوي|الشرح|الملف)|محتوي الدرس كامل|الدرس كامل|نص الدرس|pdf|full (lesson|content|text)|send me the (lesson|content|file)|الاجابات|الاجابه|answers|حل (الكويز|الاختبار|الامتحان)|quiz answers|كلمه السر|كلمه المرور|باسورد|password|unlock code)/;
const FOLLOWUP_RE = /^(و|طب |طيب |and\b|what about\b|how about\b|ok\b|okay\b|اوك )|(?:^|\s)(it|that|same|ده|دي|بتاعه|بتاعها)(?:\s|$)/;

export type Detected = {
  area?: SupportArea;
  market?: SupportMarket;
  term?: SupportTerm;
  plan?: string;
  pricing: boolean;
  lessonWord: boolean;
  programWord: boolean;
  privateRequest: boolean;
  followup: boolean;
};

// Ages ("my 11 year old", "عنده 11 سنه") are not billing terms and point to Kids.
const AGE_RE = /\b(\d{1,2}) ?(?:-? ?years? ?-?old|yo|yrs? old)\b|(?:عنده|عندها|عمره|عمرها|سنه|سنها|سنه) ?(\d{1,2}) ?(?:سنه|سنين)?|(\d{1,2}) (?:سنه|سنين)/;
export function detect(question: string): Detected {
  const raw = normalize(question);
  const age = raw.match(AGE_RE);
  const ageValue = age ? Number(age[1] ?? age[2] ?? age[3]) : NaN;
  const n = age ? raw.replace(AGE_RE, " ") : raw;
  const area: SupportArea | undefined = has(KIDS_RE, n) || (ageValue >= 6 && ageValue <= 16)
    ? "kids"
    : has(ACADEMIC_RE, n)
      ? "academic"
      : has(TECH_RE, n)
        ? "technical"
        : has(AI_RE, n)
          ? "ai"
          : undefined;
  const market: SupportMarket | undefined = has(INTL_RE, n) || question.includes("$") ? "international" : has(EG_RE, n) ? "domestic" : undefined;
  const term: SupportTerm | undefined = has(OTHER_TERM_RE, n)
    ? (/(ربع|3 شهور|تلات|quarter)/.test(n) ? "quarterly" : "semiannual")
    : has(YEAR_RE, n)
      ? "yearly"
      : has(MONTH_RE, n)
        ? "monthly"
        : undefined;
  const plan = has(TOPUP_RE, n) ? "topup" : has(LIFETIME_RE, n) ? "lifetime" : has(PRO_PLUS_RE, n) ? "pro_plus" : has(PRO_RE, n) ? "pro" : undefined;
  return {
    area,
    market,
    term,
    plan,
    pricing: has(PRICE_RE, n) || !!plan || (!!term && !has(LESSON_RE, n)),
    lessonWord: has(LESSON_RE, n),
    programWord: has(PROGRAM_RE, n),
    privateRequest: has(PRIVATE_RE, n),
    followup: has(FOLLOWUP_RE, n) || n.split(" ").length <= 4,
  };
}

/* ----------------------------- lesson matching ----------------------------- */

const STOP = new Set(["the", "and", "for", "with", "your", "you", "what", "how", "from", "into", "ازاي", "ايه", "اللي", "في", "من", "علي", "عن", "مع", "درس", "الدرس", "lesson"]);
const tokens = (s: string) => normalize(s).split(" ").filter((t) => t.length >= 3 && !STOP.has(t));

export type LessonMatch = { lesson: CatalogueLesson; score: number };

/** Exact title containment wins; otherwise ≥75% of a title's (≥2) distinctive words. */
export function matchLessons(question: string, catalogue: CatalogueLesson[], area?: SupportArea): LessonMatch[] {
  const nq = ` ${normalize(question)} `;
  const qt = new Set(tokens(question));
  const out: LessonMatch[] = [];
  for (const lesson of catalogue) {
    if (area && lesson.area !== area) continue;
    let best = 0;
    for (const title of Object.values(lesson.titles)) {
      if (!title) continue;
      const nt = normalize(title);
      if (nt.length >= 6 && nq.includes(` ${nt} `)) best = Math.max(best, 2 + nt.length / 1000);
      const tt = tokens(title);
      if (tt.length >= 2) {
        const hit = tt.filter((t) => qt.has(t)).length / tt.length;
        if (hit >= 0.75) best = Math.max(best, hit);
      }
    }
    if (best > 0) out.push({ lesson, score: best });
  }
  return out.sort((a, b) => b.score - a.score);
}

/* ----------------------------- decision ----------------------------- */

export type Decision =
  | { kind: "clarify"; text: string; link: string; topic: TopicRef }
  | { kind: "private"; text: string; link: string; topic: TopicRef }
  | { kind: "facts"; facts: string[]; link: string; topic: TopicRef; draft: string };

const AREA_NAMES: Record<SupportLang, Record<SupportArea, string>> = {
  ar: { ai: "مسارات الذكاء الاصطناعي", academic: "الأكاديمي", technical: "التقني", kids: "كيدز للأطفال" },
  en: { ai: "AI paths", academic: "Academic", technical: "Technical", kids: "Kids" },
};

function lessonTitle(l: CatalogueLesson, lang: SupportLang) {
  return l.titles[lang] ?? l.titles.ar ?? l.titles.en ?? l.id;
}

function lessonFacts(l: CatalogueLesson, lang: SupportLang): string[] {
  const access =
    l.access === "free"
      ? lang === "ar" ? "الدرس ده من الدروس المجانية بعد تسجيل الدخول." : "This lesson is one of the free lessons (sign-in required)."
      : l.access === "plan"
        ? lang === "ar" ? "الدرس ده متاح ضمن الباقات المدفوعة أو الوصول المناسب." : "This lesson is available with a paid plan or the relevant access."
        : lang === "ar" ? "الوصول للدرس بيتحدد حسب حسابك وإتاحته." : "Access depends on your account and the lesson's availability.";
  return [
    lang === "ar" ? `اسم الدرس: ${lessonTitle(l, lang)}` : `Lesson: ${lessonTitle(l, lang)}`,
    `${lang === "ar" ? "مكانه في المنهج" : "Where it sits"}: ${l.excerpt[lang] ?? l.excerpt.ar ?? l.excerpt.en ?? ""}`,
    access,
  ];
}

export function decide(
  question: string,
  lang: SupportLang,
  prior: TopicRef | null,
  catalogue: CatalogueLesson[],
): Decision {
  const d = detect(question);
  const p = cleanTopic(prior);
  // Same-thread follow-ups inherit only missing slots; explicit words always win.
  const inherit = !!prior && (d.followup || (!d.area && !d.lessonWord && !d.programWord));
  const area = d.area ?? (inherit ? p.area : undefined);
  const market = d.market ?? (inherit ? p.market : undefined);
  const term = d.term ?? (inherit && d.pricing ? p.term : undefined);
  const plan = d.plan ?? (inherit && (d.pricing || p.subject === "pricing") ? p.plan : undefined);
  // A bare market/term ("and outside Egypt?", "yearly?") only ever refers to prices.
  const pricing =
    d.pricing ||
    ((!!d.market || !!d.term) && !d.lessonWord && !d.programWord) ||
    (inherit && p.subject === "pricing" && !!d.area);

  if (d.privateRequest) {
    const m = matchLessons(question, catalogue, area)[0]?.lesson;
    return {
      kind: "private",
      text:
        lang === "ar"
          ? "معلش، مش بنقدر نبعت محتوى الدروس أو الإجابات أو أي بيانات دخول هنا. المحتوى متاح جوه صفحة الدرس على المنصة حسب الوصول المتاح لحسابك."
          : "Sorry, we can't share lesson content, answers or any sign-in details here. The content is available on the lesson page, depending on your account's access.",
      link: m?.url ?? (area ? AREA_LINKS[area].program : url()),
      topic: { subject: "lesson", area: m?.area ?? area, lesson: m?.id },
    };
  }

  // Named lesson (explicit, or same-thread lesson follow-up).
  const matches = matchLessons(question, catalogue, area);
  if (matches.length || (d.lessonWord && !pricing)) {
    const top = matches[0];
    const tied = top ? matches.filter((m) => Math.abs(m.score - top.score) < 1e-6) : [];
    if (top && tied.length === 1) {
      const l = top.lesson;
      return {
        kind: "facts",
        facts: [...lessonFacts(l, lang), ...programFacts(l.area, lang).slice(0, 2)],
        link: l.url,
        topic: { subject: "lesson", area: l.area, program: l.program, lesson: l.id },
        draft: lessonFacts(l, lang).join(" "),
      };
    }
    const priorLesson = inherit && p.lesson ? catalogue.find((l) => l.id === p.lesson) : undefined;
    if (!top && priorLesson && d.lessonWord) {
      return {
        kind: "facts",
        facts: lessonFacts(priorLesson, lang),
        link: priorLesson.url,
        topic: { subject: "lesson", area: priorLesson.area, program: priorLesson.program, lesson: priorLesson.id },
        draft: lessonFacts(priorLesson, lang).join(" "),
      };
    }
    const options = tied.slice(0, 3).map((m) => `«${lessonTitle(m.lesson, lang)}»`);
    return {
      kind: "clarify",
      text: options.length
        ? lang === "ar"
          ? `تقصد أنهي درس بالظبط: ${options.join(" ولا ")}؟`
          : `Which lesson do you mean exactly: ${options.join(" or ")}?`
        : lang === "ar"
          ? "ممكن تقولي اسم الدرس بالظبط أو المنهج اللي هو فيه؟"
          : "Could you tell me the exact lesson name or which curriculum it's in?",
      link: area ? AREA_LINKS[area].program : url("/curriculum"),
      topic: { subject: "lesson", area },
    };
  }

  if (pricing) {
    const topic: TopicRef = { subject: "pricing", area, market, term, plan };
    if (!area || !market) {
      const parts: string[] = [];
      if (!area)
        parts.push(
          lang === "ar"
            ? "ده لأنهي برنامج: مسارات الذكاء الاصطناعي، الأكاديمي، التقني، ولا كيدز للأطفال"
            : "which program: AI paths, Academic, Technical or Kids",
        );
      if (!market) parts.push(lang === "ar" ? "وانت داخل مصر ولا براها" : "and are you in Egypt or outside Egypt");
      const text =
        lang === "ar"
          ? `أكيد! بس عشان أقولك السعر الصح: ${parts.join("، ")}؟`
          : `Sure! To give you the right price: ${parts.join(", ")}?`;
      return { kind: "clarify", text, link: area ? AREA_LINKS[area].pricing : url(), topic };
    }
    const f = pricingFacts(area, market, lang, { term, plan });
    return { kind: "facts", facts: f.lines, link: f.link, topic, draft: f.lines.join("\n") };
  }

  if (area) {
    const facts = programFacts(area, lang);
    return {
      kind: "facts",
      facts,
      link: AREA_LINKS[area].program,
      topic: { subject: "program", area },
      draft: facts.slice(0, 3).join(" "),
    };
  }

  if (d.programWord && !prior) {
    return {
      kind: "clarify",
      text:
        lang === "ar"
          ? `عندنا ${Object.values(AREA_NAMES.ar).join("، ")}. تحب تعرف عن أنهي واحد؟`
          : `We have ${Object.values(AREA_NAMES.en).join(", ")}. Which one would you like to know about?`,
      link: url("/curriculum"),
      topic: { subject: "program" },
    };
  }

  const facts = (["ai", "academic", "technical", "kids"] as const).map((a) => `${AREA_NAMES[lang][a]}: ${programFacts(a, lang)[1]}`);
  return { kind: "facts", facts, link: url(), topic: { subject: "general", ...(inherit ? p : {}) }, draft: "" };
}
