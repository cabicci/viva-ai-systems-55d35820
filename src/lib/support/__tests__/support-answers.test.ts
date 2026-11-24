// Regression examples for the support reply policy. All outputs here are deterministic
// (no network, no OpenAI); a fake model is used only where model-output filtering is tested.
import { afterEach, describe, expect, it, vi } from "vitest";
import { answerQuestion, readFreeAccessState } from "../answer.server";
import { countOfficialLinks, fallbackReply, sanitizeAnswer } from "../compose";
import { memoryContextStore } from "../context";
import { decide, detect } from "../resolve";
import { liveLessons, staticCatalogue } from "../sources";

const inactive = async () => ({ kind: "inactive" as const });
const active = async () => ({ kind: "active" as const, endsAt: "2026-12-01T00:00:00Z" });
const catalogue = async () => staticCatalogue();
const base = { freeAccess: inactive, catalogue, openaiKey: "" };
const ask = (q: string, extra: Partial<Parameters<typeof answerQuestion>[2]> = {}, thread?: Parameters<typeof answerQuestion>[1]["thread"]) =>
  answerQuestion(q, { publicComment: false, thread }, { ...base, ...extra });

function onlyLink(text: string | null): string {
  expect(text).not.toBeNull();
  expect(countOfficialLinks(text!)).toBe(1);
  return text!.match(/https:\/\/masaarat\.ai[^\s]*/)![0];
}

afterEach(() => vi.unstubAllEnvs());

describe("domestic vs international prices (from the displayed catalogues)", () => {
  it("Academic in Egypt: 309 / 3090 EGP, tax-exclusive, academic pricing link", async () => {
    const r = await ask("سعر الاشتراك الأكاديمي في مصر كام؟");
    expect(r.text).toContain("309 جنيه في الشهر");
    expect(r.text).toContain("3090 جنيه في السنة");
    expect(r.text).toContain("الأسعار قبل الضرائب.");
    expect(r.text).not.toMatch(/دولار|\$/);
    expect(onlyLink(r.text)).toBe("https://masaarat.ai/academic/pricing");
  });
  it("Academic outside Egypt: $12.99 / $129.90, English reply", async () => {
    const r = await ask("How much is the Academic subscription outside Egypt?");
    expect(r.text).toContain("$12.99 per month");
    expect(r.text).toContain("$129.90 per year");
    expect(r.text).toContain("Prices exclude tax.");
    expect(r.text).not.toMatch(/EGP|[\u0600-\u06FF]{3}/);
  });
  it("AI Pro in Egypt is 169 EGP monthly; Pro Plus abroad is $12.99", async () => {
    expect((await ask("Pro monthly price in Egypt?")).text).toContain("Pro: 169 EGP per month.");
    expect((await ask("Pro Plus price in dollars?")).text).toContain("Pro Plus: $12.99 per month or $129.90 per year.");
  });
  it("Kids abroad: $7.99 base and $7.19 with an active adult plan", async () => {
    const r = await ask("How much is Kids for my son? We live in Saudi");
    expect(r.text).toContain("$7.99 per month");
    expect(r.text).toContain("$7.19 per month");
    expect(onlyLink(r.text)).toBe("https://masaarat.ai/kids/pricing");
  });
});

describe("unknown market and program", () => {
  it("asks one brief clarifier for both and states no price", async () => {
    const r = await ask("الاشتراك بكام؟");
    expect(r.source).toBe("deterministic");
    expect(r.text).toMatch(/مسارات الذكاء الاصطناعي، الأكاديمي، التقني، ولا كيدز/);
    expect(r.text).toMatch(/داخل مصر ولا براها/);
    expect(r.text).not.toMatch(/\d+ جنيه|\$\d/);
    onlyLink(r.text);
  });
  it("asks only for the market when the program is known", async () => {
    const r = await ask("How much is Pro Plus?");
    expect(r.text).toBe("Sure! To give you the right price: and are you in Egypt or outside Egypt?\n\nhttps://masaarat.ai/pricing\n— Masaarat Team");
  });
});

describe("named lesson from the allowlisted public listing", () => {
  it("resolves «حوّل الشعور لسؤال» to its Analyst lesson title, program name and URL only", () => {
    const d = decide("عايز أعرف عن درس حوّل الشعور لسؤال", "ar", null, staticCatalogue());
    expect(d.kind).toBe("facts");
    if (d.kind !== "facts") return;
    expect(d.link).toBe("https://masaarat.ai/learn/analyst/analyst-m2-l1-feeling-to-question");
    expect(d.facts[0]).toBe("اسم الدرس: حوّل الشعور لسؤال");
    expect(d.facts[1]).toMatch(/^البرنامج: /);
    expect(d.facts).toHaveLength(3);
    expect(d.model).toBe(false);
    expect(d.facts).toContain("الدرس ده متاح ضمن الباقات المدفوعة أو الوصول المناسب.");
    expect(d.topic).toMatchObject({ subject: "lesson", lesson: "analyst-m2-l1-feeling-to-question" });
  });
  it("English title resolves the same lesson", () => {
    const d = decide("Tell me about the lesson Feeling to Question", "en", null, staticCatalogue());
    expect(d.kind === "facts" && d.link).toBe("https://masaarat.ai/learn/analyst/analyst-m2-l1-feeling-to-question");
  });
  it("an unknown lesson name gets a short clarifier", () => {
    const d = decide("فين درس الطيران الشراعي؟", "ar", null, staticCatalogue());
    expect(d.kind).toBe("clarify");
  });
});

describe("same-thread follow-up and other-thread isolation", () => {
  const wa = (thread: string) => ({ family: "whatsapp", thread, visibility: "private" as const });
  it("a follow-up inherits program in the same thread only", async () => {
    const context = memoryContextStore();
    await ask("How much is the Academic subscription in Egypt?", { context }, wa("A"));
    const same = await ask("and outside Egypt?", { context }, wa("A"));
    expect(same.text).toContain("Academic subscription: $12.99 per month or $129.90 per year.");
    const other = await ask("and outside Egypt?", { context }, wa("B"));
    expect(other.text).not.toMatch(/\$12\.99/);
    expect(other.text).toMatch(/which program/);
  });
  it("DM context never reaches the same person's public comment thread", async () => {
    const context = memoryContextStore();
    await ask("Kids price in Egypt?", { context }, { family: "messenger", thread: "h1", visibility: "private" });
    const pub = await answerQuestion("and yearly?", { publicComment: true, thread: { family: "messenger", thread: "post1:h1", visibility: "public" } }, { ...base, context });
    expect(pub.text).not.toMatch(/1990|199 /);
    expect(pub.text).toMatch(/which program/);
  });
  it("context stores opaque ids only, never message text", async () => {
    const context = memoryContextStore();
    const spy = vi.spyOn(context, "set");
    await ask("سعر Pro في مصر؟ اسمي أحمد", { context }, wa("C"));
    const saved = JSON.stringify(spy.mock.calls[0]![1]);
    expect(saved).not.toMatch(/أحمد|سعر/);
    expect(JSON.parse(saved)).toEqual({ subject: "pricing", area: "ai", market: "domestic", plan: "pro" });
  });
});

describe("excluded / private content", () => {
  it("refuses to send lesson bodies or answers and links the lesson page", async () => {
    const r = await ask("ابعتلي الدرس كامل PDF بتاع حوّل الشعور لسؤال");
    expect(r.text).toMatch(/مش بنقدر نبعت محتوى الدروس/);
    expect(onlyLink(r.text)).toBe("https://masaarat.ai/learn/analyst/analyst-m2-l1-feeling-to-question");
  });
  it("drops unreleased, review-only and malformed catalogue rows", () => {
    const rows = liveLessons({
      ar: {
        academic: [
          { id: "AC-OK", title: "منهج", released: true, lessons: [{ id: "AC-OK-M01-L01", title: "درس منشور", introductory: true }] },
          { id: "AC-HIDDEN", title: "مخفي", released: false, lessons: [{ id: "AC-HIDDEN-M01-L01", title: "درس مخفي", introductory: false }] },
          { id: "AC-REVIEW", title: "مراجعة", released: true, reviewOnly: true, lessons: [{ id: "AC-REVIEW-M01-L01", title: "درس مراجعة", introductory: false }] },
        ],
        kids: [{ levelId: "level-1", lessonNumber: 13, title: "خارج النطاق" }, { levelId: "level-9", lessonNumber: 1, title: "مستوى وهمي" }],
      },
    });
    expect(rows.map((r) => r.id)).toEqual(["AC-OK-M01-L01"]);
  });
  it("rejects a model answer that invents a price and uses the verified facts instead", async () => {
    const fake = vi.fn(async () => Response.json({ choices: [{ message: { content: JSON.stringify({ action: "answer", contact: false, answer: "Pro بـ 99 جنيه بس!" }) } }] }));
    const r = await ask("سعر Pro في مصر؟", { openaiKey: "k", fetchImpl: fake as unknown as typeof fetch });
    expect(r.source).toBe("fallback");
    expect(r.text).not.toContain("99 جنيه بس");
    expect(r.text).toContain("Pro: 169 جنيه في الشهر أو 1690 جنيه في السنة.");
  });
  it("never outputs Hebrew; a Hebrew message is answered in English", async () => {
    expect(sanitizeAnswer("שלום, המחיר הוא", "https://masaarat.ai/pricing", "en")).toBeNull();
    const r = await ask("כמה עולה מנוי Pro במצרים? Egypt");
    expect(r.text).not.toMatch(/[\u0590-\u05FF]/);
    expect(r.text).toContain("Pro: 169 EGP per month");
  });
  it("removes human hand-off promises from model output", () => {
    expect(sanitizeAnswer("هنحوّل محادثتك لموظف وهيرد عليك", "https://masaarat.ai/contact", "ar")).toBeNull();
    expect(sanitizeAnswer("Our agent will call you shortly.", "https://masaarat.ai/contact", "en")).toBeNull();
  });
});

describe("free-access offer", () => {
  const rpc = (body: unknown) => vi.fn(async () => Response.json(body)) as unknown as typeof fetch;
  it("an expired window reads as inactive and is never mentioned", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const state = await readFreeAccessState(rpc({ id: "x", ends_at: "2026-11-01T00:00:00Z", server_time: "2026-11-18T00:00:00Z" }));
    expect(state).toEqual({ kind: "inactive" });
    const r = await ask("سعر Pro في مصر؟", { freeAccess: async () => state });
    expect(r.text).not.toMatch(/مجان|لفترة محدودة/);
  });
  it("an active window is mentioned with its end date, also in the fallback, with one link", async () => {
    const r = await ask("سعر Pro في مصر؟", { freeAccess: active });
    expect(r.text).toMatch(/مجاناً لفترة محدودة لحد/);
    onlyLink(r.text);
    const fb = fallbackReply("en", { kind: "active", endsAt: "2026-12-01T00:00:00Z" });
    expect(fb).toMatch(/free for a limited time until 1 December 2026/);
    expect(onlyLink(fb)).toBe("https://masaarat.ai");
  });
});

describe("detection", () => {
  it("international wins over the word مصر in «برا مصر»", () => {
    expect(detect("انا برا مصر").market).toBe("international");
    expect(detect("انا في مصر").market).toBe("domestic");
  });
  it("only monthly and yearly terms are offered", async () => {
    const r = await ask("Academic quarterly price in Egypt?");
    expect(r.text).toContain("Displayed subscriptions are monthly or yearly only.");
  });
});

describe("ages are not billing terms", () => {
  it("«my 11 year old» means Kids program info, not a yearly price", () => {
    const d = detect("what can my 11 year old learn on Masaarat?");
    expect(d.area).toBe("kids");
    expect(d.term).toBeUndefined();
    expect(decide("what can my 11 year old learn on Masaarat?", "en", null, staticCatalogue()).kind).toBe("facts");
  });
});

describe("price answers keep the tax wording", () => {
  it("appends «Prices exclude tax.» when the model omitted it", async () => {
    const fake = vi.fn(async () => Response.json({ choices: [{ message: { content: JSON.stringify({ action: "answer", contact: false, answer: "Pro is 169 EGP per month or 1690 EGP per year." }) } }] }));
    const r = await ask("Pro price in Egypt?", { openaiKey: "k", fetchImpl: fake as unknown as typeof fetch });
    expect(r.source).toBe("openai");
    expect(r.text).toContain("Prices exclude tax.");
  });
});

describe("technical path names and official page (live Instagram regression)", () => {
  const ig = (thread: string) => ({ family: "instagram", thread, visibility: "public" as const });
  const pub = (q: string, context: ReturnType<typeof memoryContextStore>, thread: string) =>
    answerQuestion(q, { publicComment: true, thread: ig(thread) }, { ...base, context });
  it("«المسار الفني بيبدأ بأي مجال، وإيه لينك صفحته الرسمية؟» names carpentry and links /technical", async () => {
    const r = await pub("المسار الفني بيبدأ بأي مجال، وإيه لينك صفحته الرسمية؟", memoryContextStore(), "reel:a1");
    expect(r.text).toContain("النجارة وصناعة الأثاث");
    expect(r.text).not.toMatch(/تحب تعرف عن أنهي واحد/);
    expect(onlyLink(r.text)).toBe("https://masaarat.ai/technical");
  });
  it.each(["إيه هو التعليم الفني عندكم؟", "عايز أعرف عن الفني", "مسار فني"])("«%s» resolves to the technical path", (q) => {
    expect(detect(q).area).toBe("technical");
  });
  it("same-author follow-up keeps the technical path in that public thread only", async () => {
    const context = memoryContextStore();
    await pub("المسار الفني بيبدأ بأي مجال، وإيه لينك صفحته الرسمية؟", context, "reel:a1");
    const same = await pub("طب بكام في مصر؟", context, "reel:a1");
    expect(same.text).toContain("اشتراك تقني");
    expect(onlyLink(same.text)).toBe("https://masaarat.ai/technical/pricing");
    const other = await pub("طب بكام في مصر؟", context, "reel:b2");
    expect(other.text).not.toContain("اشتراك تقني");
  });
  it("a parent asking (ولي الأمر) is answered about Kids with /kids", async () => {
    const r = await ask("أنا ولي الأمر، إيه المسار المناسب؟");
    expect(r.text).toContain("الذكاء الاصطناعي");
    expect(onlyLink(r.text)).toBe("https://masaarat.ai/kids");
  });
  it("technical words don't hijack unrelated questions", () => {
    expect(detect("الدعم الفني مش بيرد").area).toBeUndefined();
    expect(detect("فنيات التصوير").area).toBeUndefined();
  });
  it("a model «skip» on a resolved program question still answers from public facts", async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ action: "skip", contact: false, answer: "" }) } }] }))) as unknown as typeof fetch;
    const r = await answerQuestion("المسار الفني بيبدأ بأي مجال، وإيه لينك صفحته الرسمية؟", { publicComment: true }, { ...base, openaiKey: "k", fetchImpl });
    expect(r.source).toBe("deterministic");
    expect(r.text).toContain("النجارة وصناعة الأثاث");
    expect(r.text).toContain("— فريق مسارات");
    expect(onlyLink(r.text)).toBe("https://masaarat.ai/technical");
  });
  it("a model «skip» on an unrelated public comment stays silent", async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ action: "skip", contact: false, answer: "" }) } }] }))) as unknown as typeof fetch;
    const r = await answerQuestion("مين هيكسب الماتش النهارده؟", { publicComment: true }, { ...base, openaiKey: "k", fetchImpl });
    expect(r.text).toBeNull();
  });
});
