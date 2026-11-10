import React from "react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

const h = vi.hoisted(() => ({
  component: null as any,
  beforeLoad: null as any,
  data: undefined as any,
  error: null as unknown,
  pending: false,
  locale: "en",
  target: undefined as string | undefined,
  command: vi.fn(),
  refetch: vi.fn(),
  invalidate: vi.fn(),
  guard: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => {
    h.component = config.component;
    h.beforeLoad = config.beforeLoad;
    return { useSearch: () => ({ order: h.target }) };
  },
  Link: ({ children }: any) => <a href="/admin">{children}</a>,
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: h.data, error: h.error, isPending: h.pending, refetch: h.refetch }),
  useQueryClient: () => ({ invalidateQueries: h.invalidate }),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => h.command }));
vi.mock("@/lib/admin-route-guard", () => ({
  requireAdminBeforeLoad: (...args: any[]) => h.guard(...args),
}));
vi.mock("@/lib/commerce/payment-links", () => ({
  parsePaymentSearch: (x: unknown) => x,
  guardPaymentLink: (guard: any, order: unknown, audience: unknown) => guard(order, audience),
}));
vi.mock("@/lib/commerce/admin-ui", () => ({ download: vi.fn() }));
vi.mock("@/lib/commerce/report", () => ({ exportCommerce: () => "synthetic-export" }));
vi.mock("@/lib/commerce/commerce.functions", () => ({
  commerceCommand: () => {
    throw Error("REAL_SERVER_BOUNDARY");
  },
}));
vi.mock("@/lib/commerce/admin-offer-copy", () => ({
  offerError: () => "Synthetic command failure",
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: h.locale }) }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { id: "synthetic-admin" } }) }));
vi.mock("@/components/ui/button", () => ({
  Button: ({ variant, ...props }: any) => <button {...props} />,
}));
vi.mock("@/components/commerce/AdminShared", () => ({
  Select: ({ label, options, onChange, value }: any) => (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, t]: any) => (
        <option key={v} value={v}>
          {t}
        </option>
      ))}
    </select>
  ),
}));
vi.mock("@/components/commerce/AdminPayments", () => ({
  AdminPayments: ({ orders, access, initialOrderId }: any) => (
    <div data-testid="payments">
      Payments rows:{orders.length}; target:{initialOrderId ?? ""}; access:
      {access.map((row: any) => row.id).join(",")}
    </div>
  ),
}));
vi.mock("@/components/commerce/AdminOffers", () => ({
  AdminOffers: ({ run, onInvitations }: any) => (
    <div data-testid="offers">
      <button onClick={() => void run("synthetic-offer", {})}>Synthetic command</button>
      <button onClick={onInvitations}>Open invitations</button>
    </div>
  ),
}));
vi.mock("@/components/commerce/AdminLiveOffers", () => ({
  AdminLiveOffers: () => <div data-testid="card-offers">Card offers</div>,
}));
vi.mock("@/components/commerce/AdminGroups", () => ({
  AdminGroups: ({ data }: any) => (
    <div data-testid="groups">Group invitations:{data.invitations.length}</div>
  ),
}));
vi.mock("@/components/commerce/AdminEmailAccess", () => ({
  AdminEmailAccess: () => <div data-testid="email-access">Email access</div>,
}));
vi.mock("@/components/commerce/AdminFreeAccess", () => ({
  AdminFreeAccess: () => <div data-testid="free-access">Access grants</div>,
}));
vi.mock("@/components/commerce/AdminSettings", () => ({
  AdminSettings: () => <div data-testid="settings">Instructions</div>,
}));
import "@/routes/admin.commerce";

beforeEach(() => {
  vi.clearAllMocks();
  h.locale = "en";
  h.target = undefined;
  h.error = null;
  h.pending = false;
  h.data = {
    orders: [
      {
        id: "synthetic-order",
        recipient_email: "example@example.test",
        reference: "synthetic-reference",
        package: "pro",
        review_status: "pending",
      },
    ],
    entitlements: [],
    grants: [],
    invitations: [],
    audit: [],
  };
  h.command.mockResolvedValue({ ok: true });
  h.invalidate.mockResolvedValue(undefined);
});
afterEach(cleanup);
function show() {
  const Page = h.component;
  return render(<Page />);
}
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

it("presents four primary areas and mounts only the selected functional view", () => {
  show();
  expect(
    screen.getByRole("navigation", { name: "Administration areas" }).querySelectorAll("button"),
  ).toHaveLength(4);
  expect(screen.getByTestId("payments")).toBeTruthy();
  click("Offers and groups");
  expect(screen.getByTestId("offers")).toBeTruthy();
  expect(screen.queryByTestId("groups")).toBeNull();
  expect(screen.queryByTestId("card-offers")).toBeNull();
  click("Groups and recipient imports");
  expect(screen.getByTestId("groups")).toBeTruthy();
  expect(screen.queryByTestId("offers")).toBeNull();
  click("Card-payment discounts");
  expect(screen.getByTestId("card-offers")).toBeTruthy();
  expect(screen.queryByTestId("groups")).toBeNull();
  expect(h.command).not.toHaveBeenCalled();
});
it("keeps grants and invitations separate from payment and offer forms", () => {
  show();
  click("Access");
  expect(screen.getByTestId("email-access")).toBeTruthy();
  expect(screen.queryByRole("combobox")).toBeNull();
  click("Access grants");
  expect(screen.getByTestId("free-access")).toBeTruthy();
  expect(screen.queryByTestId("email-access")).toBeNull();
  expect(screen.queryByTestId("offers")).toBeNull();
  expect(h.command).not.toHaveBeenCalled();
});
it("shows payment states only in payment view and no state filter or export on settings/history", () => {
  show();
  expect(screen.getByRole("combobox").querySelectorAll("option")).toHaveLength(11);
  expect(screen.queryByRole("option", { name: "Sent" })).toBeNull();
  click("Settings and history");
  expect(screen.getByTestId("settings")).toBeTruthy();
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.queryByRole("button", { name: "Export available records" })).toBeNull();
  click("Administrator action history");
  expect(screen.getByRole("textbox")).toBeTruthy();
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.queryByRole("button", { name: "Export available records" })).toBeNull();
});
it("resets search and filters when changing functional context", () => {
  show();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "does-not-match" } });
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "rejected" } });
  expect(screen.getByTestId("payments").textContent).toContain("rows:0");
  click("Offers and groups");
  click("Payments");
  expect(screen.getByTestId("payments").textContent).toContain("rows:1");
  expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("all");
});
it("retains the scheduled entitlement filter and forwards only future access", () => {
  const make = (id: string, start: number, end: number) => ({
    id,
    user_id: "synthetic-user",
    package: "pro",
    starts_at: new Date(Date.now() + start).toISOString(),
    ends_at: new Date(Date.now() + end).toISOString(),
    revoked_at: null,
  });
  h.data.entitlements = [
    make("future-access", 86400000, 172800000),
    make("active-access", -86400000, 86400000),
    make("expired-access", -172800000, -86400000),
  ];
  show();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "scheduled" } });
  expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("scheduled");
  const forwarded = screen.getByTestId("payments").textContent;
  expect(forwarded).toContain("access:future-access");
  expect(forwarded).not.toContain("active-access");
  expect(forwarded).not.toContain("expired-access");
});
it("preserves target-order forwarding and the existing admin guard wiring", async () => {
  h.target = "synthetic-order";
  show();
  expect(screen.getByTestId("payments").textContent).toContain("target:synthetic-order");
  await h.beforeLoad({ search: { order: "synthetic-order" } });
  expect(h.guard).toHaveBeenCalledWith("synthetic-order", "admin");
});
it("communicates loading rather than a successful empty response", () => {
  h.data = undefined;
  h.pending = true;
  show();
  expect(screen.getByRole("status").textContent).toContain("Loading");
  expect(screen.queryByTestId("payments")).toBeNull();
});
it("communicates a failed read and retains an explicit retry action", () => {
  h.data = undefined;
  h.error = new Error("synthetic network failure");
  show();
  expect(screen.getByRole("alert").textContent).toContain("Could not load");
  click("Refresh");
  expect(h.refetch).toHaveBeenCalledTimes(1);
  expect(h.command).not.toHaveBeenCalled();
});
it("keeps stale records and export unavailable after a failed refresh", () => {
  h.error = new Error("synthetic refresh failure");
  show();
  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.getByTestId("payments")).not.toBeVisible();
  expect(screen.getByRole("button", { name: "Export available records" })).toBeDisabled();
  click("Refresh");
  expect(h.refetch).toHaveBeenCalledTimes(1);
});
it("keeps context fixed while a parent financial command is pending", async () => {
  let resolve!: (value: unknown) => void;
  h.command.mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  show();
  click("Offers and groups");
  await act(async () => click("Synthetic command"));
  expect((screen.getByRole("button", { name: "Payments" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  await act(async () => resolve({ ok: true }));
  expect((screen.getByRole("button", { name: "Payments" }) as HTMLButtonElement).disabled).toBe(
    false,
  );
});
it("clears previous command feedback when moving to another context", async () => {
  h.command.mockRejectedValue(new Error("synthetic"));
  show();
  click("Offers and groups");
  await act(async () => click("Synthetic command"));
  expect(screen.getByRole("alert").textContent).toContain("Synthetic command failure");
  click("Payments");
  expect(screen.queryByRole("alert")).toBeNull();
});
it("uses Arabic RTL labels and separate offer/group views", () => {
  h.locale = "ar-EG";
  show();
  expect(screen.getByRole("heading", { level: 1 }).closest("[dir]")?.getAttribute("dir")).toBe(
    "rtl",
  );
  click("العروض والمجموعات");
  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("الكوبونات ودعوات العروض");
  click("المجموعات واستيراد المستفيدين");
  expect(screen.getByTestId("groups")).toBeTruthy();
  expect(screen.queryByTestId("offers")).toBeNull();
});
