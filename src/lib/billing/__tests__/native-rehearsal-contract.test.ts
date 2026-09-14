import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDisposableCredentials,
  isExpectedOrdinaryAuthDenial,
  type RehearsalHttpResult,
} from "../../../../scripts/billing/native-rehearsal-contract";

function denial(status: number, code: string, message: string): RehearsalHttpResult {
  const json = { code, message };
  return { status, json, text: JSON.stringify(json) };
}

describe("native rehearsal disposable credentials", () => {
  it("creates unique strong-shaped credentials without the legacy fixed password", () => {
    const firstNonces = ["AAAAAAAAAAAAAAAAAAAAAAAA", "BBBBBBBBBBBBBBBBBBBBBBBB"];
    const secondNonces = ["CCCCCCCCCCCCCCCCCCCCCCCC", "DDDDDDDDDDDDDDDDDDDDDDDD"];
    const first = createDisposableCredentials(() => firstNonces.shift()!);
    const second = createDisposableCredentials(() => secondNonces.shift()!);

    expect(first.email).not.toBe(second.email);
    expect(first.password).not.toBe(second.password);
    expect(first.password).not.toContain("AAAAAAAAAAAAAAAAAAAAAAAA");
    expect(second.password).not.toContain("CCCCCCCCCCCCCCCCCCCCCCCC");

    const generatedFirst = createDisposableCredentials();
    const generatedSecond = createDisposableCredentials();
    expect(generatedFirst.email).not.toBe(generatedSecond.email);
    expect(generatedFirst.password).not.toBe(generatedSecond.password);

    expect(first.password).toMatch(/[A-Z]/);
    expect(first.password).toMatch(/[a-z]/);
    expect(first.password).toMatch(/[0-9]/);
    expect(first.password).toMatch(/[^A-Za-z0-9]/);
    const source = readFileSync(
      resolve(process.cwd(), "scripts/billing/native-rehearsal.ts"),
      "utf8",
    );
    expect(source).not.toContain("NativeReh-Test-Only-1");
  });
});

describe("native rehearsal ordinary-auth denial proof", () => {
  it("accepts the exact gate error when PostgreSQL reports P0001 over HTTP 400", () => {
    expect(isExpectedOrdinaryAuthDenial(denial(400, "P0001", "QUOTA_SERVICE_ONLY"))).toBe(true);
  });

  it("accepts the privilege-denial form emitted before the gate runs", () => {
    expect(
      isExpectedOrdinaryAuthDenial(
        denial(403, "42501", "permission denied for function reserve_learner_ai_access"),
      ),
    ).toBe(true);
    expect(isExpectedOrdinaryAuthDenial(denial(403, "42501", "QUOTA_SERVICE_ONLY"))).toBe(true);
  });
  it("rejects statuses the old broad predicate falsely accepted", () => {
    const oldPredicate = (status: number) => status === 401 || status === 403 || status >= 400;
    expect(oldPredicate(404)).toBe(true);
    expect(oldPredicate(500)).toBe(true);

    expect(isExpectedOrdinaryAuthDenial(denial(404, "PGRST202", "function missing"))).toBe(false);
    expect(isExpectedOrdinaryAuthDenial(denial(500, "XX000", "internal error"))).toBe(false);
  });

  it("rejects bad JWTs, unrelated errors, and malformed responses", () => {
    expect(isExpectedOrdinaryAuthDenial(denial(401, "PGRST301", "JWT expired"))).toBe(false);
    expect(isExpectedOrdinaryAuthDenial(denial(400, "P0001", "OTHER_FAILURE"))).toBe(false);
    expect(
      isExpectedOrdinaryAuthDenial(
        denial(403, "42501", "permission denied for function reserve_learner_ai_access_admin"),
      ),
    ).toBe(false);
    expect(
      isExpectedOrdinaryAuthDenial(
        denial(403, "42501", "wrapped: permission denied for function reserve_learner_ai_access"),
      ),
    ).toBe(false);
    expect(
      isExpectedOrdinaryAuthDenial(
        denial(403, "42501", "permission denied for function evaluate_access"),
      ),
    ).toBe(false);
    expect(isExpectedOrdinaryAuthDenial({ status: 403, json: null, text: "" })).toBe(false);
    expect(isExpectedOrdinaryAuthDenial({ status: 0, json: null, text: "transport failure" })).toBe(
      false,
    );
  });
});
