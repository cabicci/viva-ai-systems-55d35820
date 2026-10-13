import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { RegisteredEmailPicker } from "./RegisteredEmailPicker";

const mock = vi.hoisted(() => ({
  list: vi.fn(),
  user: { id: "admin-a" } as { id: string } | null,
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/admin.functions", () => ({ listUsers: mock.list }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: mock.user, loading: false }) }));
beforeEach(() => {
  vi.clearAllMocks();
  mock.user = { id: "admin-a" };
  mock.list.mockImplementation(async ({ data }) => ({
    page: data.page,
    hasMore: data.page < 2,
    users:
      data.page === 1
        ? [{ email: "first@example.test" }, { email: null }]
        : [{ email: "later@example.test" }],
  }));
});
afterEach(cleanup);
function setup(onSelect = vi.fn(), selected: string[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <RegisteredEmailPicker onSelect={onSelect} selected={selected} />
      </LocaleProvider>
    </QueryClientProvider>,
  );
  return { ...view, client, onSelect };
}
describe("registered recipient lookup", () => {
  it("selects a registered email and searches beyond the first page without falsely reporting no match", async () => {
    const { onSelect } = setup();
    await screen.findByRole("button", { name: "first@example.test" });
    expect(mock.list).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "LATER" } });
    expect(screen.queryByText("No matching registered users.")).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: "later@example.test" }));
    expect(onSelect).toHaveBeenCalledWith("later@example.test");
    expect(mock.list).toHaveBeenCalledWith({ data: { page: 2, pageSize: 100 } });
  });
  it("marks an already selected email and does not submit a surrounding form", async () => {
    setup(vi.fn(), ["FIRST@example.test"]);
    expect(await screen.findByRole("button", { name: /first@example.test/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Load more users" })).toHaveAttribute(
      "type",
      "button",
    );
  });
  it("shows lookup failure and permits a retry while keeping manual entry independent", async () => {
    mock.list.mockRejectedValueOnce(new Error("lookup failed"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load registered users.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByRole("button", { name: "first@example.test" });
  });
  it("does not fetch while signed out or reuse another administrator's directory", async () => {
    const view = setup();
    await screen.findByRole("button", { name: "first@example.test" });
    mock.user = null;
    view.rerender(
      <QueryClientProvider client={view.client}>
        <LocaleProvider initialLocale="en">
          <RegisteredEmailPicker onSelect={view.onSelect} />
        </LocaleProvider>
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "first@example.test" })).toBeNull(),
    );
    expect(mock.list).toHaveBeenCalledTimes(1);
  });
});
