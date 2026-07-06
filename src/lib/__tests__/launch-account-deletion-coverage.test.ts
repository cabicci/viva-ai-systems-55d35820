import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

/** User-owned public tables that delete_my_account_data must wipe. */
const REQUIRED_USER_TABLE_DELETES = [
  "user_subscriptions",
  "lesson_progress",
  "user_lesson_status",
  "user_mission_state",
  "mission_submissions",
  "lesson_notes",
  "lesson_quiz_attempts",
  "build_logs",
  "user_streaks",
  "user_activity_time",
  "user_active_device",
  "learner_events",
  "learner_triage",
  "lesson_feedback",
  "lesson_review_schedule",
  "rate_limit_buckets",
  "shadow_watchlist",
  "user_shadow_events",
  "user_validation_sessions",
  "client_error_logs",
  "user_roles",
] as const;

function readDeleteFunctionSource(): string {
  const migration = readFileSync(
    path.join(
      REPO_ROOT,
      "supabase/migrations/20260706121500_delete_my_account_data_coverage.sql",
    ),
    "utf8",
  );
  const original = readFileSync(
    path.join(
      REPO_ROOT,
      "supabase/migrations/20260526105950_3be8825a-a536-4515-9b54-f0755a644724.sql",
    ),
    "utf8",
  );
  return `${original}\n${migration}`;
}

describe("launch account deletion coverage (Batch A)", () => {
  it("delete_my_account_data wipes all user-owned public tables", () => {
    const source = readDeleteFunctionSource();
    for (const table of REQUIRED_USER_TABLE_DELETES) {
      expect(source, table).toMatch(
        new RegExp(`DELETE FROM public\\.${table} WHERE user_id = v_user`),
      );
    }
    expect(source).toMatch(
      /DELETE FROM public\.v9_apply_decisions WHERE decided_by = v_user/,
    );
  });

  it("rate-limit.server.ts does not statically import client.server", () => {
    const source = readFileSync(
      path.join(REPO_ROOT, "src/lib/rate-limit.server.ts"),
      "utf8",
    );
    expect(source).not.toMatch(
      /^import\s+.*from\s+["']@\/integrations\/supabase\/client\.server["']/m,
    );
    expect(source).toContain('import("@/integrations/supabase/client.server")');
  });

  it("assistant-runtime rate limit fails closed on RPC errors", () => {
    const source = readFileSync(
      path.join(REPO_ROOT, "supabase/functions/assistant-runtime/index.ts"),
      "utf8",
    );
    expect(source).toContain("allowed: false");
    expect(source).not.toMatch(
      /rate-limit disabled: missing supabase env[\s\S]*allowed: true/,
    );
  });
});
