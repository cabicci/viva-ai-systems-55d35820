import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AcademicAdjacentNavigation } from "./AcademicAdjacentNavigation";
import { getAcademicCopy } from "@/lib/academic-education/copy";
import type { SupportedLocale } from "@/lib/locale/types";
const state = vi.hoisted(() => ({ catalogue: vi.fn(), access: vi.fn() }));
vi.mock("@/lib/academic-education/client", () => ({
  academicCatalogue: state.catalogue,
  academicCanAccess: state.access,
}));
const fixture = [
  {
    id: "AC-BUS",
    title: "Course",
    lessons: [
      {
        id: "AC-BUS-M01-L01",
        title: "First runtime step",
        moduleId: "one",
        position: 1,
        introductory: true,
      },
      {
        id: "AC-BUS-M01-L02",
        title: "Current runtime step",
        moduleId: "one",
        position: 2,
        introductory: true,
      },
      {
        id: "AC-BUS-M01-L03",
        title: "Denied runtime step",
        moduleId: "one",
        position: 3,
        introductory: false,
      },
      {
        id: "AC-BUS-M02-L07",
        title: "Next allowed runtime step",
        moduleId: "two",
        position: 4,
        introductory: false,
      },
    ],
  },
];
beforeEach(() => {
  vi.clearAllMocks();
  state.catalogue.mockResolvedValue(fixture);
  state.access.mockImplementation(async (_course: string, id: string) => id !== "AC-BUS-M01-L03");
});
afterEach(cleanup);
function setup(
  locale: SupportedLocale = "en",
  lessonId = "AC-BUS-M01-L02",
  userId: string | null = "synthetic-user",
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AcademicAdjacentNavigation
        userId={userId ?? undefined}
        courseId="AC-BUS"
        lessonId={lessonId}
        locale={locale}
      />
    </QueryClientProvider>,
  );
}
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "uses %s runtime boundaries, read authorization and same-locale links",
  async (locale) => {
    setup(locale);
    const c = getAcademicCopy(locale);
    const nav = await screen.findByRole("navigation", { name: c.navigation });
    expect(nav).toHaveAttribute("dir", locale === "en" ? "ltr" : "rtl");
    expect(screen.getByRole("link", { name: new RegExp(c.previous) })).toHaveAttribute(
      "href",
      `/academic/learn/AC-BUS-M01-L01?locale=${locale}`,
    );
    expect(screen.getByRole("link", { name: new RegExp(c.next) })).toHaveAttribute(
      "href",
      `/academic/learn/AC-BUS-M02-L07?locale=${locale}`,
    );
    expect(screen.queryByText("Denied runtime step")).toBeNull();
    expect(state.catalogue).toHaveBeenCalledWith(locale);
    expect(state.access).toHaveBeenCalledWith("AC-BUS", "AC-BUS-M01-L03", locale);
  },
);
it("has no previous link at the runtime first step and no next link at the runtime last step", async () => {
  const first = setup("en", "AC-BUS-M01-L01");
  await screen.findByRole("navigation");
  expect(screen.queryByRole("link", { name: /Previous step/ })).toBeNull();
  first.unmount();
  setup("en", "AC-BUS-M02-L07");
  await screen.findByRole("navigation");
  expect(screen.queryByRole("link", { name: /Next step/ })).toBeNull();
});
it("does not fabricate links on a failed read and retries only the read flow", async () => {
  state.catalogue.mockRejectedValueOnce(Error("Synthetic offline"));
  setup();
  expect(await screen.findByText(getAcademicCopy("en").navigationUnavailable)).toBeTruthy();
  expect(screen.queryByRole("link")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByRole("navigation");
  expect(state.catalogue).toHaveBeenCalledTimes(2);
});
it("does not query navigation without an authenticated identity", async () => {
  const { container } = setup("en", "AC-BUS-M01-L02", null);
  await waitFor(() => expect(container).toBeEmptyDOMElement());
  expect(state.catalogue).not.toHaveBeenCalled();
  expect(state.access).not.toHaveBeenCalled();
});
