import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  accessTokenCookieWriteDirective,
  clearAccessTokenCookie,
  extractAccessTokenFromHeaders,
  isCompactJwt,
  parseAccessTokenCookieHeader,
  syncAccessTokenCookie,
  writeAccessTokenCookie,
} from "@/lib/auth-access-token-cookie";
import {
  decideAdminBeforeLoad,
  loadProtectedAdminPayloadIfAuthorized,
  runProtectedAdminActionIfAuthorized,
} from "@/lib/admin-route-guard";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const VALID_JWT = "aaa.bbb.ccc";
const INVALID_JWT = "not-a-jwt";

function headerMap(init: Record<string, string | null>) {
  return {
    get(name: string) {
      const key = Object.keys(init).find(
        (k) => k.toLowerCase() === name.toLowerCase(),
      );
      return key ? init[key] : null;
    },
  };
}

function redirectTo(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const record = err as { to?: string; options?: { to?: string } };
  return record.options?.to ?? record.to;
}

describe("access token cookie / header extraction", () => {
  it("accepts only compact JWTs", () => {
    expect(isCompactJwt(VALID_JWT)).toBe(true);
    expect(isCompactJwt(INVALID_JWT)).toBe(false);
    expect(isCompactJwt(null)).toBe(false);
  });

  it("parses access token from cookie header", () => {
    const header = `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(VALID_JWT)}; path=/`;
    expect(parseAccessTokenCookieHeader(header)).toBe(VALID_JWT);
  });

  it("rejects malformed cookie token", () => {
    const header = `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(INVALID_JWT)}`;
    expect(parseAccessTokenCookieHeader(header)).toBeUndefined();
  });

  it("prefers Authorization Bearer over cookie", () => {
    const headers = headerMap({
      authorization: `Bearer ${VALID_JWT}`,
      cookie: `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent("xxx.yyy.zzz")}`,
    });
    expect(extractAccessTokenFromHeaders(headers)).toBe(VALID_JWT);
  });

  it("falls back to cookie when Authorization missing", () => {
    const headers = headerMap({
      cookie: `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(VALID_JWT)}`,
    });
    expect(extractAccessTokenFromHeaders(headers)).toBe(VALID_JWT);
  });

  it("returns undefined when identity missing", () => {
    expect(extractAccessTokenFromHeaders(headerMap({}))).toBeUndefined();
  });

  it("writes and clears document cookie", () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0`;
    writeAccessTokenCookie(VALID_JWT);
    expect(document.cookie).toContain(ACCESS_TOKEN_COOKIE_NAME);
    clearAccessTokenCookie();
    expect(parseAccessTokenCookieHeader(document.cookie)).toBeUndefined();
  });

  it("syncAccessTokenCookie clears on null", () => {
    writeAccessTokenCookie(VALID_JWT);
    syncAccessTokenCookie(null);
    expect(parseAccessTokenCookieHeader(document.cookie)).toBeUndefined();
  });

  it("write directive includes SameSite=Lax", () => {
    expect(accessTokenCookieWriteDirective(VALID_JWT)).toContain("SameSite=Lax");
  });
});

describe("admin-route-guard SSR contract (static)", () => {
  const guardSrc = readFileSync(
    path.join(REPO_ROOT, "src/lib/admin-route-guard.ts"),
    "utf8",
  );
  const adminFnsSrc = readFileSync(
    path.join(REPO_ROOT, "src/lib/admin.functions.ts"),
    "utf8",
  );
  const serverAuthSrc = readFileSync(
    path.join(REPO_ROOT, "src/lib/ssr-request-auth.server.ts"),
    "utf8",
  );

  it("does not skip authorization on SSR via window check", () => {
    expect(guardSrc).not.toMatch(
      /typeof window === ["']undefined["']\s*\)\s*return/,
    );
    expect(guardSrc).toContain("assertAdminAccess");
  });

  it("assertAdminAccess verifies request identity without client role claims", () => {
    expect(adminFnsSrc).toContain("resolveVerifiedRequestUser");
    expect(adminFnsSrc).toContain("has_role");
    expect(adminFnsSrc).not.toMatch(
      /assertAdminAccess[\s\S]{0,400}middleware\(\[requireSupabaseAuth\]\)/,
    );
  });

  it("server resolver uses getClaims and never trusts unverified JWT payloads alone for role", () => {
    expect(serverAuthSrc).toContain("getClaims");
    expect(serverAuthSrc).toContain("extractAccessTokenFromHeaders");
    expect(serverAuthSrc).not.toMatch(/app_metadata|user_metadata.*admin/);
  });

  it("admin data server-fns remain behind requireSupabaseAuth + assertAdmin", () => {
    expect(adminFnsSrc).toContain("getAdminOverview");
    expect(adminFnsSrc).toMatch(
      /getAdminOverview[\s\S]*?middleware\(\[requireSupabaseAuth\]\)[\s\S]*?assertAdmin/,
    );
  });
});

describe("decideAdminBeforeLoad fail-closed decisions", () => {
  it("denies missing/invalid identity before loader execution", () => {
    expect(decideAdminBeforeLoad({ status: "unauthorized" })).toEqual({
      type: "redirect",
      to: "/login",
    });
  });

  it("denies authenticated non-admin", () => {
    expect(
      decideAdminBeforeLoad({ status: "authorized", isAdmin: false }),
    ).toEqual({ type: "redirect", to: "/dashboard" });
  });

  it("allows authorized admin", () => {
    expect(
      decideAdminBeforeLoad({ status: "authorized", isAdmin: true }),
    ).toEqual({ type: "allow" });
  });
});

describe("protected loader / action denial boundaries", () => {
  it("does not return protected payload when identity missing", async () => {
    const load = vi.fn(async () => ({ secret: "admin-data" }));
    vi.spyOn(
      await import("@/lib/admin.functions"),
      "assertAdminAccess",
    ).mockImplementation(async () => {
      throw new Error("Unauthorized: No valid session");
    });

    await expect(loadProtectedAdminPayloadIfAuthorized(load)).rejects.toSatisfy(
      (err: unknown) => redirectTo(err) === "/login",
    );
    expect(load).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("does not return protected payload for non-admin", async () => {
    const load = vi.fn(async () => ({ secret: "admin-data" }));
    vi.spyOn(
      await import("@/lib/admin.functions"),
      "assertAdminAccess",
    ).mockResolvedValue({ isAdmin: false, userId: "user-1" });

    await expect(loadProtectedAdminPayloadIfAuthorized(load)).rejects.toSatisfy(
      (err: unknown) => redirectTo(err) === "/dashboard",
    );
    expect(load).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("returns payload only for authorized admin", async () => {
    const load = vi.fn(async () => ({ secret: "admin-data" }));
    vi.spyOn(
      await import("@/lib/admin.functions"),
      "assertAdminAccess",
    ).mockResolvedValue({ isAdmin: true, userId: "admin-1" });

    await expect(loadProtectedAdminPayloadIfAuthorized(load)).resolves.toEqual({
      secret: "admin-data",
    });
    expect(load).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });

  it("does not execute side effects when unauthorized", async () => {
    const sideEffect = vi.fn(async () => "mutated");
    vi.spyOn(
      await import("@/lib/admin.functions"),
      "assertAdminAccess",
    ).mockImplementation(async () => {
      throw new Error("Unauthorized: No valid session");
    });

    await expect(
      runProtectedAdminActionIfAuthorized(sideEffect),
    ).rejects.toThrow(/Unauthorized/);
    expect(sideEffect).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("does not execute side effects for non-admin", async () => {
    const sideEffect = vi.fn(async () => "mutated");
    vi.spyOn(
      await import("@/lib/admin.functions"),
      "assertAdminAccess",
    ).mockResolvedValue({ isAdmin: false, userId: "user-1" });

    await expect(
      runProtectedAdminActionIfAuthorized(sideEffect),
    ).rejects.toThrow(/Forbidden: admin role required/);
    expect(sideEffect).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe("client navigation defense in depth remains available", () => {
  it("AdminGate still exists as client-side secondary gate", () => {
    const gateSrc = readFileSync(
      path.join(REPO_ROOT, "src/components/AdminGate.tsx"),
      "utf8",
    );
    expect(gateSrc).toContain("isAdmin");
    expect(gateSrc).toContain("navigate");
  });

  it("representative admin routes still register requireAdminBeforeLoad", () => {
    for (const rel of [
      "src/routes/admin.index.tsx",
      "src/routes/system-state.tsx",
      "src/routes/assistant-runtime.tsx",
      "src/routes/build-logs.tsx",
      "src/routes/roadmap.index.tsx",
    ]) {
      const src = readFileSync(path.join(REPO_ROOT, rel), "utf8");
      expect(src).toContain("requireAdminBeforeLoad");
    }
  });
});
