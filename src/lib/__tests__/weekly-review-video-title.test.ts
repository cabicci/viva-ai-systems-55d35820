// @vitest-environment node
import { expect, it, vi } from "vitest";
import {
  reviseWeeklyReviewVideoTitle,
  WEEKLY_REVIEW_VIDEO,
} from "../../../scripts/media/audit-60-video-title.mjs";
const original = {
  videoLibraryId: 670679,
  guid: WEEKLY_REVIEW_VIDEO.videoId,
  title: WEEKLY_REVIEW_VIDEO.oldTitle,
  length: 167,
  status: 4,
  width: 1280,
  height: 720,
  collectionId: "unchanged",
  thumbnailFileName: "original.jpg",
  chapters: [{ title: "Session", start: 0, end: 20 }],
};
const response = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
it("checks exact metadata without sending a write", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(original));
  const result = await reviseWeeklyReviewVideoTitle({
    apiKey: "synthetic-only",
    fetchImpl: fetcher,
  });
  expect(result).toMatchObject({
    applied: false,
    beforeTitle: WEEKLY_REVIEW_VIDEO.oldTitle,
    durationSeconds: 167,
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][1]?.method).toBe("GET");
  expect(JSON.stringify(result)).not.toContain("synthetic-only");
});
it("sends only the title field and verifies unchanged identity/media metadata", async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(response(original))
    .mockResolvedValueOnce(response({ success: true }))
    .mockResolvedValueOnce(response({ ...original, title: WEEKLY_REVIEW_VIDEO.newTitle }));
  expect(
    await reviseWeeklyReviewVideoTitle({
      apiKey: "synthetic-only",
      apply: true,
      fetchImpl: fetcher,
    }),
  ).toMatchObject({ applied: true, nonTitleMetadataPreserved: true, durationSeconds: 167 });
  expect(fetcher.mock.calls.map(([, options]) => options?.method)).toEqual(["GET", "POST", "GET"]);
  expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toEqual({
    title: WEEKLY_REVIEW_VIDEO.newTitle,
  });
  expect(
    fetcher.mock.calls.every(
      ([url]) =>
        url === `https://video.bunnycdn.com/library/670679/videos/${WEEKLY_REVIEW_VIDEO.videoId}`,
    ),
  ).toBe(true);
});
it("is idempotent and never overwrites an independently changed title", async () => {
  const done = vi
    .fn<typeof fetch>()
    .mockResolvedValue(response({ ...original, title: WEEKLY_REVIEW_VIDEO.newTitle }));
  expect(
    await reviseWeeklyReviewVideoTitle({ apiKey: "synthetic-only", apply: true, fetchImpl: done }),
  ).toMatchObject({ alreadyCorrect: true, applied: false });
  expect(done).toHaveBeenCalledTimes(1);
  const changed = vi
    .fn<typeof fetch>()
    .mockResolvedValue(response({ ...original, title: "Independent edit" }));
  await expect(
    reviseWeeklyReviewVideoTitle({ apiKey: "synthetic-only", apply: true, fetchImpl: changed }),
  ).rejects.toThrow(/changed since review/);
  expect(changed).toHaveBeenCalledTimes(1);
});
it("refuses mismatched identity and detects any non-title metadata mutation", async () => {
  const wrong = vi
    .fn<typeof fetch>()
    .mockResolvedValue(response({ ...original, guid: "another-video" }));
  await expect(
    reviseWeeklyReviewVideoTitle({ apiKey: "synthetic-only", apply: true, fetchImpl: wrong }),
  ).rejects.toThrow(/identity differs/);
  const altered = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(response(original))
    .mockResolvedValueOnce(response({ success: true }))
    .mockResolvedValueOnce(
      response({ ...original, title: WEEKLY_REVIEW_VIDEO.newTitle, length: 999 }),
    );
  await expect(
    reviseWeeklyReviewVideoTitle({ apiKey: "synthetic-only", apply: true, fetchImpl: altered }),
  ).rejects.toThrow(/non-title field changed: length/);
});
it("requires an existing server credential before any request", async () => {
  const fetcher = vi.fn<typeof fetch>();
  await expect(reviseWeeklyReviewVideoTitle({ fetchImpl: fetcher })).rejects.toThrow(
    /existing approved server/,
  );
  expect(fetcher).not.toHaveBeenCalled();
});
