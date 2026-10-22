import { handleAcademicAssistant, type Locale, type Chunk, type AcademicHistoryTurn } from "../../../supabase/functions/academic-assistant/handler";
import { ACADEMIC_EMBEDDING_DIMENSIONS, ACADEMIC_EMBEDDING_MODEL, approvedChunks,
  planAcademicChunkUpdates, validateAcademicCorpus, type ApprovedLesson, type IndexedAcademicChunk } from "./assistant-corpus";
import { callAI } from "@/lib/ai-providers.server";

type RpcClient = { rpc(name: never, body: never): PromiseLike<{ data: unknown; error: unknown }> };
type Context = { userId: string; supabase: RpcClient };
async function rpc<T>(client: RpcClient, name: string, body: Record<string, unknown>): Promise<T> {
  const result = await client.rpc(name as never, body as never);
  if (result.error) throw new Error("ACADEMIC_SERVICE_UNAVAILABLE");
  return result.data as T;
}
async function embeddings(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("ACADEMIC_EMBEDDING_UNAVAILABLE");
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: ACADEMIC_EMBEDDING_MODEL, input: texts }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error("ACADEMIC_EMBEDDING_UNAVAILABLE"); }
  const result = await response.json() as { data?: { index: number; embedding: number[] }[] };
  const rows = result.data?.slice().sort((a, b) => a.index - b.index);
  if (!rows || rows.length !== texts.length || rows.some((x, i) => x.index !== i ||
    x.embedding.length !== ACADEMIC_EMBEDDING_DIMENSIONS || x.embedding.some(n => !Number.isFinite(n))))
    throw new Error("ACADEMIC_EMBEDDING_UNAVAILABLE");
  return rows.map(x => x.embedding);
}
export async function runAcademicAssistant(data: {courseId:string; lessonId:string; locale:Locale; query:string; requestId:string;history?:AcademicHistoryTurn[]}, context: Context) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const setting = await supabaseAdmin.from("academic_assistant_policy" as never)
    .select("runtime_enabled").eq("course_id", data.courseId).maybeSingle();
  const enabled = !setting.error && (setting.data as {runtime_enabled?:boolean}|null)?.runtime_enabled === true;
  const access = () => rpc<"admin"|"learner"|"none">(context.supabase, "academic_assistant_access", {
    p_course:data.courseId, p_lesson:data.lessonId, p_locale:data.locale,
  });
  const sourceSnapshots = new Map<string, string>();
  const verifySources = async (chunks: Chunk[]): Promise<boolean> => {
    const policy = await supabaseAdmin.from("academic_assistant_policy" as never)
      .select("runtime_enabled").eq("course_id", data.courseId).maybeSingle();
    if (policy.error || (policy.data as {runtime_enabled?:boolean}|null)?.runtime_enabled !== true) return false;
    for (const id of [...new Set(chunks.map(chunk => chunk.lesson_id))]) {
      const allowed = await rpc<string>(context.supabase, "academic_assistant_access", {
        p_course: data.courseId, p_lesson: id, p_locale: data.locale });
      if (allowed !== "admin" && allowed !== "learner") return false;
      const source = await supabaseAdmin.from("academic_lesson_content" as never)
        .select("course_id,lesson_id,locale,approved,source_sha256,payload")
        .eq("course_id", data.courseId).eq("lesson_id", id).eq("locale", data.locale).maybeSingle();
      if (source.error || !source.data) return false;
      const row = source.data as unknown as ApprovedLesson;
      if (row.course_id !== data.courseId || row.lesson_id !== id || row.locale !== data.locale || !row.approved) return false;
      const previous = sourceSnapshots.get(id);
      if (previous !== undefined && previous !== row.source_sha256) return false;
      const current = await approvedChunks(row);
      if (chunks.filter(chunk => chunk.lesson_id === id).some(chunk => !current.some(section =>
        section.section_id === chunk.section_id && section.content === chunk.content))) return false;
      sourceSnapshots.set(id, row.source_sha256);
    }
    return true;
  };
  const result = await handleAcademicAssistant(new Request("https://internal.invalid/academic-assistant", {
    method:"POST", headers:{Authorization:"Bearer verified-by-middleware"},
    body:JSON.stringify({courseId:data.courseId,lessonId:data.lessonId,locale:data.locale,query:data.query,history:data.history}),
  }), {
    enabled,
    verifyUser: async () => context.userId,
    allowed: async () => { const mode = await access(); return mode === "none" ? null : mode; },
    consumeLimit: async () => (await rpc<{allowed:boolean}>(context.supabase,"academic_assistant_take_question",{
      p_course:data.courseId,p_lesson:data.lessonId,p_locale:data.locale,p_request:data.requestId,
    })).allowed === true,
    embed: async query => (await embeddings([query]))[0],
    retrieve: async (course,locale,embedding) => rpc<Chunk[]>(supabaseAdmin,"academic_rag_match",{
      p_course:course,p_locale:locale,p_embedding:JSON.stringify(embedding),p_limit:6,
    }),
    verifySources,
    answer: async (system,user) => {
      const mode = await access();
      if (mode !== "admin" && mode !== "learner") throw new Error("ACADEMIC_ACCESS_REVOKED");
      return (await callAI({model:"openai/gpt-4.1-mini-2025-04-14",temperature:0.2,maxTokens:1800,
        messages:[{role:"system",content:system},{role:"user",content:user}]})).content;
    },
  });
  return {status:result.status,...await result.json()} as {status:number;answer?:string;sources?:{lessonId:string;sectionId:string;label?:string}[];error?:string};
}
async function requireAdmin(context: Context, courseId: string) {
  const allowed = await rpc<boolean>(context.supabase,"academic_review_allowed",{p_course:courseId});
  if (allowed !== true) throw new Error("ACADEMIC_ADMIN_REQUIRED");
}
export async function indexAcademicBatch(data:{courseId:string;offset:number;batchSize:number},context:Context) {
  return indexAcademicBatchWithAuthority(data, { check: () => requireAdmin(context, data.courseId) });
}
/** Same source validation/reuse/write path for administrator and automatic work. */
export async function indexAcademicBatchWithAuthority(data:{courseId:string;offset:number;batchSize:number},authority:{
  check:()=>Promise<void>;beforeEmbedding?:()=>Promise<void>;
  sources?:{stepId:string;locale:string;sourceSha:string}[];
}) {
  await authority.check();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.from("academic_lesson_content" as never)
    .select("course_id,lesson_id,locale,approved,source_sha256,payload")
    .eq("course_id",data.courseId).order("locale").order("lesson_id");
  if (result.error || !Array.isArray(result.data) || result.data.length === 0)
    throw new Error("ACADEMIC_SOURCE_UNAVAILABLE");
  const lessons = result.data as unknown as ApprovedLesson[];
  if (lessons.some(row => row.course_id !== data.courseId)) throw new Error("ACADEMIC_SOURCE_MISMATCH");
  // Registration completeness and approval are separate: a revoked locale must
  // still reach the atomic empty-scope cleanup below.
  validateAcademicCorpus(lessons, data.courseId, false);
  const groups = await Promise.all(lessons.map(row => row.approved ? approvedChunks(row) : []));
  const batchLessons = lessons.slice(data.offset,data.offset+data.batchSize);
  if(authority.sources && batchLessons.some(row=>!row.approved || !authority.sources!.some(expected=>
    expected.stepId===row.lesson_id && expected.locale===row.locale && expected.sourceSha===row.source_sha256)))
    throw new Error("AUTOMATION_SOURCE_CHANGED");
  const batch = groups.slice(data.offset,data.offset+data.batchSize).flat();
  if (batch.length > 80) throw new Error("ACADEMIC_BATCH_TOO_LARGE");
  const existing = await supabaseAdmin.from("academic_rag_chunks" as never)
    .select("course_id,lesson_id,locale,section_id,content_version,source_sha256,content_sha256,content,embedding,embedding_model,embedding_dimensions")
    .eq("course_id",data.courseId)
    .in("lesson_id", [...new Set(batchLessons.map(row => row.lesson_id))])
    .in("locale", [...new Set(batchLessons.map(row => row.locale))]);
  if (existing.error || !Array.isArray(existing.data)) throw new Error("ACADEMIC_INDEX_UNAVAILABLE");
  const plan = planAcademicChunkUpdates(batch, existing.data as unknown as IndexedAcademicChunk[]);
  const fresh = plan.pending.filter(item => item.embedding === null);
  if(fresh.length) await authority.beforeEmbedding?.();
  const vectors = fresh.length ? await embeddings(fresh.map(item => item.chunk.content)) : [];
  let nextVector = 0;
  const rows = plan.pending.map(item => ({ ...item.chunk,
    embedding: JSON.stringify(item.embedding ?? vectors[nextVector++]),
    embedding_model: ACADEMIC_EMBEDDING_MODEL, embedding_dimensions: ACADEMIC_EMBEDDING_DIMENSIONS,
  }));
  if (batchLessons.length) {
    await authority.check();
    // One transaction verifies the new complete scopes, then removes obsolete rows.
    await rpc<number>(supabaseAdmin,"academic_sync_chunks",{p_course:data.courseId,
      p_scopes:batchLessons.map(row => ({ lesson_id:row.lesson_id, locale:row.locale,
        source_sha256:row.source_sha256, approved:row.approved })), p_rows:rows});
  }
  return {courseId:data.courseId,verifiedLessons:lessons.length,expectedChunks:groups.flat().length,
    proofs:batchLessons.map(row=>({stepId:row.lesson_id,locale:row.locale,sourceSha:row.source_sha256,
      chunks:batch.filter(chunk=>chunk.lesson_id===row.lesson_id && chunk.locale===row.locale).map(chunk=>({
        id:chunk.section_id,contentSha:chunk.content_sha256,version:chunk.content_version}))})),
    inserted:plan.pending.length,embedded:fresh.length,reused:plan.pending.length-fresh.length,skipped:plan.skipped,
    nextOffset:data.offset+data.batchSize<lessons.length?data.offset+data.batchSize:null};
}
