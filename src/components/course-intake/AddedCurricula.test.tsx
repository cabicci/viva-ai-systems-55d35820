import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { AddedCurricula } from "./AddedCurricula";
const state = vi.hoisted(() => ({ catalogue: vi.fn(), locale: "en" }));
vi.mock("@/lib/course-system/intake/client", () => ({ curriculumCatalogue: state.catalogue }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: state.locale }) }));
const view = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AddedCurricula area="technical" />
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
