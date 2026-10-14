import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@react-email/render";
const state = vi.hoisted(() => ({ options: null as any, rpc: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (config: unknown) => config }));
vi.mock("@lovable.dev/email-js", () => ({
  createAuthEmailHandler: (options: unknown) => {
    state.options = options;
    return () => new Response();
  },
}));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: state.rpc } }));
import { Route } from "../../routes/lovable/email/auth/webhook";
beforeEach(() => state.rpc.mockReset());
describe("Auth template dispatch", () => {
  it.each(["invite", "magiclink", "email_change", "reauthentication"])(
    "resolves %s using the SDK recipient and preserves verification data",
    async (kind) => {
      state.rpc.mockResolvedValue({
        data: [{ full_name: "Learner", preferred_locale: "en" }],
        error: null,
      });
      (Route as any).server.handlers.POST({
        request: new Request("https://example.test", { method: "POST" }),
      });
      const url = "https://auth.example.test/verify?token=original&type=" + kind;
      const content = await state.options.emails[kind]({
        email: "recipient@example.test",
        old_email: "old@example.test",
        new_email: "new@example.test",
        url,
        token: "654321",
      });
      expect(state.rpc).toHaveBeenCalledExactlyOnceWith("auth_signup_email_profile", {
        p_email: "recipient@example.test",
      });
      const html = await render(content.element as React.ReactElement);
      expect(html).toContain('lang="en"');
      expect(content.subject).not.toMatch(/[\u0600-\u06ff]/);
      expect(html).toContain(kind === "reauthentication" ? "654321" : url.replaceAll("&", "&amp;"));
    },
  );
  it("keeps a bilingual fallback instead of dropping mail when profile lookup fails", async () => {
    state.rpc.mockResolvedValue({ data: null, error: new Error("unavailable") });
    (Route as any).server.handlers.POST({
      request: new Request("https://example.test", { method: "POST" }),
    });
    const content = await state.options.emails.magiclink({
      email: "recipient@example.test",
      url: "https://auth.example.test/verify",
    });
    expect(content.subject).toContain("Your login link");
    expect(content.subject).toContain("رابط تسجيل الدخول");
  });
});
