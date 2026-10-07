import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, it, expect, vi } from "vitest";
import { useRecordJourneyVisit } from "./client";
const state = vi.hoisted(() => ({ user: "parent-a", upsert: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: state.user ? { id: state.user } : null }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: state.from } }));
function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}
beforeEach(() => {
  state.user = "parent-a";
  state.upsert.mockReset().mockResolvedValue({ error: null });
  state.from.mockReset().mockReturnValue({ upsert: state.upsert });
});
it("records authorized visits without changing completion or entitlement", async () => {
  renderHook(() => useRecordJourneyVisit("academic", "AC-BUS", "AC-BUS-M01-L02", "en", true), {
    wrapper,
  });
  await waitFor(() => expect(state.upsert).toHaveBeenCalledTimes(1));
  expect(state.from).toHaveBeenCalledWith("journey_visits");
  expect(state.upsert.mock.calls[0][0]).toEqual({
    user_id: "parent-a",
    line: "academic",
    course_id: "AC-BUS",
    subject_id: "parent-a",
    profile_id: null,
    lesson_id: "AC-BUS-M01-L02",
    locale: "en",
  });
});
it("does not record denied lessons or admin child previews", () => {
  renderHook(() => useRecordJourneyVisit("ai", "ai", "one", "en", false), { wrapper });
  renderHook(() => useRecordJourneyVisit("kids", "level-1", "1", "en", true, "parent-a"), {
    wrapper,
  });
  expect(state.upsert).not.toHaveBeenCalled();
});
it("scopes child bookmarks to the selected child and parent", async () => {
  renderHook(() => useRecordJourneyVisit("kids", "level-1", "2", "ar-EG", true, "child-b"), {
    wrapper,
  });
  await waitFor(() => expect(state.upsert).toHaveBeenCalledTimes(1));
  expect(state.upsert.mock.calls[0][0]).toMatchObject({
    user_id: "parent-a",
    subject_id: "child-b",
    profile_id: "child-b",
  });
});
it("exposes a save failure and supports retry without crashing the lesson", async () => {
  state.from.mockImplementationOnce(() => {
    throw new Error("offline");
  });
  const { result } = renderHook(() => useRecordJourneyVisit("ai", "ai", "one", "en", true), {
    wrapper,
  });
  await waitFor(() => expect(result.current.failed).toBe(true));
  await act(async () => result.current.retry());
  await waitFor(() => expect(result.current.failed).toBe(false));
  expect(state.upsert).toHaveBeenCalledTimes(1);
});
