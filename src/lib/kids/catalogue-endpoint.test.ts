import { describe, expect, it, vi } from "vitest";
import { handleKidsCatalogue } from "../../../supabase/functions/kids-catalogue/handler";

const request = () =>
  new Request("https://example.test/kids-catalogue", {
    method: "POST",
    headers: { Origin: "https://masaarat.ai", "Content-Type": "application/json" },
    body: JSON.stringify({ levelId: "level-1", locale: "en" }),
  });
const env = (name: string) =>
  name === "SUPABASE_URL"
    ? "https://db.example.test"
    : name === "SUPABASE_SERVICE_ROLE_KEY"
      ? "private-test-key"
      : undefined;

describe("public Kids catalogue", () => {
  it("returns only approved, digest-matched lesson names to a visitor", async () => {
    const raw = JSON.stringify({
      level: "level-1",
      locale: "en",
      title: "A lesson",
      quiz: "private answer",
    });
    const sha = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");
    const fetcher = vi.fn(async (value: URL) => {
      if (value.pathname.endsWith("kids_public_launch_open")) return Response.json(true);
      if (value.pathname.endsWith("kids_content_approvals"))
        return Response.json(
          Array.from({ length: 12 }, (_, index) => ({
            lesson_number: index + 1,
            approved_sha256: sha,
          })),
        );
      return new Response(raw, { status: 200, headers: { "Content-Type": "application/json" } });
    }) as unknown as typeof fetch;
    const response = await handleKidsCatalogue(request(), env, fetcher);
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://masaarat.ai");
    const body = await response.text();
    expect(JSON.parse(body).titles).toHaveLength(12);
    expect(body).toContain('"title":"A lesson"');
    expect(body).not.toContain("private answer");
    expect(body).not.toContain("private-test-key");
  });

  it("does not read private lessons when the launch gate is closed", async () => {
    const fetcher = vi.fn(async () => Response.json(false)) as unknown as typeof fetch;
    const response = await handleKidsCatalogue(request(), env, fetcher);
    expect(response.status).toBe(503);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
