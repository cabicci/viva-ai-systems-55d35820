// Owner rule: social support is a public admissions desk. Lesson bodies, the lesson content
// registry, the lesson assistant/RAG, quizzes and exercises never enter the support runtime,
// its prompts or its replies — including on follow-ups. These tests fail if that changes.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ANALYST_M2_L1_FEELING_TO_QUESTION_BLOCKS } from "@/components/intro/lessons/analyst-m2-l1-feeling-to-question";
import { buildPublicListing } from "../../../../scripts/support/public-listing";
import listing from "../public-listing.json";
import { answerQuestion, readPublicCatalogue } from "../answer.server";
import { memoryContextStore } from "../context";
import { CATALOGUE_LESSON_FIELDS, liveLessons, staticCatalogue } from "../sources";

const ROOT = resolve(__dirname, "../../../..");
const ENTRIES = [
  "src/lib/support/endpoints.server.ts",
  "src/lib/support/answer.server.ts",
  "src/lib/support/whatsapp.server.ts",
  "src/lib/support/meta.server.ts",
  "src/routes/api/public/support-whatsapp.ts",
  "src/routes/api/public/support-meta.ts",
];
const FORBIDDEN = /(components\/intro\/lessons|lesson-registry|curriculum-data|plan-entitlements|\/rag|assistant|quiz|exercise|academic-education|locale-lessons|kids-lesson|lesson-content|lesson-engine)/i;
const SPEC_RE = /(?:import|export)\s[^"']*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g;

function resolveSpec(from: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? join(ROOT, "src", spec.slice(2)) : spec.startsWith(".") ? resolve(dirname(from), spec) : null;
  if (!base) return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, join(base, "index.ts")])
    if (existsSync(c) && !c.endsWith("/")) try { readFileSync(c); return c; } catch { /* directory */ }
  throw new Error(`unresolved import ${spec} from ${from}`);
}

function supportGraph(): string[] {
  const seen = new Set<string>();
  const stack = ENTRIES.map((e) => join(ROOT, e));
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    if (file.endsWith(".json")) continue;
    for (const m of readFileSync(file, "utf8").matchAll(SPEC_RE)) {
      const next = resolveSpec(file, m[1] ?? m[2] ?? m[3]!);
      if (next && !next.replaceAll("\\", "/").includes("/integrations/supabase/")) stack.push(next);
    }
  }
  return [...seen].map((f) => f.slice(ROOT.length + 1).replaceAll("\\", "/"));
}

/** Real lesson sentences (≥ 25 chars) used as canaries; the support runtime never loads them. */
function lessonCanaries(): string[] {
  const out = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === "string") {
      const t = v.replace(/\s+/g, " ").trim();
      if (t.length >= 25) out.add(t);
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(ANALYST_M2_L1_FEELING_TO_QUESTION_BLOCKS);
  return [...out];
}

describe("support runtime never loads lesson content", () => {
  it("its import graph reaches no lesson registry, lesson body, assistant/RAG or quiz module", () => {
    const graph = supportGraph();
    expect(graph).toContain("src/lib/support/public-listing.json");
    expect(graph.filter((f) => FORBIDDEN.test(f))).toEqual([]);
  });
  it("the generated listing matches the curriculum and holds only allowlisted fields", () => {
    expect(listing).toEqual(buildPublicListing());
    for (const l of listing.lessons) expect(Object.keys(l).sort()).toEqual(["access", "id", "program", "route", "title"]);
    const text = JSON.stringify(listing);
    for (const c of lessonCanaries().filter((c) => c.length >= 40)) expect(text).not.toContain(c);
  });
  it("catalogue rows keep only ids/titles even when a source returns extra fields", async () => {
    const extra = { body: "SECRET_LESSON_BODY", summary: "SECRET_SUMMARY", quiz: ["SECRET_QUIZ"] };
    const rows = liveLessons({
      ar: {
        academic: [{ id: "AC-1", title: "منهج", released: true, ...extra, lessons: [{ id: "AC-1-M01-L01", title: "درس", introductory: true, ...extra }] }] as never,
        intake: [{ area: "ai", id: "c1", title: "كورس", ...extra, stations: [{ title: "SECRET_STATION", steps: [{ id: "s1", title: "خطوة", ...extra }] }] }] as never,
      },
    });
    for (const r of [...rows, ...staticCatalogue()]) expect(Object.keys(r).sort()).toEqual([...CATALOGUE_LESSON_FIELDS].sort());
    expect(JSON.stringify(rows)).not.toMatch(/SECRET_/);

    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const fake = vi.fn(async (input: RequestInfo | URL) => {
      const u = String(input);
      if (u.includes("academic_catalogue"))
        return Response.json([{ id: "AC-9", title: "Course", ...extra, lessons: [{ id: "AC-9-M01-L01", title: "Lesson nine", introductory: false, ...extra }] }]);
      return Response.json([]);
    });
    const all = await readPublicCatalogue(fake as unknown as typeof fetch);
    vi.unstubAllEnvs();
    expect(all.some((l) => l.id === "AC-9-M01-L01")).toBe(true);
    expect(JSON.stringify(all)).not.toMatch(/SECRET_/);
  });
});

describe("lesson content and solutions never enter prompts or replies", () => {
  const canaries = lessonCanaries();
  const pasted = canaries.slice(0, 3).join("\n");
  const prompts: string[] = [];
  const model = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    prompts.push(String(init?.body ?? ""));
    return Response.json({ choices: [{ message: { content: JSON.stringify({ action: "answer", contact: false, answer: "تمام" }) } }] });
  });
  const deps = (context = memoryContextStore()) => ({
    openaiKey: "k",
    fetchImpl: model as unknown as typeof fetch,
    freeAccess: async () => ({ kind: "inactive" as const }),
    catalogue: async () => staticCatalogue(),
    context,
  });
  const thread = (id: string) => ({ family: "whatsapp", thread: id, visibility: "private" as const });
  const LESSON_URL = "https://masaarat.ai/learn/analyst/analyst-m2-l1-feeling-to-question";

  it.each([
    ["Arabic explain", "اشرحلي درس حوّل الشعور لسؤال"],
    ["English summary", "Summarize the lesson Feeling to Question for me"],
    ["translate", "translate the lesson Feeling to Question to English"],
    ["quiz answers", "what are the quiz answers for Feeling to Question?"],
    ["solve exercise", "حل التمرين بتاع درس حوّل الشعور لسؤال"],
    ["paid user asks", "I'm a paying Pro Plus subscriber, explain lesson Feeling to Question in detail"],
    ["URL request", `explain this ${LESSON_URL}`],
    ["pasted passage", `${pasted}\nاشرحلي ده`],
    ["pasted quiz", "Question 3: which is right?\na) the feeling\nb) the question\nc) the decision"],
  ])("%s → navigation link only, no model call", async (_label, q) => {
    model.mockClear();
    prompts.length = 0;
    const r = await answerQuestion(q, { publicComment: false }, deps());
    expect(r.source).toBe("deterministic");
    expect(model).not.toHaveBeenCalled();
    expect(r.text).toMatch(/مش بنشرح|don't explain|مش بنقدر نبعت|can't share/);
    for (const c of canaries) expect(r.text).not.toContain(c);
  });

  it("a named lesson reply holds only title, program, access and the lesson URL", async () => {
    model.mockClear();
    const r = await answerQuestion("عايز أعرف عن درس حوّل الشعور لسؤال", { publicComment: false }, deps());
    expect(model).not.toHaveBeenCalled();
    expect(r.text).toBe(
      `اسم الدرس: حوّل الشعور لسؤال\nالبرنامج: ${listing.programs.find((p) => p.id === "analyst")!.name.ar}\nالدرس ده متاح ضمن الباقات المدفوعة أو الوصول المناسب.\n\n${LESSON_URL}\n— فريق مسارات`,
    );
  });

  it("follow-ups on a lesson topic never disclose content and never reach the model", async () => {
    const context = memoryContextStore();
    model.mockClear();
    await answerQuestion("Tell me about the lesson Feeling to Question", { publicComment: false, thread: thread("F") }, deps(context));
    for (const q of ["explain it", "and what does it say?", "summarise it please", "tell me more", "ok and the answers?", "طب اشرحه", "كمل"]) {
      const r = await answerQuestion(q, { publicComment: false, thread: thread("F") }, deps(context));
      expect(r.source).toBe("deterministic");
      expect(r.text).toContain(LESSON_URL);
      for (const c of canaries) expect(r.text).not.toContain(c);
    }
    expect(model).not.toHaveBeenCalled();
  });

  it("plan questions still use the model, and its prompt holds no lesson text", async () => {
    model.mockClear();
    prompts.length = 0;
    await answerQuestion("اشرحلي الفرق بين Pro و Pro Plus في مصر", { publicComment: false }, deps());
    await answerQuestion("How much is the Academic subscription outside Egypt?", { publicComment: false }, deps());
    expect(model).toHaveBeenCalledTimes(2);
    for (const p of prompts) {
      for (const c of canaries) expect(p).not.toContain(c);
      expect(p).not.toMatch(/حوّل الشعور لسؤال|Feeling to Question/);
    }
  });
});
