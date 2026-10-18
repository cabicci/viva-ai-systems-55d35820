import { expect, it, vi } from "vitest";
import { academicAdjacentLessons } from "./adjacent-lessons";
import type { AcademicCourse } from "./types";
const lesson = (id: string, position: number) => ({
  id,
  title: id,
  moduleId: "module",
  position,
  introductory: false,
});
const courses: AcademicCourse[] = [
  {
    id: "course",
    title: "Course",
    lessons: [
      lesson("first", 30),
      lesson("locked", 10),
      lesson("current", 20),
      lesson("next", 40),
      lesson("last", 50),
    ],
  },
];
it("uses the actual runtime list and skips denied candidates without guessing a numeric order", async () => {
  const access = vi.fn(async (id: string) => id !== "locked");
  const result = await academicAdjacentLessons(courses, "course", "current", access);
  expect(result.previous?.id).toBe("first");
  expect(result.next?.id).toBe("next");
  expect(access.mock.calls.map(([id]) => id)).not.toContain("current");
  expect(access.mock.calls.map(([id]) => id)).not.toContain("last");
});
it("respects first and last accessible boundaries", async () => {
  const access = async () => true;
  expect(
    (await academicAdjacentLessons(courses, "course", "first", access)).previous,
  ).toBeUndefined();
  expect((await academicAdjacentLessons(courses, "course", "last", access)).next).toBeUndefined();
  const denied = await academicAdjacentLessons(courses, "course", "current", async () => false);
  expect(denied).toEqual({ previous: undefined, next: undefined });
});
it("does not infer another course or a position for an absent current lesson", async () => {
  const access = vi.fn(async () => true);
  expect(await academicAdjacentLessons(courses, "other", "current", access)).toEqual({});
  expect(await academicAdjacentLessons(courses, "course", "absent", access)).toEqual({});
  expect(access).not.toHaveBeenCalled();
});
it("fails closed on ambiguous duplicate identities and propagates authorization-read errors", async () => {
  const access = vi.fn(async () => true);
  expect(
    await academicAdjacentLessons(
      [{ ...courses[0], lessons: [lesson("current", 1), lesson("current", 2)] }],
      "course",
      "current",
      access,
    ),
  ).toEqual({});
  expect(access).not.toHaveBeenCalled();
  await expect(
    academicAdjacentLessons(courses, "course", "current", async () => {
      throw Error("Read unavailable");
    }),
  ).rejects.toThrow("Read unavailable");
});
