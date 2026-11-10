import { describe, expect, it } from "vitest";
import { sanitizeErrorLog, sanitizeLogExtra, sanitizeLogText, sanitizeLogUrl } from "@/lib/error-log-sanitize";
const MARK = "SYNTHETIC_PRIVATE_MARKER";

describe("URL minimization", () => {
  it.each([
    [`https://user:${MARK}@example.test/lesson?code=${MARK}#${MARK}`, "https://example.test/lesson"],
    [`//user:${MARK}@example.test/lesson?token=${MARK}`, "//example.test/lesson"],
    [`/lesson?token=${MARK}#fragment`, "/lesson"],
    [`example.test/lesson?code=${MARK}`, "example.test/lesson"],
    [encodeURIComponent(`https://example.test/lesson?code=${MARK}`), "https://example.test/lesson"],
    [encodeURIComponent(encodeURIComponent(`https://example.test/lesson#${MARK}`)), "https://example.test/lesson"],
    [`https://example.test/lesson%3Ftoken%3D${MARK}`, "https://example.test/lesson"],
    [`https&#58;&#47;&#47;example.test/lesson?code=${MARK}`, "https://example.test/lesson"],
    [String.raw`https\u003a\u002f\u002fexample.test/lesson?code=${MARK}`, "https://example.test/lesson"],
  ])("removes URL context from %s", (input, expected) => {
    expect(sanitizeLogUrl(input)).toBe(expected);
    expect(sanitizeLogUrl(sanitizeLogUrl(input))).toBe(expected);
  });
  it.each([
    `https://[invalid/${MARK}?token=bad`, `not-a-url?token=${MARK}`, `https://example.test/?token=%ZZ${MARK}`,
    `https://user: ${MARK}@example.test/path`, `javascript:${MARK}`, `data:text/plain,${MARK}`,
    `https://example.test/\n${MARK}`, `https:\\example.test\?token=${MARK}`, `#${MARK}`, `?code=${MARK}`,
    encodeURIComponent(encodeURIComponent(encodeURIComponent(encodeURIComponent(`https://example.test/?code=${MARK}`)))),
  ])("fails closed for malformed/unsupported URL values: %s", input => {
    expect(sanitizeLogUrl(input)).toBe("[redacted URL]");
  });
  it("removes query and credentials from every URL in diagnostic text and stack", () => {
    const text = `Failed request https://user:${MARK}@example.test/lesson?code=${MARK} at https://cdn.test/app.js:2:3#${MARK}\nretry /login?token=${MARK}`;
    const clean = sanitizeLogText(text);
    expect(clean).not.toContain(MARK);
    expect(clean).toContain("Failed request https://example.test/lesson");
    expect(clean).toContain("https://cdn.test/app.js:2:3");
    expect(clean).toContain("retry /login");
  });
  it.each(["%20", "%22", "%27", "%0A", "%250A"])("does not leak a query value after decoding a delimiter %s", delimiter => {
    expect(sanitizeLogText(`Failure https://example.test/?token=${delimiter}${MARK}`)).not.toContain(MARK);
  });
  it.each([
    `Failed https://user:"${MARK}"@example.test/path?token=${MARK}`,
    `Failed https://example.test/?token="${MARK}"`,
    `Failed https://user: "${MARK}"@example.test/path`,
    `Failed https://example.test/?token= "${MARK}"`,
    `Failed //user: ${MARK}@example.test/path`,
    `Failed example.test/?token= ${MARK}`,
    `Failed /login?token= ${MARK}`,
  ])("does not expose credentials split by literal quotes or malformed whitespace: %s", text => {
    expect(sanitizeLogText(text)).not.toContain(MARK);
  });
  it("handles long URL-like tokens without preserving their query values", () => {
    const repeated = "http://?".repeat(1_250);
    expect(sanitizeLogText(repeated)).toBe("[redacted URL]");
    const dotted = "a.".repeat(5_000);
    const slashed = "/a".repeat(5_000);
    expect(sanitizeLogText(dotted, dotted.length)).toBe(dotted);
    expect(sanitizeLogText(`${slashed}?secret= ${MARK}`)).toBe("[redacted]");
  });
  it("redacts query values on a malformed bare hostname", () => {
    expect(sanitizeLogText(`Failure broken..example.test?token=${MARK}`)).not.toContain(MARK);
  });
  it.each([`Bearer ${MARK}`, `Basic ${MARK}`, encodeURIComponent(`Bearer ${MARK}`)])("redacts authorization values in prose: %s", text => {
    expect(sanitizeLogText(text)).not.toContain(MARK);
  });
  it("does not truncate a credential before it can be inspected", () => {
    expect(sanitizeLogText(`Failure https://user:${MARK}${"a".repeat(3000)}@example.test/path?secret=${MARK}`, 2000)).not.toContain(MARK);
    expect(sanitizeLogText(`https://${MARK}${"x".repeat(21000)}`)).toBe("[redacted]");
  });
});

describe("bounded structured diagnostics", () => {
  it.each(["password", "access_token", "refreshToken", "Authorization", "cookie", "set-cookie", "api_key", "clientSecret", "private-key", "credentials", "session_id", "supabaseServiceRoleKey", "signing_key", "JWT", "pwd", "%61ccess_token", String.raw`\u0070assword`])("redacts sensitive key %s", key => {
    expect(JSON.stringify(sanitizeLogExtra({ [key]: MARK }))).not.toContain(MARK);
  });
  it("sanitizes nested URLs, arrays and bearer values while preserving useful fields", () => {
    const clean = sanitizeLogExtra({ status: 503, retries: 2, retriable: true, cause: {
      requestUrl: `https://user:${MARK}@example.test/path?code=${MARK}`,
      headers: { Authorization: `Bearer ${MARK}`, "content-type": "application/json" },
      frames: [`at https://cdn.test/app.js:20:4?signature=${MARK}`, "TypeError in checkout"],
    } }) as any;
    expect(JSON.stringify(clean)).not.toContain(MARK);
    expect(clean.status).toBe(503); expect(clean.retriable).toBe(true);
    expect(clean.cause.requestUrl).toBe("https://example.test/path");
    expect(clean.cause.headers["content-type"]).toBe("application/json");
    expect(clean.cause.frames[1]).toBe("TypeError in checkout");
  });
  it("does not invoke getters or custom stringification", () => {
    let calls = 0;
    const input = { get unsafe() { calls++; throw new Error(MARK); }, custom: { toString() { calls++; return MARK; } } };
    const clean = sanitizeLogExtra(input);
    expect(calls).toBe(0); expect(JSON.stringify(clean)).not.toContain(MARK);
  });
  it("bounds cycles, nesting, arrays, key count and string lengths", () => {
    const cycle: any = { status: 503 }; cycle.self = cycle;
    expect(JSON.stringify(sanitizeLogExtra(cycle))).toContain("[circular]");
    let deep: any = { privateValue: MARK }; for (let i = 0; i < 10; i++) deep = { next: deep };
    expect(JSON.stringify(sanitizeLogExtra(deep))).not.toContain(MARK);
    const many = Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`field${i}`, { a: ["x".repeat(3000), MARK] }]));
    const clean = sanitizeLogExtra(many) as any;
    expect(Object.keys(clean).length).toBeLessThanOrEqual(21);
    expect(JSON.stringify(clean).length).toBeLessThan(90_000);
    const array = sanitizeLogExtra(Array(1000).fill(42)) as any[];
    expect(array).toHaveLength(21);
  });
  it("fails closed for hostile proxies and ignores prototype setters", () => {
    expect(sanitizeLogExtra(new Proxy({}, { ownKeys() { throw new Error(MARK); } }))).toBe("[redacted]");
    const clean = sanitizeLogExtra(JSON.parse('{"__proto__":{"polluted":true},"status":500}')) as any;
    expect(clean.status).toBe(500); expect(Object.keys(clean)).not.toContain("__proto__");
  });
  it("sanitizes all submitted fields and preserves ordinary diagnosis", () => {
    const input = { scope: `fetch https://example.test/?token=${MARK}`, message: "TypeError: cannot read property", stack: `Error\n at https://cdn.test/app.js:20:2?key=${MARK}`, url: `https://example.test/lesson#${MARK}`, userAgent: `TestAgent Bearer ${MARK}`, release: `release https://example.test/?key=${MARK}`, extra: { status: 500 } };
    const clean = sanitizeErrorLog(input);
    expect(JSON.stringify(clean)).not.toContain(MARK);
    expect(clean.message).toBe(input.message); expect(clean.extra).toEqual({ status: 500 });
    expect(sanitizeErrorLog(clean)).toEqual(clean);
    expect(sanitizeErrorLog({ scope: "", message: "" }).message).toBe("[unavailable]");
  });
});
