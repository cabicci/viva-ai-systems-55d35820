// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
type Job = {
  key: string;
  state: "queued" | "running" | "complete" | "held";
  offset: number;
  count: number;
  manifest: Record<string, unknown>;
  leaseLive?: boolean;
  reserved?: boolean;
};
const h = vi.hoisted(() => ({
  jobs: new Map<string, Job>(),
  calls: [] as { fn: string; args: Record<string, unknown> }[],
  legacyPlans: vi.fn(),
  admittedPlans: vi.fn(),
  admitted: vi.fn(),
}));
// Minimal model of assistant_auto_register / claim / finish semantics:
// register is ON CONFLICT DO NOTHING; claim is globally busy while any lease
// (or provider-reserved hold) is live, and otherwise selects only from p_keys.
async function rpc(fn: string, args: Record<string, unknown>) {
  h.calls.push({ fn, args });
  if (fn === "assistant_auto_register") {
    for (const j of args.p_jobs as { key: string; material: string }[]) {
      if (h.jobs.has(j.key)) continue;
      const m = JSON.parse(j.material);
      h.jobs.set(j.key, {
        key: j.key,
        state: "queued",
        offset: 0,
        count: m.scopeCount,
        manifest: m,
      });
    }
    return { registered: (args.p_jobs as unknown[]).length };
  }
  if (fn === "assistant_auto_link_sources") return true;
  if (fn === "assistant_auto_claim") {
    if (
      [...h.jobs.values()].some(
        (j) => j.leaseLive && (j.state === "running" || (j.state === "held" && j.reserved)),
      )
    )
      return { busy: true };
    const keys = args.p_keys as string[];
    const j = [...h.jobs.values()].find((x) => x.state === "queued" && keys.includes(x.key));
    if (!j) return { done: true };
    j.state = "running";
    return {
      claimed: true,
      jobId: j.key,
      requestId: args.p_request,
      leaseToken: "t",
      offset: j.offset,
      manifest: j.manifest,
    };
  }
  if (fn === "assistant_auto_finish") {
    const j = h.jobs.get(args.p_job as string)!;
    j.offset += 1;
    j.state = args.p_done ? "complete" : "queued";
    return true;
  }
  if (fn === "assistant_auto_hold") {
    h.jobs.get(args.p_job as string)!.state = "held";
    return true;
  }
  throw new Error("unexpected " + fn);
}
vi.mock("@/lib/assistant-automation/store.server", () => ({
  automationRpc: (fn: string, args: Record<string, unknown>) => rpc(fn, args),
  leaseArguments: (l: { jobId: string; requestId: string; leaseToken: string }) => ({
    p_job: l.jobId,
    p_request: l.requestId,
    p_lease: l.leaseToken,
  }),
}));
vi.mock("@/lib/assistant-automation/worker.server", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/assistant-automation/worker.server")>();
  return { ...real, currentAutomaticPlans: h.legacyPlans, executeAutomaticScope: vi.fn() };
});
vi.mock("./index.server", () => ({
  curriculumAutomaticPlans: h.admittedPlans,
  indexCurriculumScope: h.admitted,
}));
import { automaticTick } from "./automatic-worker.server";

const plan = (id: string, version: string, scopes = 2) => {
  const manifest = {
    schemaVersion: "assistant-auto-v1",
    adapter: "curriculum",
    build: "a".repeat(64),
    area: "academic",
    cardId: id,
    curriculumVersion: version,
    sourceRevision: "45",
    issue: null,
    scopeCount: scopes + 1,
    scopes: Array.from({ length: scopes }, (_, i) => ({
      stepId: "L" + i,
      locale: "en",
      sourceSha: "b".repeat(64),
    })),
  };
  return { key: `${id}@${version}`, material: JSON.stringify(manifest), manifest };
};
const legacy = (
  key: string,
  area = "kids",
  state: Job["state"] = "queued",
  extra: Partial<Job> = {},
) =>
  h.jobs.set(key, { key, state, offset: 0, count: 49, manifest: { area, cardId: key }, ...extra });
const claims = () =>
  h.calls.filter((c) => c.fn === "assistant_auto_claim").map((c) => c.args.p_keys);

beforeEach(() => {
  h.jobs.clear();
  h.calls.length = 0;
  vi.clearAllMocks();
  vi.stubGlobal("__ASSISTANT_INDEXER_BUILD__", "a".repeat(64));
  h.admitted.mockResolvedValue({ proofs: [] });
});
afterEach(() => vi.unstubAllGlobals());

it("never enumerates or registers the legacy catalogue, and passes no legacy registry", async () => {
  h.admittedPlans.mockResolvedValue([]);
  await automaticTick("r1");
  expect(h.legacyPlans).not.toHaveBeenCalled();
  const reg = h.calls.find((c) => c.fn === "assistant_auto_register")!;
  expect(reg.args.p_jobs).toEqual([]);
  expect(reg.args.p_registry).toEqual([]);
  expect(h.jobs.size).toBe(0);
});

it("prepares a newly approved curriculum version ahead of old blanket legacy jobs", async () => {
  legacy("level-1");
  legacy("furniture", "technical");
  h.admittedPlans.mockResolvedValue([plan("AC-FATE", "v1")]);
  const result = await automaticTick("r1");
  expect(result).toMatchObject({
    progressed: true,
    cardId: "AC-FATE",
    completedScopes: 1,
    totalScopes: 3,
  });
  expect(claims()).toEqual([["AC-FATE@v1"]]);
  // Legacy rows keep their honest history: still queued, never claimed or completed.
  expect(h.jobs.get("level-1")).toMatchObject({ state: "queued", offset: 0 });
  expect(h.jobs.get("furniture")).toMatchObject({ state: "queued", offset: 0 });
});

it("resumes the pending approved version scope by scope until complete, then reports done", async () => {
  h.admittedPlans.mockResolvedValue([plan("AC-FATE", "v1")]);
  for (let i = 0; i < 3; i++) await automaticTick("r" + i);
  expect(h.jobs.get("AC-FATE@v1")).toMatchObject({ state: "complete", offset: 3 });
  expect(await automaticTick("r9")).toEqual({ done: true });
  expect(h.admitted).toHaveBeenCalledTimes(3);
});

it("does no work for an unchanged, already prepared version", async () => {
  h.jobs.set("AC-FATE@v1", {
    key: "AC-FATE@v1",
    state: "complete",
    offset: 3,
    count: 3,
    manifest: plan("AC-FATE", "v1").manifest,
  });
  h.admittedPlans.mockResolvedValue([plan("AC-FATE", "v1")]);
  expect(await automaticTick("r1")).toEqual({ done: true });
  expect(h.admitted).not.toHaveBeenCalled();
  expect(h.jobs.get("AC-FATE@v1")!.state).toBe("complete");
});

it("prepares a revised approved version as a new job while the old version's record stays intact", async () => {
  h.jobs.set("AC-FATE@v1", {
    key: "AC-FATE@v1",
    state: "complete",
    offset: 3,
    count: 3,
    manifest: plan("AC-FATE", "v1").manifest,
  });
  h.admittedPlans.mockResolvedValue([plan("AC-FATE", "v2", 3)]);
  expect(await automaticTick("r1")).toMatchObject({
    progressed: true,
    cardId: "AC-FATE",
    totalScopes: 4,
  });
  expect(h.jobs.get("AC-FATE@v1")).toMatchObject({ state: "complete", offset: 3 });
  expect(h.jobs.get("AC-FATE@v2")).toMatchObject({ state: "queued", offset: 1 });
});

it("waits behind an in-flight legacy lease or an uncertain paid hold without interrupting it", async () => {
  legacy("furniture", "technical", "running", { leaseLive: true, offset: 149 });
  h.admittedPlans.mockResolvedValue([plan("AC-FATE", "v1")]);
  expect(await automaticTick("r1")).toEqual({ busy: true });
  expect(h.jobs.get("furniture")).toMatchObject({ state: "running", offset: 149 });
  h.jobs.get("furniture")!.state = "held";
  h.jobs.get("furniture")!.reserved = true;
  expect(await automaticTick("r2")).toEqual({ busy: true });
  expect(h.admitted).not.toHaveBeenCalled();
  // Once the legacy lease has ended, the admission path still never selects legacy work.
  h.jobs.get("furniture")!.leaseLive = false;
  h.jobs.get("furniture")!.state = "queued";
  expect(await automaticTick("r3")).toMatchObject({ cardId: "AC-FATE" });
  expect(h.jobs.get("furniture")).toMatchObject({ state: "queued", offset: 149 });
});

it("holds a failed scope instead of retrying it", async () => {
  h.admittedPlans.mockResolvedValue([plan("AC-FATE", "v1")]);
  h.admitted.mockRejectedValueOnce(new Error("AUTOMATION_SOURCE_CHANGED"));
  expect(await automaticTick("r1")).toMatchObject({
    held: true,
    code: "AUTOMATION_SOURCE_CHANGED",
  });
  expect(h.jobs.get("AC-FATE@v1")!.state).toBe("held");
  expect(await automaticTick("r2")).toEqual({ done: true });
  expect(h.admitted).toHaveBeenCalledTimes(1);
});

it("refuses to execute any non-curriculum lease on the admission path", async () => {
  const { adapter: _drop, ...manifest } = plan("x", "v1").manifest;
  h.admittedPlans.mockResolvedValue([{ key: "x", material: JSON.stringify(manifest), manifest }]);
  expect(await automaticTick("r1")).toMatchObject({
    held: true,
    code: "AUTOMATION_SCOPE_NOT_ADMITTED",
  });
});

it("stops before claiming when admitted plans exceed the queue limit", async () => {
  h.admittedPlans.mockResolvedValue(Array(201).fill(plan("a", "v")));
  await expect(automaticTick("r1")).rejects.toThrow("AUTOMATION_SCOPE_LIMIT");
  expect(claims()).toEqual([]);
});
