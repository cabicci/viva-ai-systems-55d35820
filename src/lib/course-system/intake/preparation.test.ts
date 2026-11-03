import { describe, expect, it } from "vitest";
import { preparationStatus } from "./preparation";
const v = "1e9d6c0e55528e45258ef1789df6e10e97ba0af45ef49180fb1ca7949345400e";
const ev = (job_id: string | null = null) => ({ source_sha: v, withdrawn: false, job_id });
const job = (state: "queued" | "running" | "complete" | "held", next_offset = 0, error_code: string | null = null) => ({ state, next_offset, scope_count: 22, error_code });
describe("honest curriculum preparation state", () => {
  it("drafts have no preparation", () => expect(preparationStatus("draft", v, null, null)).toBeNull());
  it("approved edition with pending event and no job is queued, not preparing (AC-FATE case)", () =>
    expect(preparationStatus("approved", v, ev(), null)?.state).toBe("queued"));
  it("queued job is queued", () => expect(preparationStatus("approved", v, ev("j"), job("queued"))?.state).toBe("queued"));
  it("running job reports progress", () =>
    expect(preparationStatus("approved", v, ev("j"), job("running", 7))).toEqual({ state: "preparing", done: 7, total: 22, code: null }));
  it("held job is failed with sanitized code", () => {
    expect(preparationStatus("approved", v, ev("j"), job("held", 3, "AUTOMATION_PROVIDER_ALREADY_RESERVED"))?.code).toBe("AUTOMATION_PROVIDER_ALREADY_RESERVED");
    expect(preparationStatus("approved", v, ev("j"), job("held", 3, "secret: row text"))?.code).toBe("PREPARATION_HELD");
  });
  it("complete job awaiting activation stays preparing, activation is ready", () => {
    expect(preparationStatus("approved", v, ev("j"), job("complete", 22))?.state).toBe("preparing");
    expect(preparationStatus("ready", v, null, null)?.state).toBe("ready");
  });
  it("missing/mismatched event is a failure, never active", () => {
    expect(preparationStatus("approved", v, null, null)?.state).toBe("failed");
    expect(preparationStatus("approved", v, { ...ev(), source_sha: "x" }, null)?.state).toBe("failed");
  });
});
