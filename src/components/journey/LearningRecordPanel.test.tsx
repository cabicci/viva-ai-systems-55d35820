import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LearningRecordPanel } from "./LearningRecordPanel";
const m = vi.hoisted(() => ({
  user: "a",
  generation: {},
  used: 0,
  recordsError: false,
  recordsGate: null as Promise<void> | null,
  reportsGate: null as Promise<void> | null,
  current: vi.fn(),
  generate: vi.fn(),
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: m.user },
    loading: false,
    authGeneration: m.generation,
    isAuthGenerationCurrent: m.current,
  }),
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/lib/kids/parent-state", () => ({ useKidsParentStateSource: () => ({ profiles: [] }) }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => m.generate }));
vi.mock("@/lib/learning/reports.functions", () => ({ createLearningReport: () => {} }));
vi.mock("@/lib/learning/client", () => ({
  learningCommand: async (action: string) => {
    if (action === "records") {
      if (m.recordsGate) await m.recordsGate;
      if (m.recordsError) throw new Error("synthetic read failure");
      return [{ id: `r-${m.user}`, subject_id: m.user, area: "ai", course: "ai" }];
    }
    return { events: [], notes: [] };
  },
  learningReports: async () => {
    if (m.reportsGate) await m.reportsGate;
    return {
      sources: [
        {
          sourceKey: "package",
          used: m.used,
          limit: 2,
          startsAt: "2026-11-01",
          endsAt: "2026-12-01",
        },
      ],
      reports: [],
    };
  },
}));
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = () => (
    <QueryClientProvider client={client}>
      <LearningRecordPanel />
    </QueryClientProvider>
  );
  const result = render(tree());
  return { ...result, refresh: () => result.rerender(tree()) };
}
beforeEach(() => {
  localStorage.clear();
  m.user = "a";
  m.generation = {};
  m.used = 0;
  m.recordsError = false;
  m.recordsGate = null;
  m.reportsGate = null;
  m.current.mockImplementation((g) => g === m.generation);
  m.generate.mockReset();
});
afterEach(cleanup);
it("does not report that a package is missing while loading report eligibility", async () => {
  let finish!: () => void;
  m.reportsGate = new Promise<void>((resolve) => { finish = resolve; });
  mount();
  await screen.findByRole("heading", { name: "AI learning reports" });
  expect(screen.getByRole("status")).toHaveTextContent("Loading");
  expect(screen.queryByText(/No eligible package/)).toBeNull();
  expect(screen.queryByRole("button", { name: "Create report" })).toBeNull();
  await act(async () => finish());
  expect(await screen.findByRole("button", { name: "Create report" })).toBeEnabled();
});
it("shows the per-package report limit and disables generation when exhausted", async () => {
  m.used = 2;
  mount();
  expect(await screen.findByRole("button", { name: "Create report" })).toBeDisabled();
  expect(screen.getByText(/Two reports per package each month/)).toBeVisible();
  expect(m.generate).not.toHaveBeenCalled();
});
it("retains the report command identity across retries after an uncertain response", async () => {
  m.generate.mockRejectedValue(new Error("uncertain"));
  mount();
  fireEvent.click(await screen.findByRole("button", { name: "Create report" }));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Create report" }));
  await waitFor(() => expect(m.generate).toHaveBeenCalledTimes(2));
  expect(m.generate.mock.calls[0][0].data.requestId).toBe(
    m.generate.mock.calls[1][0].data.requestId,
  );
});
it("does not let an old account response clear a newer account's active request", async () => {
  let resolveA!: (value: unknown) => void;
  let resolveB!: (value: unknown) => void;
  m.generate
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveA = resolve;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveB = resolve;
        }),
    );
  const view = mount();
  fireEvent.click(await screen.findByRole("button", { name: "Create report" }));
  await screen.findByRole("button", { name: "Preparing report…" });
  m.user = "b";
  m.generation = {};
  view.refresh();
  fireEvent.click(await screen.findByRole("button", { name: "Create report" }));
  await screen.findByRole("button", { name: "Preparing report…" });
  await act(async () => resolveA({ state: "pending" }));
  expect(screen.getByRole("button", { name: "Preparing report…" })).toBeDisabled();
  await act(async () => resolveB({ state: "pending" }));
  expect(await screen.findByRole("button", { name: "Create report" })).toBeEnabled();
});

it("returns keyboard focus to the record heading after a successful read retry", async () => {
  m.recordsError = true;
  mount();
  const retry = await screen.findByRole("button", { name: "Retry" });
  retry.focus();
  m.recordsError = false;
  fireEvent.click(retry);
  await waitFor(() => expect(screen.getByRole("heading", { name: "Learning record" })).toHaveFocus());
});
it("preserves focus moved elsewhere while a read retry is pending", async () => {
  m.recordsError = true;
  mount();
  const retry = await screen.findByRole("button", { name: "Retry" });
  let resume!: () => void;
  m.recordsGate = new Promise<void>((resolve) => { resume = resolve; });
  m.recordsError = false;
  retry.focus();
  fireEvent.click(retry);
  const elsewhere = document.createElement("button");
  elsewhere.textContent = "Elsewhere";
  document.body.appendChild(elsewhere);
  elsewhere.focus();
  try {
    await act(async () => resume());
    await screen.findByRole("button", { name: "Create report" });
    expect(elsewhere).toHaveFocus();
  } finally {
    elsewhere.remove();
  }
});

it("does not reclaim focus after the user leaves the retry and later blurs", async () => {
  m.recordsError = true;
  mount();
  const retry = await screen.findByRole("button", { name: "Retry" });
  let resume!: () => void;
  m.recordsGate = new Promise<void>((resolve) => { resume = resolve; });
  m.recordsError = false;
  retry.focus();
  fireEvent.click(retry);
  const elsewhere = document.createElement("button");
  document.body.appendChild(elsewhere);
  elsewhere.focus();
  elsewhere.blur();
  try {
    await act(async () => resume());
    await screen.findByRole("button", { name: "Create report" });
    expect(screen.getByRole("heading", { name: "Learning record" })).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  } finally {
    elsewhere.remove();
  }
});
