import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function readRepoFile(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function readAllMigrations(): string {
  const dir = path.join(REPO_ROOT, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}

describe("security batch B hardening", () => {
  it("consume_rate_limit blocks cross-user spoofing for non-service callers", () => {
    const source = readRepoFile(
      "supabase/migrations/20260604160000_consume_rate_limit_caller_check.sql",
    );
    expect(source).toMatch(/auth\.uid\(\) IS DISTINCT FROM p_user_id/);
    expect(source).toContain("Forbidden: cannot consume rate limit for another user");
  });

  it("consume_rate_limit EXECUTE is locked to service_role", () => {
    const migrations = readAllMigrations();
    expect(migrations).toMatch(
      /REVOKE EXECUTE ON FUNCTION public\.consume_rate_limit\(UUID, TEXT, INTEGER, INTEGER\) FROM anon/,
    );
    expect(migrations).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.consume_rate_limit\(UUID, TEXT, INTEGER, INTEGER\) TO service_role/,
    );
  });

  it("authenticated-only mission/roadmap RPCs revoke PUBLIC and anon EXECUTE", () => {
    const source = readRepoFile(
      "supabase/migrations/20260706133000_security_rpc_execute_grants.sql",
    );
    for (const fn of [
      "submit_mission_for_evaluation(uuid)",
      "skip_mission_for_user(text, text)",
      "mark_roadmap_done(uuid)",
    ]) {
      expect(source).toMatch(
        new RegExp(
          `REVOKE EXECUTE ON FUNCTION public\\.${fn.replace(/[()]/g, "\\$&")} FROM PUBLIC, anon`,
        ),
      );
    }
  });

  it("assistant-runtime verifies JWT before rate limiting in the request handler", () => {
    const entry = readRepoFile("supabase/functions/assistant-runtime/index.ts");
    const handlerSrc = readRepoFile("supabase/functions/assistant-runtime/handler.ts");

    // Thin Deno entrypoint must delegate into the injectable handler.
    expect(entry).toMatch(
      /Deno\.serve\(\s*\(\s*req\s*\)\s*=>\s*handleAssistantRuntimeRequest\(\s*req\s*,\s*buildRealDeps\(\)\s*\)\s*\)/,
    );

    const handlerStart = handlerSrc.indexOf("export async function handleAssistantRuntimeRequest");
    expect(handlerStart).toBeGreaterThan(-1);
    const handler = handlerSrc.slice(handlerStart);

    const verifyIdx = handler.indexOf("deps.verifyJwt(req)");
    const authFailIdx = handler.indexOf("if (!auth.ok)");
    const unauthorizedIdx = handler.indexOf('"Unauthorized"');
    const bodyIdx = handler.indexOf("req.json()");
    const retrievalIdx = handler.indexOf("requestHasRetrievalResultsProperty(");
    const localeIdx = handler.indexOf("validateRuntimeLocale(");
    const queryIdx = handler.indexOf('typeof body.query === "string"');
    const rateNeedle = "deps.consumeRateLimit(";

    expect(verifyIdx).toBeGreaterThan(-1);
    expect(authFailIdx).toBeGreaterThan(verifyIdx);
    expect(unauthorizedIdx).toBeGreaterThan(authFailIdx);
    expect(bodyIdx).toBeGreaterThan(authFailIdx);
    expect(retrievalIdx).toBeGreaterThan(bodyIdx);
    expect(localeIdx).toBeGreaterThan(retrievalIdx);
    expect(queryIdx).toBeGreaterThan(localeIdx);

    // Every rate-limit call is after JWT + body/locale/query validation and
    // always uses the verified JWT user id (never a client-supplied id).
    let searchFrom = 0;
    let rateCount = 0;
    let firstRateIdx = -1;
    while (true) {
      const idx = handler.indexOf(rateNeedle, searchFrom);
      if (idx < 0) break;
      rateCount += 1;
      if (firstRateIdx < 0) firstRateIdx = idx;
      expect(idx).toBeGreaterThan(queryIdx);
      expect(idx).toBeGreaterThan(verifyIdx);
      expect(handler.slice(idx, idx + 80)).toMatch(/deps\.consumeRateLimit\(\s*auth\.userId\b/);
      searchFrom = idx + rateNeedle.length;
    }
    expect(rateCount).toBeGreaterThan(0);
    expect(firstRateIdx).toBeGreaterThan(verifyIdx);

    expect(entry).not.toMatch(/rate-limit disabled: missing supabase env[\s\S]*allowed: true/);
  });

  it("error-log rate limit fails closed on RPC errors", () => {
    const source = readRepoFile("src/lib/error-log.functions.ts");
    expect(source).toContain("Fail closed on RPC errors");
    expect(source).toMatch(/if \(error\) return false/);
    expect(source).not.toMatch(/if \(error\) return true/);
  });

  it("no src module statically imports client.server (service role)", () => {
    const libDir = path.join(REPO_ROOT, "src");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "__tests__") continue;
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;
        if (full.replace(/\\/g, "/").endsWith("integrations/supabase/client.server.ts")) {
          continue;
        }
        const text = readFileSync(full, "utf8");
        if (/^import\s+.*from\s+["']@\/integrations\/supabase\/client\.server["']/m.test(text)) {
          offenders.push(path.relative(REPO_ROOT, full));
        }
      }
    };
    walk(libDir);
    expect(offenders).toEqual([]);
  });
});
