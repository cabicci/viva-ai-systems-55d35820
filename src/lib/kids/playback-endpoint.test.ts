import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { handleKidsPlayback } from "../../../supabase/functions/kids-playback/handler";
import {
  parseKidsPlaybackRequest,
  signedKidsEmbedUrl,
} from "../../../supabase/functions/kids-playback/token";

const profileId = "11111111-1111-4111-8111-111111111111";
const videoId = "22222222-2222-4222-8222-222222222222";
const body = { profileId, levelId: "level-1", lessonNumber: 1, locale: "en" };
const env = (name: string) =>
  ({
    SUPABASE_URL: "https://db.example",
    SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-key",
    BUNNY_KIDS_STREAM_TOKEN_KEY: "token-key",
  })[name as "SUPABASE_URL"];

function request(value: unknown = body, bearer = "Bearer parent-token") {
  return new Request("https://db.example/functions/v1/kids-playback", {
    method: "POST",
    headers: { Authorization: bearer, Origin: "https://masaarat.ai" },
    body: JSON.stringify(value),
  });
}
function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status });
}

describe("Kids playback authorization boundary", () => {
  it("rejects malformed lesson and unauthenticated requests before provider calls", async () => {
    expect(parseKidsPlaybackRequest({ ...body, lessonNumber: 13 })).toBeNull();
    expect(parseKidsPlaybackRequest({ ...body, locale: "other" })).toBeNull();
    expect(parseKidsPlaybackRequest({ ...body, profileId: "../other" })).toBeNull();
    const fetcher = vi.fn();
    const noAuth = await handleKidsPlayback(request(body, ""), env, fetcher as typeof fetch);
    expect(noAuth.status).toBe(401);
    const malformed = await handleKidsPlayback(
      request({ ...body, lessonNumber: 13 }),
      env,
      fetcher as typeof fetch,
    );
    expect(malformed.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fails closed when the signing key is absent", async () => {
    const fetcher = vi.fn();
    const response = await handleKidsPlayback(
      request(),
      (name) => (name === "BUNNY_KIDS_STREAM_TOKEN_KEY" ? undefined : env(name)),
      fetcher as typeof fetch,
    );
    expect(response.status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses the caller JWT for the access RPC and never looks up media on denial", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(json({ id: "parent-id" }))
      .mockResolvedValueOnce(json(false));
    const response = await handleKidsPlayback(request(), env, fetcher as typeof fetch);
    expect(response.status).toBe(403);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe("Bearer parent-token");
    expect(fetcher.mock.calls[1][1].headers.apikey).toBe("anon-key");
    expect(JSON.parse(fetcher.mock.calls[1][1].body).requested_profile).toBe(profileId);
  });

  it("returns a signed short-lived embed only after access and exact media lookup", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(json({ id: "parent-id" }))
      .mockResolvedValueOnce(json(true))
      .mockResolvedValueOnce(json([{ video_guid: videoId }]));
    const response = await handleKidsPlayback(request(), env, fetcher as typeof fetch);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const result = (await response.json()) as { embedUrl: string; expires: number };
    const expected = createHash("sha256")
      .update("token-key" + videoId + result.expires)
      .digest("hex");
    expect(result.embedUrl).toBe(
      `https://player.mediadelivery.net/embed/761387/${videoId}?token=${expected}&expires=${result.expires}`,
    );
    expect(result.expires - Math.floor(Date.now() / 1000)).toBeGreaterThanOrEqual(299);
    expect(fetcher.mock.calls[2][1].headers.Authorization).toBe("Bearer service-key");
    expect(String(fetcher.mock.calls[2][0])).toContain("select=video_guid");
    expect(await signedKidsEmbedUrl(videoId, "token-key", result.expires)).toBe(result.embedUrl);
  });
});
