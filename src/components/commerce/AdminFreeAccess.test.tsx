import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { AdminFreeAccess } from "./AdminFreeAccess";
import type { FreeAccessAdminData } from "@/lib/commerce/free-access";
const mock = vi.hoisted(() => ({ command: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "synthetic-admin" }, loading: false }),
}));
vi.mock("@/lib/commerce/free-access.functions", () => ({ freeAccessCommand: mock.command }));
let data: FreeAccessAdminData;
beforeEach(() => {
  vi.clearAllMocks();
  data = {
    server_time: "2026-11-01T00:00:00Z",
    targets: [
      { id: "ai:business", title: "Business path", published: true },
      { id: "academic:AC-BUS", title: "Academic business", published: true },
    ],
    windows: [],
    audit: [],
  };
  mock.command.mockImplementation(async ({ data: input }) =>
    input.action === "list" ? data : { id: "synthetic", version: 1 },
  );
});
afterEach(cleanup);
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <AdminFreeAccess />
      </LocaleProvider>
    </QueryClientProvider>,
  );
  return { ...view, client };
}
async function fill() {
  await screen.findByLabelText("Business");
  fireEvent.change(screen.getByLabelText("Offer name"), { target: { value: "Fourteen days" } });
  fireEvent.click(screen.getByLabelText("Business"));
  fireEvent.click(screen.getByLabelText("Academic business"));
  fireEvent.change(screen.getByLabelText("Starts (Cairo time)"), {
    target: { value: "2026-11-01T00:00" },
  });
  fireEvent.change(screen.getByLabelText("Ends (Cairo time)"), {
    target: { value: "2026-11-15T00:00" },
  });
}
describe("free access administrator", () => {
  it("stops an offer early without changing dates and can enable a stopped offer", async () => {
    const row = {
      id: "existing",
      title: "Earlier offer",
      targets: ["ai:business"],
      starts_at: "2026-11-01T00:00:00Z",
      ends_at: "2026-11-15T00:00:00Z",
      enabled: true,
      version: 4,
      status: "active" as const,
    };
    data.windows = [row];
    setup();
    fireEvent.click(await screen.findByRole("button", { name: "Stop early" }));
    await waitFor(() =>
      expect(mock.command).toHaveBeenCalledWith({
        data: {
          action: "update",
          data: expect.objectContaining({
            id: row.id,
            expected_version: 4,
            starts_at: row.starts_at,
            ends_at: row.ends_at,
            enabled: false,
          }),
        },
      }),
    );
    data = { ...data, windows: [{ ...row, enabled: false, version: 5, status: "paused" }] };
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.click(await screen.findByRole("button", { name: "Enable" }));
    await waitFor(() =>
      expect(mock.command).toHaveBeenCalledWith({
        data: {
          action: "update",
          data: expect.objectContaining({ id: row.id, expected_version: 5, enabled: true }),
        },
      }),
    );
  });
  it("submits multiple paths/curricula together with fixed Cairo-derived UTC dates", async () => {
    setup();
    await fill();
    fireEvent.click(screen.getByRole("button", { name: "Create period" }));
    await waitFor(() =>
      expect(mock.command).toHaveBeenCalledWith({
        data: {
          action: "create",
          data: expect.objectContaining({
            targets: ["academic:AC-BUS", "ai:business"],
            starts_at: "2026-10-31T22:00:00.000Z",
            ends_at: "2026-11-14T22:00:00.000Z",
          }),
        },
      }),
    );
  });
  it("shows new curricula after refresh without rebuilding the selector or losing selections", async () => {
    setup();
    await fill();
    data = {
      ...data,
      targets: [...data.targets, { id: "academic:NEW", title: "New curriculum", published: false }],
    };
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByText("New curriculum")).toBeVisible();
    expect(screen.getByLabelText("Academic business")).toBeChecked();
    expect(screen.getByText("Not published yet")).toBeVisible();
  });
  it("reuses the retry key after an uncertain server response", async () => {
    mock.command.mockImplementation(async ({ data: input }) => {
      if (input.action === "list") return data;
      throw Error("uncertain");
    });
    setup();
    await fill();
    fireEvent.click(screen.getByRole("button", { name: "Create period" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Create period" }));
    await waitFor(() =>
      expect(mock.command.mock.calls.filter((c) => c[0].data.action === "create")).toHaveLength(2),
    );
    const calls = mock.command.mock.calls.filter((c) => c[0].data.action === "create");
    expect(calls[0][0]).toEqual(calls[1][0]);
  });
  it("edits with the loaded version and retains inputs when a competing edit is rejected", async () => {
    data.windows = [
      {
        id: "existing",
        title: "Earlier offer",
        targets: ["ai:business"],
        starts_at: "2026-11-01T00:00:00Z",
        ends_at: "2026-11-15T00:00:00Z",
        enabled: true,
        version: 4,
        status: "scheduled",
      },
    ];
    mock.command.mockImplementation(async ({ data: input }) => {
      if (input.action === "list") return data;
      throw Error("FREE_ACCESS_CONFLICT");
    });
    setup();
    fireEvent.click(await screen.findByRole("button", { name: /^Edit$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save period" }));
    await screen.findByRole("alert");
    expect(mock.command).toHaveBeenCalledWith({
      data: {
        action: "update",
        data: expect.objectContaining({ id: "existing", expected_version: 4 }),
      },
    });
    expect(screen.getByLabelText("Offer name")).toHaveValue("Earlier offer");
  });
});
