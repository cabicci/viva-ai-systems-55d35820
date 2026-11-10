import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  admin: true,
  authError: false,
  results: {} as Record<string, any>,
  rejected: new Set<string>(),
  limits: {} as Record<string, number>,
  selects: {} as Record<string, any>,
  from: vi.fn(),
  rpc: vi.fn(),
  rate: vi.fn(),
  fetch: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const chain = {
      middleware: () => chain,
      inputValidator: () => chain,
      handler: (fn: any) => () =>
        fn({ context: { userId: "synthetic-admin", supabase: { rpc: state.rpc } } }),
    };
    return chain;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: state.from } }));
vi.mock("@/lib/rate-limit.server", () => ({ enforceRateLimit: state.rate }));
vi.mock("@/lib/curriculum-data", () => ({
  PATHS: [],
  totalLessons: () => 0,
  totalAvailableLessons: () => 0,
}));
import { generateDnaReport } from "@/lib/dna-report.functions";

const tables = [
  "user_active_device",
  "user_subscriptions",
  "lesson_progress",
  "user_lesson_status",
  "user_activity_time",
  "user_streaks",
  "mission_submissions",
  "learner_events",
  "client_error_logs",
  "knowledge_chunks",
  "roadmap_items",
  "user_roles",
];
beforeEach(() => {
  vi.clearAllMocks();
  state.admin = true;
  state.authError = false;
  state.rejected.clear();
  state.limits = {};
  state.selects = {};
  state.results = Object.fromEntries(
    tables.map((table) => [table, { data: [], count: 0, error: null }]),
  );
  state.rpc.mockImplementation(() =>
    Promise.resolve({
      data: state.admin,
      error: state.authError ? { message: "auth unavailable" } : null,
    }),
  );
  state.rate.mockResolvedValue(undefined);
  state.from.mockImplementation((table: string) => {
    const q = {
      select: (_: unknown, options: unknown) => {
        state.selects[table] = options;
        return q;
      },
      order: () => q,
      gte: () => q,
      limit: (n: number) => {
        state.limits[table] = n;
        return q;
      },
      then: (resolve: any, reject: any) =>
        (state.rejected.has(table)
          ? Promise.reject(new Error("private backend detail"))
          : Promise.resolve(state.results[table])
        ).then(resolve, reject),
    };
    return q;
  });
  vi.stubEnv("SUPABASE_URL", "https://synthetic.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-test-only");
  state.fetch.mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", state.fetch);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
const generate = () =>
  (generateDnaReport as any)() as Promise<{
    markdown: string;
    storagePath: string | null;
    storageError: string | null;
  }>;
const stats = (markdown: string) =>
  markdown.split("## 6. Live Platform Stats")[1].split("## 8. Conventions")[0];

describe("actual DNA generation with synthetic SDK/storage", () => {
  it.each(tables)(
    "marks a returned PostgREST error for %s instead of using its data/count",
    async (table) => {
      state.results[table] = {
        data: [{ tier: "SENTINEL_FAILED_DATA" }],
        count: 777777,
        error: { message: "private backend detail" },
      };
      const { markdown } = await generate();
      const section = stats(markdown);
      expect(section).toContain("التقرير غير مكتمل");
      expect(section).toContain("تعذّرت 1 قراءة");
      expect(section).toContain(`تعذّر جلب البيانات — ${table}`);
      expect(section).not.toContain("SENTINEL_FAILED_DATA");
      expect(section).not.toContain("777777");
      expect(section).not.toContain("private backend detail");
    },
  );
  it.each(tables)("marks a rejected read for %s explicitly", async (table) => {
    state.rejected.add(table);
    const { markdown } = await generate();
    expect(stats(markdown)).toContain(`تعذّر جلب البيانات — ${table}`);
    expect(stats(markdown)).not.toContain("private backend detail");
  });
  it("preserves successful empty samples and exact zero counts", async () => {
    const { markdown } = await generate();
    const section = stats(markdown);
    expect(section).not.toContain("تعذّر جلب البيانات");
    expect(section).not.toContain("التقرير غير مكتمل");
    expect(section).toContain("**مستخدمون عندهم device نشط (عدّ دقيق):** 0");
    expect(section).toContain("**knowledge_chunks (RAG vectors, عدّ دقيق):** 0");
    expect(section.match(/عينة مسترجعة: 0 سجل/g)).toHaveLength(10);
  });
  it("does not substitute zero when an exact count is absent", async () => {
    state.results.user_active_device.count = null;
    state.results.knowledge_chunks.count = null;
    const { markdown } = await generate();
    expect(stats(markdown)).toContain("**مستخدمون عندهم device نشط (عدّ دقيق):** العدد غير متاح");
    expect(stats(markdown)).toContain(
      "**knowledge_chunks (RAG vectors, عدّ دقيق):** العدد غير متاح",
    );
  });
  it("qualifies all bounded distributions and roadmap progress, even below the requested limit", async () => {
    state.results.user_subscriptions.data = [{ tier: "paid", status: "active" }];
    state.results.mission_submissions.data = [{ status: "submitted", score: null }];
    state.results.learner_events.data = [{ event_type: "lesson_opened" }];
    state.results.user_roles.data = [{ user_id: "synthetic-user", role: "admin" }];
    state.results.roadmap_items.data = [
      { id: "synthetic-item", title: "Synthetic roadmap item", phase: "A", status: "done" },
    ];
    const section = stats((await generate()).markdown);
    for (const title of [
      "user_subscriptions",
      "Mission records (skipped is not a graded submission)",
      "learner_events",
    ]) {
      expect(section).toContain(
        `**${title}:** عينة مسترجعة: 1 سجل (حد الطلب 5000؛ ليست إجمالي المنصة)`,
      );
    }
    expect(section).toContain(
      "**User roles:** عينة مسترجعة: 1 سجل (حد الطلب 1000؛ ليست إجمالي المنصة)",
    );
    expect(section).toContain("7. Roadmap State (قراءة محدودة)");
    expect(section).toContain("عينة مسترجعة: 1 سجل (حد الطلب 1000؛ ليست إجمالي المنصة)");
    expect(section).not.toContain("إجمالي السجلات المطابقة للفلتر: 1");
    expect(section).not.toContain("1 إجمالي");
    expect(section).toContain("الإجمالي الدقيق غير متاح");
    expect(section).not.toContain("(شامل)");
  });
  it("labels a full 5000-row response as a sample too", async () => {
    state.results.user_subscriptions.data = Array.from({ length: 5000 }, () => ({
      tier: "paid",
      status: "active",
    }));
    expect(stats((await generate()).markdown)).toContain(
      "**user_subscriptions:** عينة مسترجعة: 5000 سجل (حد الطلب 5000؛ ليست إجمالي المنصة)",
    );
  });
  it("keeps every query cap, exact head count and rate limit", async () => {
    await generate();
    expect(state.limits).toEqual({
      user_subscriptions: 5000,
      lesson_progress: 5000,
      user_lesson_status: 5000,
      user_activity_time: 10,
      user_streaks: 5000,
      mission_submissions: 5000,
      learner_events: 5000,
      client_error_logs: 50,
      roadmap_items: 1000,
      user_roles: 1000,
    });
    expect(state.selects.user_active_device).toEqual({ count: "exact", head: true });
    expect(state.selects.knowledge_chunks).toEqual({ count: "exact", head: true });
    expect(state.rate).toHaveBeenCalledWith({
      userId: "synthetic-admin",
      bucketKey: "dna-report:generate",
      maxCalls: 6,
      windowSeconds: 3600,
    });
  });
  it.each([false, true])(
    "blocks unauthorized generation before service reads (auth failure %s)",
    async (authError) => {
      state.admin = false;
      state.authError = authError;
      await expect(generate()).rejects.toThrow(
        authError ? "Authorization check failed" : "Forbidden",
      );
      expect(state.from).not.toHaveBeenCalled();
      expect(state.rate).not.toHaveBeenCalled();
      expect(state.fetch).not.toHaveBeenCalled();
    },
  );
  it("does not read or archive after a rate-limit rejection", async () => {
    state.rate.mockRejectedValue(new Error("rate limited"));
    await expect(generate()).rejects.toThrow("rate limited");
    expect(state.from).not.toHaveBeenCalled();
    expect(state.fetch).not.toHaveBeenCalled();
  });
  it("archives the same explicitly partial report and keeps storage failures separate", async () => {
    state.rejected.add("mission_submissions");
    state.fetch.mockResolvedValue({
      ok: false,
      text: async () => '{"message":"synthetic storage failure"}',
    });
    const result = await generate();
    expect(result.storagePath).toBeNull();
    expect(result.storageError).toBe("synthetic storage failure");
    expect(state.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = state.fetch.mock.calls[0];
    expect(url).toMatch(/^https:\/\/synthetic\.invalid\/storage\/v1\/object\/dna-reports\//);
    expect(options.method).toBe("POST");
    expect(options.body).toBe(result.markdown);
    expect(stats(options.body)).toContain("التقرير غير مكتمل");
  });
});

it("separates skip markers from pass distribution and scored averages", async () => {
  state.results.mission_submissions.data = [
    { status: "passed", score: 0, skipped: true },
    { status: "passed", score: 80, skipped: false },
  ];
  const section = stats((await generate()).markdown);
  expect(section).toContain("skipped=1");
  expect(section).toContain("passed=1");
  expect(section).not.toContain("passed=2");
  expect(section).toContain("80.0");
});

it("reports exact matching totals alongside bounded samples", async () => {
  state.results.user_subscriptions = {
    data: [{ tier: "paid", status: "active" }],
    count: 12000,
    error: null,
  };
  state.results.lesson_progress = {
    data: [{ user_id: "one", lesson_id: "lesson", status: "completed" }],
    count: 25000,
    error: null,
  };
  const section = stats((await generate()).markdown);
  expect(section).toContain(
    "عينة مسترجعة: 1 سجل (حد الطلب 5000؛ ليست إجمالي المنصة)؛ إجمالي السجلات المطابقة للفلتر: 12000",
  );
  expect(section).toContain("إجمالي السجلات المطابقة للفلتر: 25000، في العينة: 1 completed");
  for (const table of tables) {
    if (["user_active_device", "knowledge_chunks"].includes(table)) {
      expect(state.selects[table]).toEqual({ count: "exact", head: true });
    } else if (
      [
        "user_subscriptions",
        "lesson_progress",
        "user_lesson_status",
        "user_streaks",
        "mission_submissions",
        "learner_events",
      ].includes(table)
    ) {
      expect(state.selects[table]).toEqual({ count: "exact" });
    } else {
      expect(state.selects[table]).toBeUndefined();
    }
  }
  expect(state.limits.user_subscriptions).toBe(5000);
  expect(state.limits.client_error_logs).toBe(50);
});

it.each([null, undefined, -1, 1.5, NaN, Infinity, 0])(
  "keeps an invalid total unknown for a nonempty sample %#",
  async (count) => {
    state.results.user_subscriptions = {
      data: [{ tier: "paid", status: "active" }],
      count,
      error: null,
    };
    const section = stats((await generate()).markdown);
    expect(section).toContain(
      "**user_subscriptions:** عينة مسترجعة: 1 سجل (حد الطلب 5000؛ ليست إجمالي المنصة)؛ الإجمالي الدقيق غير متاح",
    );
  },
);

it("does not infer an exact total from failed data or count", async () => {
  state.results.user_subscriptions = {
    data: [],
    count: 987654,
    error: { message: "PRIVATE_DETAIL" },
  };
  const section = stats((await generate()).markdown);
  expect(section).toContain("تعذّر جلب البيانات — user_subscriptions");
  expect(section).not.toContain("987654");
  expect(section).not.toContain("PRIVATE_DETAIL");
});

it("does not present static publication claims or retired audio-production instructions", async () => {
  const { markdown } = await generate();
  expect(markdown).not.toContain("كلهم مكتملين ومنشورين");
  expect(markdown).not.toContain("TTS");
  expect(markdown).not.toContain("audio-assets");
});

it("uses the installed SDK count header without expanding the row limit", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const requests: Request[] = [];
  const client = createClient("https://report-count.invalid", "synthetic-key-only", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        requests.push(new Request(input, init));
        return new Response(JSON.stringify([{ tier: "paid", status: "active" }]), {
          status: 200,
          headers: { "content-type": "application/json", "content-range": "0-0/12000" },
        });
      },
    },
  });
  const result = await client
    .from("synthetic_report")
    .select("tier,status", { count: "exact" })
    .limit(5000);
  expect(result.error).toBeNull();
  expect(result.count).toBe(12000);
  expect(result.data).toHaveLength(1);
  expect(requests).toHaveLength(1);
  expect(requests[0].method).toBe("GET");
  expect(requests[0].headers.get("prefer")).toContain("count=exact");
  expect(new URL(requests[0].url).searchParams.get("limit")).toBe("5000");
});
