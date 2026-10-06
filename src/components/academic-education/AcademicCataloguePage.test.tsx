import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AcademicCataloguePage } from "./AcademicCataloguePage";
const state = vi.hoisted(() => ({
  user: { id: "admin" } as { id: string } | null,
  catalogue: vi.fn(),
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: state.user, loading: false }) }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en", dir: "ltr" }) }));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/site/Footer", () => ({ Footer: () => null }));
vi.mock("@/lib/academic-education/client", () => ({ academicCatalogue: state.catalogue }));
afterEach(cleanup);
it("shows the review course and curriculum without retaining administrator catalogue across account changes", async () => {
  state.user = { id: "admin" };
  state.catalogue.mockImplementation(async () =>
    state.user?.id === "admin"
      ? [
          {
            id: "AC-BUS",
            title: "Business foundations",
            reviewOnly: true,
            lessons: [
              {
                id: "AC-BUS-M01-L02",
                title: "Business functions",
                moduleId: "AC-BUS-M01",
                position: 2,
                introductory: false,
              },
            ],
          },
        ]
      : [],
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const page = (courseId?: string, contents = false) => (
    <QueryClientProvider client={client}>
      <AcademicCataloguePage courseId={courseId} contents={contents} />
    </QueryClientProvider>
  );
  const view = render(page());
  expect(await screen.findByRole("link", { name: /Explore path/ })).toHaveAttribute(
    "href",
    "/academic/courses/AC-BUS?locale=en",
  );
  expect(screen.getByText("Administrator review — not yet released to learners.")).toBeTruthy();
  view.rerender(page("AC-BUS"));
  expect(await screen.findByRole("link", { name: "Explore path steps" })).toHaveAttribute(
    "href",
    "/academic/courses/AC-BUS/contents?locale=en",
  );
  expect(screen.queryByRole("link", { name: /Business functions/ })).toBeNull();
  view.rerender(page("AC-BUS", true));
  expect(await screen.findByRole("link", { name: /Business functions/ })).toHaveAttribute(
    "href",
    "/academic/learn/AC-BUS-M01-L02?locale=en",
  );
  expect(screen.getByRole("link", { name: "Back to path overview" })).toHaveAttribute(
    "href",
    "/academic/courses/AC-BUS?locale=en",
  );
  state.user = { id: "ordinary" };
  view.rerender(page());
  await screen.findByText("Paths will appear here when available.");
  expect(screen.queryByText("Business foundations")).toBeNull();
  state.user = null;
  view.rerender(page());
  await waitFor(() => expect(state.catalogue).toHaveBeenCalledTimes(3));
  expect(screen.queryByText("Business foundations")).toBeNull();
});
