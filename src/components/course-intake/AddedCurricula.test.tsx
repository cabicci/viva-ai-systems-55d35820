import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { AddedCurricula } from "./AddedCurricula";
const state = vi.hoisted(() => ({ catalogue: vi.fn(), locale: "en" }));
vi.mock("@/lib/course-system/intake/client", () => ({ curriculumCatalogue: state.catalogue }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: state.locale }) }));
const view = (
  area: "technical" | "academic" | "kids" = "technical",
  levelId?: "level-1" | "level-2" | "level-3",
) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AddedCurricula area={area} levelId={levelId} />
    </QueryClientProvider>,
  );
beforeEach(() => {
  state.catalogue.mockReset();
  state.locale = "en";
});
it("adds a ready course to its actual learning area with its own hierarchy", async () => {
  state.catalogue.mockResolvedValue([
    {
      id: "course-one",
      area: "technical",
      title: "Reviewed course",
      version: "a".repeat(64),
      stations: [{ id: "s1", title: "Station", steps: [{ id: "l1", title: "Lesson" }] }],
    },
  ]);
  view();
  expect(await screen.findByRole("link", { name: /Reviewed course/ })).toHaveAttribute(
    "href",
    "/courses/technical/course-one?locale=en",
  );
  expect(state.catalogue).toHaveBeenCalledWith("technical", "en");
});
it("shows a recoverable catalogue error while leaving the containing page usable", async () => {
  state.catalogue.mockRejectedValue(new Error("Unavailable"));
  view();
  expect(await screen.findByRole("status")).toHaveTextContent(
    "The full course list could not be loaded",
  );
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
});

it.each(["ar-EG", "ar-MSA", "ar-Gulf"])(
  "uses the Arabic plural for three stations in %s",
  async (locale) => {
    state.locale = locale;
    state.catalogue.mockResolvedValue([
      {
        id: "course-one",
        area: "technical",
        title: "Reviewed course",
        version: "a".repeat(64),
        stations: ["s1", "s2", "s3"].map((id) => ({ id, title: id, steps: [] })),
      },
    ]);
    view();
    const card = await screen.findByRole("link", { name: /Reviewed course/ });
    expect(card).toHaveTextContent("٣ محطات");
  },
);

it("opens the public management outline from its academic card in the selected language", async () => {
  state.locale = "ar-Gulf";
  state.catalogue.mockResolvedValue([
    { id: "AC-MGT-TEST", area: "academic", title: "قرار", version: "v1", stations: [] },
    { id: "other-course", area: "academic", title: "Other", version: "v1", stations: [] },
  ]);
  view("academic");
  expect(await screen.findByRole("link", { name: /قرار/ })).toHaveAttribute(
    "href",
    "/programs/management/AC-MGT-TEST?locale=ar-Gulf",
  );
  expect(screen.getByRole("link", { name: /Other/ })).toHaveAttribute(
    "href",
    "/courses/academic/other-course?locale=ar-Gulf",
  );
});

it.each([
  ["level-1", "KAI-01", "KAI-04"],
  ["level-2", "KAI-05", "KAI-08"],
  ["level-3", "KAI-09", "KAI-12"],
] as const)("shows only published additions for %s", async (level, first, last) => {
  const ids = ["KAI-01", "KAI-04", "KAI-05", "KAI-08", "KAI-09", "KAI-12", "legacy"];
  state.catalogue.mockResolvedValue(
    ids.map((id) => ({ id, title: id, area: "kids", stations: [] })),
  );
  view("kids", level);
  expect(await screen.findByRole("link", { name: new RegExp(first) })).toHaveAttribute(
    "href",
    `/courses/kids/${first}?locale=en`,
  );
  expect(screen.getByRole("link", { name: new RegExp(last) })).toBeInTheDocument();
  expect(screen.getAllByRole("link")).toHaveLength(2);
});

it("keeps the original location of ungrouped Kids curricula", async () => {
  state.catalogue.mockResolvedValue([
    { id: "other", title: "Other course", area: "kids", stations: [] },
  ]);
  view("kids");
  expect(await screen.findByRole("link", { name: /Other course/ })).toBeInTheDocument();
});
