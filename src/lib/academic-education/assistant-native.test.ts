// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { canonicalJson, sha256, type ApprovedLesson } from "./assistant-corpus";
const state = vi.hoisted(() => ({ mode: "admin", enabled: true, quota: true,
  accessCalls: 0, revokeAfterFirst: false,
  source: null as ApprovedLesson | null,
  chunks: [] as {course_id:string;lesson_id:string;locale:string;section_id:string;content:string;similarity:number}[],
  quotaCall: vi.fn(), answer: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  from: (table: string) => {
    const builder = { select: () => builder, eq: () => builder, maybeSingle: async () => ({
      data: table === "academic_assistant_policy" ? { runtime_enabled: state.enabled } : state.source, error: null }) };
    return builder;
  },
  rpc: async () => ({ data: state.chunks, error: null }),
} }));
vi.mock("@/lib/ai-providers.server", () => ({ callAI: state.answer }));
import { runAcademicAssistant } from "./assistant.server";
const context = { userId: "verified-user", supabase: { rpc: async (name:string) => {
  if (name === "academic_assistant_access") {
    state.accessCalls++;
    return {data:state.revokeAfterFirst && state.accessCalls>1 ? "none" : state.mode,error:null};
  }
  state.quotaCall(); return {data:{allowed:state.quota},error:null};
} } };
const input = {courseId:"AC-BUS",lessonId:"AC-BUS-M01-L01",locale:"en" as const,
  query:"Explain cash flow",requestId:"a441f8ba-ccac-4c82-8f87-413e04b469ce"};
beforeEach(async () => {
  state.mode="admin";state.enabled=true;state.quota=true;state.accessCalls=0;state.revokeAfterFirst=false;
  state.quotaCall.mockReset();state.answer.mockReset().mockResolvedValue({content:"Course answer"});
  const payload = { id: "AC-BUS-M02-L03", locale: "en", version: "1", sections: [{ id: "concept-1", title: "Cash flow", text: "Cash flow is money in and out." }] };
  state.source = { course_id: "AC-BUS", lesson_id: payload.id, locale: "en", approved: true, payload, source_sha256: await sha256(canonicalJson(payload)) };
  state.chunks=[{course_id:"AC-BUS",lesson_id:"AC-BUS-M02-L03",locale:"en",section_id:"concept-1",content:"Cash flow\nCash flow is money in and out.",similarity:0.8}];
  vi.stubEnv("OPENAI_API_KEY","fixture-not-a-secret");
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({data:[{index:0,embedding:Array(1536).fill(0.1)}]}),{status:200})));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it("uses verified admin identity with the independent operational guard and can cite another same-card lesson",async()=>{
  const r=await runAcademicAssistant(input,context);
  expect(r.status).toBe(200);expect(r.sources?.[0].lessonId).toBe("AC-BUS-M02-L03");
  expect(state.quotaCall).toHaveBeenCalledOnce();expect(state.answer).toHaveBeenCalledOnce();
  expect(state.answer).toHaveBeenCalledWith(expect.objectContaining({model:"openai/gpt-4.1-mini-2025-04-14"}));
});
it("denies a learner without the course add-on before either provider",async()=>{
  state.mode="none";expect((await runAcademicAssistant(input,context)).status).toBe(403);
  expect(fetch).not.toHaveBeenCalled();expect(state.answer).not.toHaveBeenCalled();
});
it("takes learner quota before embedding and fails closed when exhausted",async()=>{
  state.mode="learner";state.quota=false;
  expect((await runAcademicAssistant(input,context)).status).toBe(429);
  expect(state.quotaCall).toHaveBeenCalledOnce();expect(fetch).not.toHaveBeenCalled();
});
it("never passes another course or locale to the answer provider",async()=>{
  state.chunks.push({...state.chunks[0],course_id:"AC-OTHER",lesson_id:"AC-OTHER-M01-L01",content:"PRIVATE_OTHER_COURSE"});
  state.chunks.push({...state.chunks[0],locale:"ar-EG",content:"OTHER_LOCALE"});
  const r=await runAcademicAssistant(input,context);expect(r.sources).toHaveLength(1);
  const prompt=JSON.stringify(state.answer.mock.calls);
  expect(prompt).not.toContain("PRIVATE_OTHER_COURSE");expect(prompt).not.toContain("OTHER_LOCALE");
});
it("rechecks access after retrieval and denies a revoked role before answer generation",async()=>{
  state.revokeAfterFirst=true;
  expect((await runAcademicAssistant(input,context)).status).toBe(422);
  expect(state.answer).not.toHaveBeenCalled();
});
it("keeps the runtime gate closed before provider calls",async()=>{
  state.enabled=false;expect((await runAcademicAssistant(input,context)).status).toBe(503);
  expect(fetch).not.toHaveBeenCalled();expect(state.answer).not.toHaveBeenCalled();
});
it.each([
  ["ar-EG", "Egyptian Arabic"],
  ["ar-MSA", "Modern Standard Arabic"],
  ["ar-Gulf", "Gulf Arabic"],
  ["en", "clear English"],
] as const)("sets an explicit answer register for %s",async(locale,register)=>{
  state.chunks[0].locale=locale;
  state.source!.locale=locale; state.source!.payload.locale=locale;
  state.source!.source_sha256=await sha256(canonicalJson(state.source!.payload));
  expect((await runAcademicAssistant({...input,locale},context)).status).toBe(200);
  expect(state.answer.mock.calls[0][0].messages[0].content).toContain(register);
});

it.each(["access", "runtime", "approval", "source"])("drops the generated answer when %s changes during generation", async kind => {
  state.answer.mockImplementationOnce(async () => {
    if (kind === "access") state.mode = "none";
    if (kind === "runtime") state.enabled = false;
    if (kind === "approval") state.source!.approved = false;
    if (kind === "source") {
      state.source!.payload.version = "2";
      state.source!.source_sha256 = await sha256(canonicalJson(state.source!.payload));
    }
    return { content: "MUST_NOT_ESCAPE" };
  });
  const result = await runAcademicAssistant(input, context);
  expect(result.status).toBe(kind === "access" ? 403 : 422);
  expect(result.answer).toBeUndefined();
  expect(result.sources).toBeUndefined();
});

it("blocks an administrator at the operational ceiling before paid provider work", async () => {
  state.quota = false;
  expect((await runAcademicAssistant(input, context)).status).toBe(429);
  expect(fetch).not.toHaveBeenCalled(); expect(state.answer).not.toHaveBeenCalled();
});
