import { act, renderHook, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  stampFreeDelivery,
  useFreeAccessSnapshot,
  useFreeDeliveryDeadline,
} from "./free-access-client";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), user: "one" as string | null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: mocks.user ? { id: mocks.user } : null, loading: false }),
}));
let client: QueryClient;
const grant = {
  server_time: "2026-11-01T00:00:00Z",
  valid_until: "2026-11-01T00:00:05Z",
  targets: ["ai:business"],
  lesson_ids: ["business-paid"],
};
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
const settle = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10);
  });
};
beforeEach(() => {
  vi.useFakeTimers();
  mocks.user = "one";
  mocks.rpc.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.useRealTimers();
});
describe("scheduled access lifetime and account isolation", () => {
  it("does not hammer the server during the last second or add network latency to an offer", async () => {
    const short = { ...grant, valid_until: "2026-11-01T00:00:00.900Z" };
    mocks.rpc.mockResolvedValue({ data: short, error: null });
    renderHook(useFreeAccessSnapshot, { wrapper });
    await settle();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(750);
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    const requestedAt = performance.now() - 1200;
    const delayed = stampFreeDelivery(
      {
        allowed: true,
        free_access_server_time: short.server_time,
        free_access_check_at: short.valid_until,
      },
      requestedAt,
    );
    expect(renderHook(() => useFreeDeliveryDeadline(delayed, vi.fn())).result.current).toBe(false);
  });
  it("refreshes before expiry and fails closed on failed readback despite a skewed device wall clock", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: grant, error: null })
      .mockResolvedValue({ data: null, error: Error("offline") });
    const hook = renderHook(useFreeAccessSnapshot, { wrapper });
    await settle();
    expect(hook.result.current.lessonIds).toEqual(["business-paid"]);
    vi.setSystemTime(new Date("2001-01-01T00:00:00Z"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100);
    });
    expect(hook.result.current.lessonIds).toEqual([]);
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });
  it("does not carry the first account's grant into another account or a guest session", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: grant, error: null });
    const hook = renderHook(useFreeAccessSnapshot, { wrapper });
    await settle();
    expect(hook.result.current.targets).toEqual(["ai:business"]);
    mocks.rpc.mockImplementation(() => new Promise(() => {}));
    mocks.user = "two";
    hook.rerender();
    expect(hook.result.current.lessonIds).toEqual([]);
    mocks.user = null;
    hook.rerender();
    expect(hook.result.current.targets).toEqual([]);
  });
  it("does not restart a delivered grant on rerender/remount and leaves paid deliveries untimed", async () => {
    const delivery = stampFreeDelivery({
      allowed: true,
      free_access_server_time: grant.server_time,
      free_access_check_at: grant.valid_until,
    });
    const refetch = vi.fn();
    const hook = renderHook(() => useFreeDeliveryDeadline(delivery, () => refetch()));
    expect(hook.result.current).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    hook.rerender();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(hook.result.current).toBe(false);
    expect(refetch).toHaveBeenCalledTimes(1);
    hook.unmount();
    expect(renderHook(() => useFreeDeliveryDeadline(delivery, refetch)).result.current).toBe(false);
    expect(
      renderHook(() => useFreeDeliveryDeadline({ allowed: true }, refetch)).result.current,
    ).toBe(true);
  });
});
