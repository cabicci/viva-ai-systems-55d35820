// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { sha256 } from "@/lib/card-assistant/corpus";
import { storeReviewedCourseAsset, verifyPrivateCourseAssets } from "./assets.server";
const state = vi.hoisted(() => ({ download: vi.fn(), upload: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { storage: { from: () => ({ download: state.download, upload: state.upload }) } },
}));
beforeEach(() => {
  state.download.mockReset();
  state.upload.mockReset();
});
it("stores only edition-matched bytes and safely reconciles an immutable retry", async () => {
  const file = new Blob(["%PDF-1.7\nApproved material"]);
  const digest = await sha256(new Uint8Array(await file.arrayBuffer()));
  const asset = {
    id: "sheet",
    sha256: digest,
    storage: { bucket: "academic-downloads" as const, path: "ai/fixture/sheet.pdf" },
  };
  await expect(storeReviewedCourseAsset(asset, new Blob(["wrong"]))).rejects.toThrow(
    "ASSET_CHANGED",
  );
  expect(state.upload).not.toHaveBeenCalled();
  state.upload
    .mockResolvedValueOnce({ error: null })
    .mockResolvedValue({ error: new Error("Already exists") });
  await expect(storeReviewedCourseAsset(asset, file)).resolves.toEqual({ sha256: digest });
  expect(state.upload).toHaveBeenCalledWith(asset.storage.path, expect.any(Uint8Array), {
    contentType: "application/pdf",
    upsert: false,
  });
  state.download
    .mockResolvedValueOnce({ error: null, data: file })
    .mockResolvedValueOnce({ error: null, data: new Blob(["different"]) });
  await expect(storeReviewedCourseAsset(asset, file)).resolves.toEqual({ sha256: digest });
  await expect(storeReviewedCourseAsset(asset, file)).rejects.toThrow("ASSET_UNAVAILABLE");
});
it("verifies exact protected file bytes and preserves the original hosted video identity", async () => {
  const bytes = new TextEncoder().encode("%PDF-1.7\nReviewed worksheet");
  const hash = await sha256(bytes);
  state.download.mockResolvedValue({
    data: new Blob([bytes], { type: "application/pdf" }),
    error: null,
  });
  expect(
    await verifyPrivateCourseAssets([
      {
        id: "sheet",
        sha256: hash,
        storage: { bucket: "technical-downloads", path: "technical/course/sheet.pdf" },
      },
      { id: "video", sha256: "a".repeat(64) },
    ]),
  ).toEqual([{ id: "sheet", sha256: hash }]);
  expect(state.download).toHaveBeenCalledExactlyOnceWith("technical/course/sheet.pdf");
});
it("blocks a missing or changed worksheet instead of activating a broken course", async () => {
  const asset = {
    id: "sheet",
    sha256: "a".repeat(64),
    storage: { bucket: "academic-downloads" as const, path: "academic/course/sheet.pdf" },
  };
  state.download
    .mockResolvedValueOnce({ data: null, error: new Error("Missing") })
    .mockResolvedValueOnce({ data: new Blob(["different bytes"]), error: null });
  await expect(verifyPrivateCourseAssets([asset])).rejects.toThrow("ASSET_UNAVAILABLE");
  await expect(verifyPrivateCourseAssets([asset])).rejects.toThrow("ASSET_UNAVAILABLE");
});

it("checks the container and exact digest of a privately deposited WAV", async () => {
  const pcm = new Uint8Array(46);
  pcm.set(new TextEncoder().encode("RIFF"), 0);
  pcm.set(new TextEncoder().encode("WAVE"), 8);
  const asset = {
    id: "clip-1",
    sha256: await sha256(pcm),
    storage: { bucket: "academic-downloads" as const, path: "ai/audio-stories/clip-1.wav" },
  };
  state.upload.mockResolvedValueOnce({ error: null });
  await storeReviewedCourseAsset(asset, new Blob([pcm]));
  expect(state.upload).toHaveBeenCalledWith(asset.storage.path, expect.any(Uint8Array), {
    contentType: "audio/wav",
    upsert: false,
  });
  const invalid = new Uint8Array(46);
  await expect(
    storeReviewedCourseAsset({ ...asset, sha256: await sha256(invalid) }, new Blob([invalid])),
  ).rejects.toThrow("ASSET_UNAVAILABLE");
});
