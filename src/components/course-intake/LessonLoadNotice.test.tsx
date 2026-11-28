import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { curriculumCommand, LessonReadUnavailable } from "@/lib/course-system/intake/client";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import { LessonLoadNotice } from "./LessonLoadNotice";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
afterEach(() => {
  cleanup();
  rpc.mockReset();
});

it.each([
  [500, "57014"],
  [0, ""],
  [408, ""],
  [429, ""],
  [503, ""],
])("offers a lesson read retry after HTTP %i", async (status, code) => {
  rpc.mockResolvedValueOnce({ status, error: { code, message: "Read failed" } });
  const error = await curriculumCommand("lesson", {}).catch((reason: Error) => reason);
  expect(error).toBeInstanceOf(LessonReadUnavailable);
  const retry = vi.fn();
  render(
    <LessonLoadNotice
      locale="ar-EG"
      loading={false}
      error={error as Error}
      retry={retry}
      plansUrl="/pricing"
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain(intakeCopy("ar-EG").lessonReadFailed);
  expect(screen.queryByRole("link")).toBeNull();
  expect(retry).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button"));
  expect(retry).toHaveBeenCalledOnce();
});

it("retains the family plans link after an access denial and waits during authentication", async () => {
  rpc.mockResolvedValueOnce({
    status: 403,
    error: { code: "42501", message: "CURRICULUM_ACCESS_REQUIRED" },
  });
  const error = await curriculumCommand("lesson", {}).catch((reason: Error) => reason);
  const props = {
    locale: "en" as const,
    error: error as Error,
    retry: vi.fn(),
    plansUrl: "/kids/pricing?locale=en",
  };
  const { rerender } = render(<LessonLoadNotice {...props} loading />);
  expect(screen.getByRole("status")).toBeTruthy();
  expect(screen.queryByRole("link")).toBeNull();
  rerender(<LessonLoadNotice {...props} loading={false} />);
  expect(screen.getByRole("link").getAttribute("href")).toBe(props.plansUrl);
  expect(screen.queryByRole("button")).toBeNull();
});

it("keeps a submission timeout out of the lesson read retry path", async () => {
  rpc.mockResolvedValueOnce({
    status: 500,
    error: { code: "57014", message: "Request timed out" },
  });
  const result = curriculumCommand("submit", {});
  await expect(result).rejects.toThrow("Request timed out");
  await expect(result).rejects.not.toBeInstanceOf(LessonReadUnavailable);
  expect(rpc).toHaveBeenCalledOnce();
});
