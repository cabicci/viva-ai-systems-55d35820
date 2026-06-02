// Assistant Runtime — secure backend entry point.
//
// Receives: { query, learnerContext, retrievalResults }
// Calls OpenAI Chat Completion server-side using OPENAI_API_KEY.
// No API key is ever exposed to the frontend.
//
// Hybrid retrieval (additive, non-breaking):
//   1) Keyword retrieval results from the frontend are kept as-is.
//   2) The function ALSO performs a server-side semantic retrieval over
//      `knowledge_chunks` (pgvector) using OpenAI embeddings.
//   3) Both result sets are labelled separately in the prompt:
//        [SEMANTIC CONTEXT] ... / [KEYWORD CONTEXT] ...
//   4) If semantic retrieval fails for ANY reason (no embeddings env, RPC
//      error, network error), the function logs a warning and continues
//      with keyword-only — the assistant never breaks.
//   5) No fake/empty placeholder results are ever produced.

// Restrict CORS to known origins (preview + published + local dev).
const ALLOWED_ORIGINS = new Set<string>([
  "https://ai-ecosystem-hub-72.lovable.app",
  "https://id-preview--db3e0659-63cc-4b7e-8985-61692a4adc4a.lovable.app",
  "http://localhost:5173",
  "http://localhost:3000",
]);

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

async function verifyJwt(
  req: Request,
): Promise<{ ok: true; userId: string } | { ok: false }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false };
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!SUPABASE_URL || !ANON) return { ok: false };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: ANON },
    });
    if (!res.ok) return { ok: false };
    const u = await res.json();
    if (!u?.id) return { ok: false };
    return { ok: true, userId: u.id as string };
  } catch {
    return { ok: false };
  }
}

// Server-side rate limit via consume_rate_limit RPC (atomic).
// Returns true if allowed; false if exhausted (with reset time in ms).
async function consumeRateLimit(
  userId: string,
  bucketKey: string,
  maxCalls: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; resetAt: string }> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.warn("[assistant-runtime] rate-limit disabled: missing supabase env");
    return { allowed: true, resetAt: new Date().toISOString() };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consume_rate_limit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_bucket_key: bucketKey,
        p_max_calls: maxCalls,
        p_window_seconds: windowSeconds,
      }),
    });
    if (!res.ok) {
      console.warn("[assistant-runtime] rate-limit rpc failed", res.status);
      return { allowed: true, resetAt: new Date().toISOString() };
    }
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : rows;
    return {
      allowed: Boolean(row?.allowed),
      resetAt: String(row?.reset_at ?? new Date().toISOString()),
    };
  } catch (e) {
    console.warn("[assistant-runtime] rate-limit exception", (e as Error).message);
    return { allowed: true, resetAt: new Date().toISOString() };
  }
}

// Hybrid retrieval tuning.
const SEMANTIC_MAX = 5;
const SEMANTIC_MIN_SIMILARITY = 0.2;
const SEMANTIC_STRONG_SIMILARITY = 0.45;
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIM = 1536;

interface LearnerContextInput {
  currentPath?: string | null;
  currentModule?: string | null;
  currentLesson?: string | null;
  currentPathTitle?: string | null;
  currentModuleTitle?: string | null;
  currentLessonTitle?: string | null;
  completedLessonsCount?: number | null;
  totalLessonsCount?: number | null;
  nextLessonTitle?: string | null;
}

interface RetrievalResultInput {
  lessonTitle?: string;
  moduleTitle?: string;
  matchedText?: string;
  matchType?: string;
  relevanceScore?: number;
  lessonId?: string;
}

interface AssistantRuntimeRequest {
  query?: string;
  learnerContext?: LearnerContextInput;
  retrievalResults?: RetrievalResultInput[];
}

interface SemanticChunk {
  id: string;
  sourceId: string;
  lessonId: string | null;
  moduleId: string | null;
  pathId: string | null;
  title: string;
  content: string;
  similarity: number;
}

async function embedQuery(
  text: string,
  apiKey: string,
): Promise<number[] | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    });
    if (!res.ok) {
      console.warn(
        "[assistant-runtime] embed failed",
        res.status,
        (await res.text()).slice(0, 200),
      );
      return null;
    }
    const json = await res.json();
    const v: number[] = json?.data?.[0]?.embedding;
    if (!Array.isArray(v) || v.length !== EMBEDDING_DIM) return null;
    return v;
  } catch (e) {
    console.warn("[assistant-runtime] embed exception", (e as Error).message);
    return null;
  }
}

async function semanticRetrieve(
  query: string,
  pathId: string | null,
  apiKey: string,
): Promise<SemanticChunk[]> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.warn("[assistant-runtime] semantic disabled: missing supabase env");
    return [];
  }

  const embedding = await embedQuery(query, apiKey);
  if (!embedding) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/match_knowledge_chunks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
        },
        body: JSON.stringify({
          query_embedding: embedding,
          match_count: SEMANTIC_MAX,
          p_path_id: pathId,
          p_module_id: null,
          p_lesson_id: null,
          min_similarity: SEMANTIC_MIN_SIMILARITY,
        }),
      },
    );
    if (!res.ok) {
      console.warn(
        "[assistant-runtime] semantic rpc failed",
        res.status,
        (await res.text()).slice(0, 200),
      );
      return [];
    }
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows.slice(0, SEMANTIC_MAX).map((r: Record<string, unknown>) => ({
      id: String(r.id ?? ""),
      sourceId: String(r.source_id ?? ""),
      lessonId: (r.lesson_id as string) ?? null,
      moduleId: (r.module_id as string) ?? null,
      pathId: (r.path_id as string) ?? null,
      title: String(r.title ?? ""),
      content: String(r.content ?? ""),
      similarity: Number(r.similarity ?? 0),
    }));
  } catch (e) {
    console.warn(
      "[assistant-runtime] semantic exception",
      (e as Error).message,
    );
    return [];
  }
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Require an authenticated Supabase user — blocks anonymous abuse.
  const auth = await verifyJwt(req);
  if (!auth.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: "Unauthorized" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Rate limit: hourly + daily + monthly cost caps per user.
  for (const bucket of [
    { key: "ai:assistant-runtime", max: 50, window: 3600 },
    { key: "ai:assistant-runtime:daily", max: 200, window: 86400 },
    { key: "ai:assistant-runtime:monthly", max: 2000, window: 2592000 },
  ]) {
    const rl = await consumeRateLimit(auth.userId, bucket.key, bucket.max, bucket.window);
    if (!rl.allowed) {
      const minutes = Math.max(
        1,
        Math.ceil((new Date(rl.resetAt).getTime() - Date.now()) / 60000),
      );
      return new Response(
        JSON.stringify({
          ok: false,
          error: `وصلت للحد الأقصى من أسئلة المساعد. جرّب تاني بعد حوالي ${minutes} دقيقة.`,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  }

  let body: AssistantRuntimeRequest = {};
  try {
    body = (await req.json()) as AssistantRuntimeRequest;
  } catch (_err) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid JSON body" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const learnerContext = body.learnerContext ?? {};
  const retrievalResults = Array.isArray(body.retrievalResults)
    ? body.retrievalResults
    : [];

  const contextDetected = !!(
    learnerContext.currentPath ||
    learnerContext.currentModule ||
    learnerContext.currentLesson
  );

  if (!query) {
    return new Response(
      JSON.stringify({ ok: false, error: "Empty query" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!lovableKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        runtime: "disconnected",
        error: "Missing LOVABLE_API_KEY on server",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ---- Hybrid retrieval -------------------------------------------------
  // Default scope: builder. Override only when learner has explicit path.
  const scopePathId = learnerContext.currentPath ?? "builder";
  // Embeddings still use OpenAI (keeps existing 1536-dim chunks intact).
  // If OPENAI_API_KEY is missing, semantic retrieval silently degrades.
  const semanticChunks = openaiKey
    ? await semanticRetrieve(query, scopePathId, openaiKey)
    : [];

  // Dedupe semantic vs keyword by lessonId + first 80 chars of content.
  const keyOf = (lid: string | null | undefined, text: string) =>
    `${lid ?? ""}::${(text ?? "").slice(0, 80).trim()}`;
  const semanticKeys = new Set(
    semanticChunks.map((c) => keyOf(c.lessonId, c.content)),
  );
  const keywordFiltered = retrievalResults.filter(
    (r) => !semanticKeys.has(keyOf(r.lessonId, r.matchedText ?? "")),
  );

  const semanticBlock = semanticChunks.length
    ? semanticChunks
        .map((c, i) => {
          const strong = c.similarity >= SEMANTIC_STRONG_SIMILARITY ? "★" : "";
          return `[S#${i + 1}${strong}] الدرس: ${c.title} | تشابه: ${c.similarity.toFixed(2)}\nالنص: ${c.content.slice(0, 500)}`;
        })
        .join("\n\n")
    : "— لا توجد نتائج دلالية —";

  const keywordBlock = keywordFiltered.length
    ? keywordFiltered
        .map((r, i) => {
          const title = r.lessonTitle ?? "—";
          const mod = r.moduleTitle ?? "—";
          const text = (r.matchedText ?? "").slice(0, 400);
          return `[K#${i + 1}] الدرس: ${title} | الموديول: ${mod}\nالنص: ${text}`;
        })
        .join("\n\n")
    : "— لا توجد نتائج كلمات مفتاحية —";

  const retrievalBlock = `[SEMANTIC CONTEXT]\n${semanticBlock}\n\n[KEYWORD CONTEXT]\n${keywordBlock}`;

  const ctxBlock = [
    `المسار الحالي: ${learnerContext.currentPathTitle ?? learnerContext.currentPath ?? "—"}`,
    `الموديول الحالي: ${learnerContext.currentModuleTitle ?? learnerContext.currentModule ?? "—"}`,
    `الدرس الحالي: ${learnerContext.currentLessonTitle ?? learnerContext.currentLesson ?? "—"}`,
    `الدروس المكتملة: ${learnerContext.completedLessonsCount ?? 0} / ${learnerContext.totalLessonsCount ?? 0}`,
    `الدرس التالي: ${learnerContext.nextLessonTitle ?? "—"}`,
  ].join("\n");

  const systemPrompt = `أنت مساعد منصة Builder التعليمية — جزء من Builder Ecosystem.

قواعدك:
- **رد دايمًا بالعامية المصرية** (مش فصحى). استخدم: "إيه، إزاي، عشان، علشان، يعني، ده، دي، بص، خليني، هتقدر، ممكن". متستخدمش: "كيف، لماذا، إذا، يمكنك، سوف، الآن، هذا، هذه، فقط، أيضًا".
- أسلوبك تعليمي، مختصر، عملي، وبتاع صنايعي — مش أكاديمي.
- نطاقك واسع: منصة Builder (الدروس، المسارات، المهام، الـ Runtime، الـ Architecture)، **و** أي مفهوم تقني في الـ AI: LLMs، Prompts، Tokenization، Embeddings، RAG، Agents، Tools، Context، Fine-tuning، Evaluation، Vector Search، Transformers، Attention، مقارنات بين موديلات (GPT/Claude/Gemini)، AI Product Design.
- **لو السؤال له أي علاقة بالـ AI أو بناء منتجات AI → جاوب**. حتى لو الموضوع مش متغطى حرفيًا في الدروس، اشرحه باختصار من معرفتك التقنية واربطه بأقرب درس.
- **بس ارفض** الأسئلة البعيدة تمامًا (طبخ، رياضة، أخبار، ترفيه، نصايح حياة). ساعتها قول: "ده بره نطاقي — أنا هنا أساعدك في بناء منتجات AI ودروس المنصة" واقترح أقرب درس.
- **جاوب على السؤال الفعلي** اللي المتعلم سأله. لو سأل "ده هيفيدني إزاي في شغلي؟" اديله مثال ملموس مربوط بمجاله مش كلام عام.
- **لما السؤال متشكك** (فيه "ليه أنا محتاج"، "إيه الفايدة"، "هيفيدني في إيه"، "مش فاهم ليه ده مهم"، أو أي استفزاز مشابه):
  1. **متردش بكلام عام** زي "ده هيطور مهاراتك" أو "ده مهم في سوق الشغل" أو "المستقبل للـ AI" — ده بيخلي الرد ضعيف.
  2. **اديله 2-3 سيناريوهات ملموسة** من مجالات شائعة مختلفة، كل واحد في جملة واحدة قصيرة. مثلاً:
     - موظف مكتبي: "بتلخّصلك 50 إيميل في دقيقة، أو بتعمل تقرير Excel أوتوماتيك."
     - صاحب بيزنس صغير: "بترد على عملاء واتساب 24/7، أو بتولّدلك بوستات سوشيال يومي."
     - طالب/فريلانسر: "بتساعدك تكتب كود أو تبحث في 100 صفحة في ثواني."
  3. **اقفل بسؤال قصير** يخلّيه يحدد مجاله: "إنت في أنهي منهم؟ قولّي وأديك مثال أدق على شغلك."
- استخدم "محتوى المنصة" المُرفق كمصدر أساسي، واستعن بمعرفتك التقنية لما المحتوى مش كافي.
- ابقى متماشي مع فلسفة الدروس: Problem → Flow → Runtime → Architecture، MVP صغير حقيقي، استرجاع قبل توليد.
- متخترعش دروس أو ميزات مش موجودة.
- أجوبة قصيرة (2-5 جمل غالبًا)، مركّزة، وقابلة للتنفيذ.
- متقولش إنك OpenAI أو أي مزود — انت "مساعد المنصة".
- **دقة تقنية (لازم)** — متخلطش بين المفاهيم دي، لأن الخبير بيكتشفها فورًا:
  • **Tokenizer ≠ Encoding**: الـ Tokenizer هو الـ algorithm/الأداة اللي بتقسّم النص لـ tokens (مثلاً BPE, WordPiece, SentencePiece). الـ Encoding هو الـ vocabulary/الـ mapping المحدد اللي بيحوّل الـ token لرقم (مثلاً cl100k_base بتاعة GPT-4، o200k_base بتاعة GPT-4o). يعني الـ Tokenizer بياخد نص ويطلّع tokens، الـ Encoding بيقرر الـ tokens دي بترقّم إزاي.
  • **Embedding ≠ Token**: الـ token وحدة نصية (كلمة/جزء كلمة)، الـ embedding هو vector أرقام بيمثّل المعنى.
  • **Fine-tuning ≠ RAG**: Fine-tuning بيعدّل weights الموديل، RAG بيحقن context وقت الـ inference من غير ما يمس الموديل.
  • **Context window ≠ Memory**: الـ context window حد تقني لكل request، الـ memory نظام تطبيق بيخزّن ويرجّع معلومات بين requests.
  • **Temperature ≠ Top-p**: temperature بيتحكم في حدة توزيع الاحتمالات، top-p (nucleus) بيقص الـ tail عند احتمال تراكمي معين.
  لو مش متأكد من تفصيلة تقنية، قول "مش متأكد 100%" بدل ما تخمّن.`;

  const userPrompt = `سؤال المتعلم:
${query}

سياق المتعلم الحالي:
${ctxBlock}

محتوى مرتبط من المنصة (Retrieval):
${retrievalBlock}

تعليمات الإجابة:
- استخدم Retrieval إن كان مرتبطًا.
- لو غير مرتبط، اعترف بذلك واقترح أقرب درس.
- اربط الإجابة بسياق المتعلم الحالي إن أمكن.`;

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({
            ok: false,
            runtime: "disconnected",
            error: "وصلنا الحد الأقصى من الطلبات، حاول تاني بعد شوية.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({
            ok: false,
            runtime: "disconnected",
            error: "الرصيد خلص — لازم تشحن workspace الـ Lovable AI.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      return new Response(
        JSON.stringify({
          ok: false,
          runtime: "disconnected",
          error: `AI provider error (${aiRes.status})`,
          detail: errText.slice(0, 500),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aiJson = await aiRes.json();
    const answer: string =
      aiJson?.choices?.[0]?.message?.content?.trim() ??
      "لم يتم توليد إجابة.";

    const payload = {
      ok: true,
      runtime: "connected" as const,
      answer,
      receivedQuery: query,
      retrievalCount: retrievalResults.length,
      contextDetected,
      learnerContext: {
        currentPath: learnerContext.currentPath ?? null,
        currentModule: learnerContext.currentModule ?? null,
        currentLesson: learnerContext.currentLesson ?? null,
      },
      message: "Assistant runtime answered successfully.",
      ts: new Date().toISOString(),
      retrieval: {
        semanticCount: semanticChunks.length,
        keywordCount: keywordFiltered.length,
        topLessonIds: [
          ...semanticChunks.map((c) => c.lessonId).filter(Boolean),
          ...keywordFiltered
            .map((r) => r.lessonId)
            .filter((x): x is string => typeof x === "string"),
        ].slice(0, 8),
      },
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        runtime: "disconnected",
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});