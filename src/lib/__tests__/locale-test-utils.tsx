import { render, waitFor, type RenderResult } from "@testing-library/react";
import { expect, vi } from "vitest";
import { LocalePackageLessonRenderer } from "@/components/locale/LocalePackageLessonRenderer";
import { BUNNY_VIDEO_GUIDS } from "@/lib/bunny-videos";
import { LocaleProvider } from "@/lib/locale/locale-context";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

/** Temporarily remove a composite mapping so missing-video UI can be asserted after 300/300 completion. */
export function withAbsentLocalizedVideoMapping<T>(
  lessonId: string,
  locale: string,
  run: () => T | Promise<T>,
): T | Promise<T> {
  const key = `${lessonId}__${locale}`;
  const prior = BUNNY_VIDEO_GUIDS[key];
  delete BUNNY_VIDEO_GUIDS[key];
  const restore = () => {
    if (prior === undefined) {
      delete BUNNY_VIDEO_GUIDS[key];
    } else {
      BUNNY_VIDEO_GUIDS[key] = prior;
    }
  };
  try {
    const result = run();
    if (result && typeof (result as Promise<T>).then === "function") {
      return (result as Promise<T>).finally(restore);
    }
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to?: string;
  }) => (
    <a href={typeof to === "string" ? to : "#"} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ navigate: vi.fn(), history: {} }),
  useNavigate: () => vi.fn(),
  createLink: (component: unknown) => component,
}));

export async function renderLocalizedLesson(
  pkg: LocalizedLessonPackage,
): Promise<RenderResult> {
  const view = render(
    <LocaleProvider effectiveLocale={pkg.locale}>
      <LocalePackageLessonRenderer pkg={pkg} />
    </LocaleProvider>,
  );

  await waitFor(
    () => {
      expect(view.container.querySelector("article")).not.toBeNull();
    },
    { timeout: 5000 },
  );

  return view;
}

export async function renderLocalizedLessonWithoutVideo(
  pkg: LocalizedLessonPackage,
): Promise<RenderResult> {
  return withAbsentLocalizedVideoMapping(pkg.lessonId, pkg.locale, async () => {
    const view = await renderLocalizedLesson(pkg);
    await waitFor(() => {
      expect(
        view.container.textContent?.includes("Optional video") ||
          view.container.textContent?.includes("Short on time?"),
      ).toBe(true);
    });
    return view;
  });
}
