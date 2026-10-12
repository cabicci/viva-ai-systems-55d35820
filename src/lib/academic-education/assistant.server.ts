import { handleAcademicAssistant, type Locale, type Chunk } from "../../../supabase/functions/academic-assistant/handler";
import { approvedChunks, type ApprovedLesson } from "./assistant-corpus";
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
    body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error("ACADEMIC_EMBEDDING_UNAVAILABLE"); }
  const result = await response.json() as { data?: { index: number; embedding: number[] }[] };
  const rows = result.data?.slice().sort((a, b) => a.index - b.index);
  if (!rows || rows.length !== texts.length || rows.some((x, i) => x.index !== i ||
    x.embedding.length !== 1536 || x.embedding.some(n => !Number.isFinite(n))))
    throw new Error("ACADEMIC_EMBEDDING_UNAVAILABLE");
  return rows.map(x => x.embedding);
}
export async function runAcademicAssistant(data: {courseId:string; lessonId:string; locale:Locale; query:string; requestId:string}, context: Context) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const setting = await supabaseAdmin.from("academic_assistant_policy" as never)
    .select("runtime_enabled").eq("course_id", data.courseId).maybeSingle();
  const enabled = !setting.error && (setting.data as {runtime_enabled?:boolean}|null)?.runtime_enabled === true;
  const access = () => rpc<"admin"|"learner"|"none">(context.supabase, "academic_assistant_access", {
    p_course:data.courseId, p_lesson:data.lessonId, p_locale:data.locale,
  });
  const result = await handleAcademicAssistant(new Request("https://internal.invalid/academic-assistant", {
    method:"POST", headers:{Authorization:"Bearer verified-by-middleware"},
    body:JSON.stringify({courseId:data.courseId,lessonId:data.lessonId,locale:data.locale,query:data.query}),
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
    answer: async (system,user) => {
      if (await access() === "none") throw new Error("ACADEMIC_ACCESS_REVOKED");
      return (await callAI({model:"openai/gpt-4.1-mini-2025-04-14",temperature:0.2,maxTokens:1800,
        messages:[{role:"system",content:system},{role:"user",content:user}]})).content;
    },
  });
  return {status:result.status,...await result.json()} as {status:number;answer?:string;sources?:{lessonId:string;sectionId:string}[];error?:string};
}
async function requireAdmin(context: Context) {
  const allowed = await rpc<boolean>(context.supabase,"academic_review_allowed",{p_course:"AC-BUS"});
  if (!allowed) throw new Error("ACADEMIC_ADMIN_REQUIRED");
}
export async function indexAcademicBatch(data:{offset:number;batchSize:number},context:Context) {
  await requireAdmin(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.from("academic_lesson_content" as never)
    .select("course_id,lesson_id,locale,approved,source_sha256,payload")
    .eq("course_id","AC-BUS").eq("approved",true).order("locale").order("lesson_id");
  if (result.error || !Array.isArray(result.data)) throw new Error("ACADEMIC_SOURCE_UNAVAILABLE");
  const lessons = result.data as unknown as ApprovedLesson[];
  const groups = await Promise.all(lessons.map(approvedChunks));
  for (const locale of ["ar-EG","ar-MSA","ar-Gulf","en"])
    if (lessons.filter(x=>x.locale===locale).length!==40) throw new Error("ACADEMIC_CORPUS_INCOMPLETE");
  const batch = groups.slice(data.offset,data.offset+data.batchSize).flat();
  if (batch.length > 80) throw new Error("ACADEMIC_BATCH_TOO_LARGE");
  const existing = await supabaseAdmin.from("academic_rag_chunks" as never)
    .select("lesson_id,locale,section_id,content_version,source_sha256,content_sha256").eq("course_id","AC-BUS");
  if (existing.error) throw new Error("ACADEMIC_INDEX_UNAVAILABLE");
  const identity = (x:Record<string,unknown>) => [x.lesson_id,x.locale,x.section_id,x.content_version,x.source_sha256,x.content_sha256].join("|");
  const done = new Set((existing.data as unknown as Record<string,unknown>[]).map(identity));
  const pending = batch.filter(x=>!done.has(identity(x)));
  if (pending.length) {
    const vectors = await embeddings(pending.map(x=>x.content));
    await requireAdmin(context);
    await rpc<number>(supabaseAdmin,"academic_import_chunks",{p_rows:pending.map((x,i)=>({...x,embedding:JSON.stringify(vectors[i])}))});
  }
  return {courseId:"AC-BUS",verifiedLessons:lessons.length,expectedChunks:groups.flat().length,
    inserted:pending.length,skipped:batch.length-pending.length,
    nextOffset:data.offset+data.batchSize<lessons.length?data.offset+data.batchSize:null};
}
