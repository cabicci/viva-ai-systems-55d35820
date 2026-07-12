import { render, waitFor, type RenderResult } from "@testing-library/react";
import { expect, vi } from "vitest";
import { LocalePackageLessonRenderer } from "@/components/locale/LocalePackageLessonRenderer";
import { LocaleProvider } from "@/lib/locale/locale-context";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

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
  const view = await renderLocalizedLesson(pkg);
  await waitFor(() => {
    expect(
      view.container.textContent?.includes("Optional video") ||
        view.container.textContent?.includes("Short on time?"),
    ).toBe(true);
  });
  return view;
}
