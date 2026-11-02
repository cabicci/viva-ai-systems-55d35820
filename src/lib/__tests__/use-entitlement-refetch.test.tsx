import { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  adminRpc: vi.fn(),
  tierRpc: vi.fn(),
  commercialRpc: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mocks.rpc },
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: mocks.useAuth,
}));

import { useEntitlement, decideLessonGate } from "@/lib/entitlements";

const userId = "user-entitlement-refetch";

function renderEntitlement() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook(() => useEntitlement(), { wrapper }) };
}
async function refetch(client: QueryClient, queryKey: readonly string[]) {
  await act(async () => {
    await client.refetchQueries({ queryKey, exact: true });
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  mocks.rpc.mockReset();
  mocks.adminRpc.mockReset();
  mocks.tierRpc.mockReset();
  mocks.commercialRpc.mockReset().mockResolvedValue({ data: { ai_lifetime_access: false, ai_lesson_ids: [], server_time: "2026-11-02T10:00:00Z", check_at: "2026-11-02T10:00:30Z" }, error: null });
  mocks.useAuth.mockReturnValue({
    user: { id: userId },
    loading: false,
  });
  mocks.rpc.mockImplementation((name: string) => {
    if (name === "has_role") return mocks.adminRpc();
    if (name === "get_my_billing_access_tier") return mocks.tierRpc();
    if (name === "get_my_commercial_access") return mocks.commercialRpc();
    throw new Error(`Unexpected RPC: ${name}`);
  });
});

describe("useEntitlement rejected refetch fail-closed behavior", () => {
  it("revokes stale admin data while preserving a valid billing grant, then recovers", async () => {
    mocks.adminRpc.mockResolvedValue({ data: true, error: null });
    mocks.tierRpc.mockResolvedValue({ data: "pro", error: null });

    const { client, result } = renderEntitlement();
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current).toMatchObject({
      tier: "pro_plus",
      isPro: true,
      isProPlus: true,
      isAdmin: true,
    });
    mocks.adminRpc.mockRejectedValueOnce(new Error("admin transport failed"));
    await refetch(client, ["user-is-admin", userId]);

    expect(result.current).toMatchObject({
      tier: "pro",
      isPro: true,
      isAdmin: false,
      isLoaded: false,
    });

    mocks.adminRpc.mockResolvedValueOnce({ data: true, error: null });
    await refetch(client, ["user-is-admin", userId]);
    expect(result.current).toMatchObject({
      tier: "pro_plus",
      isPro: true,
      isProPlus: true,
      isAdmin: true,
      isLoaded: true,
    });

    mocks.tierRpc.mockRejectedValueOnce(new Error("billing transport failed"));
    await refetch(client, ["user-subscription", userId]);
    expect(result.current).toMatchObject({
      tier: "pro_plus",
      isPro: true,
      isProPlus: true,
      isAdmin: true,
      isLoaded: false,
    });

    mocks.tierRpc.mockResolvedValueOnce({ data: "pro", error: null });
    await refetch(client, ["user-subscription", userId]);
    expect(result.current).toMatchObject({
      tier: "pro_plus",
      isPro: true,
      isProPlus: true,
      isAdmin: true,
      isLoaded: true,
    });

    mocks.adminRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "role RPC denied" },
    });
    await refetch(client, ["user-is-admin", userId]);
    expect(result.current).toMatchObject({
      tier: "pro",
      isPro: true,
      isAdmin: false,
      isLoaded: true,
    });
  });

  it("revokes stale billing data after rejection, then recovers and keeps resolved errors closed", async () => {
    mocks.adminRpc.mockResolvedValue({ data: false, error: null });
    mocks.tierRpc.mockResolvedValue({ data: "pro", error: null });

    const { client, result } = renderEntitlement();
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current).toMatchObject({
      tier: "pro",
      isPro: true,
      isAdmin: false,
    });

    mocks.tierRpc.mockRejectedValueOnce(new Error("billing transport failed"));
    await refetch(client, ["user-subscription", userId]);

    expect(result.current).toMatchObject({
      tier: "free",
      isPro: false,
      isProPlus: false,
      isAdmin: false,
      isLoaded: false,
    });

    mocks.tierRpc.mockResolvedValueOnce({ data: "pro", error: null });
    await refetch(client, ["user-subscription", userId]);
    expect(result.current).toMatchObject({
      tier: "pro",
      isPro: true,
      isProPlus: false,
      isLoaded: true,
    });

    mocks.tierRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "billing RPC denied" },
    });
    await refetch(client, ["user-subscription", userId]);
    expect(result.current).toMatchObject({
      tier: "free",
      isPro: false,
      isProPlus: false,
      isAdmin: false,
      isLoaded: true,
    });
  });
});


describe("lifetime content is independent from a paid subscription", () => {
  it("opens exact purchased lessons without granting Pro and revokes them on a failed refresh", async () => {
    const lessonId = "builder-m1-l2-tokens-training";
    mocks.adminRpc.mockResolvedValue({ data: false, error: null });
    mocks.tierRpc.mockResolvedValue({ data: "free", error: null });
    mocks.commercialRpc.mockResolvedValue({ data: { ai_lifetime_access: true, ai_lesson_ids: [lessonId],
      server_time: "2026-11-02T10:00:00Z", check_at: "2026-11-02T10:00:30Z" }, error: null });
    const { client, result } = renderEntitlement();
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current).toMatchObject({ tier: "free", isPro: false, isProPlus: false, entitledLessonIds: [lessonId] });
    const gate = () => decideLessonGate({ lessonId, tier: result.current.tier, isAdmin: false,
      entitledLessonIds: result.current.entitledLessonIds, introCompletedCount: 10, introTotal: 10 });
    expect(gate()).toEqual({ kind: "open" });
    mocks.commercialRpc.mockRejectedValue(new Error("revoked or unavailable"));
    await refetch(client, ["commercial-content-access", userId]);
    expect(result.current.entitledLessonIds).toEqual([]);
    expect(gate()).toEqual({ kind: "paywall" });
  });
});
