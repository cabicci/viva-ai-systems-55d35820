// @vitest-environment node
import { createRequire } from "node:module";
import { createElement } from "react";
import { render, toPlainText } from "@react-email/render";
import { serialize } from "seroval";
import { describe, expect, it } from "vitest";

describe("Patched dependency security and existing consumer contracts", () => {
  it("ignores a typed array's attacker-controlled constructor during serialization", () => {
    const data = new Uint8Array([1, 2]);
    Object.defineProperty(data, "constructor", { value: { name: "UNTRUSTED_TYPED_CONSTRUCTOR" } });
    const output = serialize(data);
    expect(output).toContain("Uint8Array");
    expect(output).not.toContain("UNTRUSTED_TYPED_CONSTRUCTOR");
  });

  it("escapes HTML-sensitive RegExp sources in SSR serialization", () => {
    const output = serialize(new RegExp("</script><script>untrusted</script>"));
    expect(output).toContain("RegExp");
    expect(output).not.toContain("<");
  });

  it("preserves old default ESM and named CJS glob consumers on the fixed matcher", async () => {
    const modern = await import("minimatch");
    const legacy = createRequire(import.meta.url)("minimatch");
    for (const candidate of [modern.default, legacy]) {
      const pattern = new candidate.Minimatch("**/*.{ts,tsx}", { dot: true });
      expect(pattern.match("src/.routes/lesson.tsx")).toBe(true);
      expect(pattern.match("src/lesson.test.js")).toBe(false);
    }
    expect(modern.minimatch("src/lesson.ts", "**/*.ts")).toBe(true);
    // These installed consumers import the legacy ESM default unconditionally.
    await expect(import("@eslint/config-array")).resolves.toHaveProperty("ConfigArray");
    await expect(import("@eslint/eslintrc")).resolves.toHaveProperty("FlatCompat");
  });

  it("keeps actual ESLint file selection and rule execution working", async () => {
    const { ESLint } = createRequire(import.meta.url)("eslint");
    const engine = new ESLint({ overrideConfigFile: true, overrideConfig: [
      { ignores: ["build/**"] },
      { files: ["**/*.js"], rules: { "no-unused-vars": "error" } },
    ] });
    const results = await engine.lintText("const unused = 1;", { filePath: "src/security-compat.js" });
    expect(results[0].messages.map((message: { ruleId: string }) => message.ruleId)).toContain("no-unused-vars");
    expect(await engine.isPathIgnored("build/ignored.js")).toBe(true);
  });

  it("keeps React Email HTML/plain text, Arabic text and links intact without sending mail", async () => {
    const html = await render(createElement("html", null, createElement("body", null,
      createElement("p", null, "أهلاً يا نور"),
      createElement("a", { href: "https://example.invalid/lesson?a=1&b=2" }, "Your lesson"),
    )));
    const text = toPlainText(html);
    expect(html).toContain("أهلاً يا نور");
    expect(text).toContain("أهلاً يا نور");
    expect(text).toContain("Your lesson");
    expect(text).toContain("https://example.invalid/lesson?a=1&b=2");
  });
});
