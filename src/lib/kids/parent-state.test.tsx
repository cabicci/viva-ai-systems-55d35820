import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useKidsParentState } from "./parent-state";

const mock = vi.hoisted(() => ({
  useAuth: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: mock.useAuth }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mock.rpc, from: mock.from },
}));

beforeEach(() => {
  vi.resetAllMocks();
  mock.useAuth.mockReturnValue({ user: { id: "parent-1" }, loading: false });
});

describe("Kids parent privacy gate", () => {
  it("does not request child profiles or collect child data when release or verification is absent", async () => {
    mock.rpc.mockResolvedValue({ data: false, error: null });
    const { result } = renderHook(() => useKidsParentState());
    await waitFor(() => expect(result.current.state).toBe("pending"));
    expect(mock.rpc).toHaveBeenCalledWith("kids_parent_can_manage_profiles");
    expect(mock.from).not.toHaveBeenCalled();
    await expect(result.current.createProfile("Child", "level-1")).rejects.toThrow();
    expect(mock.from).not.toHaveBeenCalled();
  });

  it("fails closed on missing migration or server error", async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: "RPC unavailable" } });
    const { result } = renderHook(() => useKidsParentState());
    await waitFor(() => expect(result.current.state).toBe("unavailable"));
    expect(mock.from).not.toHaveBeenCalled();
  });

  it("never queries parent data when signed out", async () => {
    mock.useAuth.mockReturnValue({ user: null, loading: false });
    const { result } = renderHook(() => useKidsParentState());
    await waitFor(() => expect(result.current.state).toBe("signed-out"));
    expect(mock.rpc).not.toHaveBeenCalled();
    expect(mock.from).not.toHaveBeenCalled();
  });

  it("reads only the verified parent's profiles after the server grants access", async () => {
    mock.rpc.mockResolvedValue({ data: true, error: null });
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ id: "profile-1", level_id: "level-1", display_name: "Explorer" }],
        error: null,
      }),
    };
    mock.from.mockReturnValue(query);
    const { result } = renderHook(() => useKidsParentState());
    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(mock.from).toHaveBeenCalledWith("kids_profiles");
    expect(query.eq).toHaveBeenCalledWith("parent_id", "parent-1");
    expect(result.current.profiles).toHaveLength(1);
    await act(async () => {
      result.current.refresh();
    });
  });
});
