import { describe, expect, it } from "vitest";
import { preparationStatus } from "./preparation";
const v = "1e9d6c0e55528e45258ef1789df6e10e97ba0af45ef49180fb1ca7949345400e";
const ev = (job_id: string | null = null) => ({ source_sha: v, withdrawn: false, job_id });
const job = (
  state: "queued" | "running" | "complete" | "held",
  next_offset = 0,
  error_code: string | null = null,
) => ({ state, next_offset, scope_count: 22, error_code });
describe("honest curriculum preparation state", () => {
  it("drafts have no preparation", () =>
    expect(preparationStatus("draft", v, null, null)).toBeNull());
  it("approved edition with pending event and no job is queued, not preparing (AC-FATE case)", () =>
    expect(preparationStatus("approved", v, ev(), null)?.state).toBe("queued"));
  it("queued job is queued", () =>
    expect(preparationStatus("approved", v, ev("j"), job("queued"))?.state).toBe("queued"));
  it("running job reports progress", () =>
    expect(preparationStatus("approved", v, ev("j"), job("running", 7))).toEqual({
      state: "preparing",
      done: 7,
      total: 22,
      code: null,
    }));
  it("held job is failed with sanitized code", () => {
    expect(
      preparationStatus(
        "approved",
        v,
        ev("j"),
        job("held", 3, "AUTOMATION_PROVIDER_ALREADY_RESERVED"),
      )?.code,
    ).toBe("AUTOMATION_PROVIDER_ALREADY_RESERVED");
    expect(
      preparationStatus("approved", v, ev("j"), job("held", 3, "secret: row text"))?.code,
    ).toBe("PREPARATION_HELD");
  });
  it("complete job awaiting activation stays preparing, activation is ready", () => {
    expect(preparationStatus("approved", v, ev("j"), job("complete", 22))?.state).toBe("preparing");
    expect(preparationStatus("ready", v, null, null)?.state).toBe("ready");
  });
  it("missing/mismatched event is a failure, never active", () => {
    expect(preparationStatus("approved", v, null, null)?.state).toBe("failed");
    expect(preparationStatus("approved", v, { ...ev(), source_sha: "x" }, null)?.state).toBe(
      "failed",
    );
  });
});

import { aiPreparationStatus, matchCurriculumJob } from "./preparation";
describe("AI curricula (no source events)", () => {
  const row = (o: Partial<Parameters<typeof matchCurriculumJob>[0][number]> = {}) => ({
    ...job("running", 5),
    area: "ai",
    card_id: "c1",
    adapter: "curriculum",
    curriculum_version: v,
    created_at: "2026-11-01T00:00:00Z",
    ...o,
  });
  it("approved without event or job is queued, not EVENT_MISSING", () =>
    expect(aiPreparationStatus("approved", v, matchCurriculumJob([], "ai", "c1", v))).toEqual({
      state: "queued",
      done: null,
      total: null,
      code: null,
    }));
  it("running matching job reports progress", () =>
    expect(aiPreparationStatus("approved", v, matchCurriculumJob([row()], "ai", "c1", v))).toEqual({
      state: "preparing",
      done: 5,
      total: 22,
      code: null,
    }));
  it("held matching job is failed with code", () =>
    expect(
      aiPreparationStatus(
        "approved",
        v,
        matchCurriculumJob([row({ state: "held", error_code: "AUTOMATION_X" })], "ai", "c1", v),
      ),
    ).toMatchObject({ state: "failed", code: "AUTOMATION_X" }));
  it("stale-version, other-course and non-curriculum jobs are excluded", () => {
    const jobs = [
      row({ curriculum_version: "0".repeat(64) }),
      row({ card_id: "c2" }),
      row({ adapter: "card" }),
    ];
    expect(matchCurriculumJob(jobs, "ai", "c1", v)).toBeNull();
    expect(aiPreparationStatus("approved", v, matchCurriculumJob(jobs, "ai", "c1", v))?.state).toBe(
      "queued",
    );
  });
  it("newest exact job wins", () =>
    expect(
      matchCurriculumJob(
        [row({ state: "held" }), row({ state: "queued", created_at: "2026-11-02T00:00:00Z" })],
        "ai",
        "c1",
        v,
      )?.state,
    ).toBe("queued"));
});
