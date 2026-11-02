// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { sha256 } from "@/lib/card-assistant/corpus";
import { verifyPrivateCourseAssets } from "./assets.server";
const state = vi.hoisted(() => ({ download: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { storage: { from: () => ({ download: state.download }) } },
}));
beforeEach(() => {
  state.download.mockReset();
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
