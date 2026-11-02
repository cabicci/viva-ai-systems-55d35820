import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as React from "react";

const f = vi.hoisted(() => ({
  userId: "A",
  generation: { value: 1 },
  read: vi.fn(),
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: f.userId },
    loading: false,
    authGeneration: f.generation,
    isAuthGenerationCurrent: (generation: object) => generation === f.generation,
  }),
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/lib/cloud-sync", () => ({ retryCloudSync: async () => {} }));
vi.mock("@/lib/error-capture", () => ({ captureWarn: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      let user = "";
      const query = {
        select: () => query,
        eq: (_key: string, value: string) => {
          user = value;
          return table === "user_mission_state" ? f.read(table, user) : query;
        },
        order: () => query,
        limit: () => f.read(table, user),
      };
      return query;
    },
  },
}));
import { CloudHydration } from "./CloudHydration";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  f.userId = "A";
  f.generation = { value: 1 };
  f.read.mockResolvedValue({ data: [], error: null });
});
afterEach(cleanup);

it("restores missions into the same per-account bucket read by the runtime", async () => {
  f.read.mockImplementation(async (table: string) => ({
    data:
      table === "user_mission_state"
        ? [
            {
              mission_id: "L1::mission",
              state: "completed",
              created_at: "2026-01-01",
              updated_at: "2026-01-02",
            },
          ]
        : [],
    error: null,
  }));
  render(<CloudHydration />);
  await waitFor(() => expect(localStorage.getItem("mission-runtime:v1:A")).not.toBeNull());
  expect(JSON.parse(localStorage.getItem("mission-runtime:v1:A")!)["L1::mission"].state).toBe(
    "completed",
  );
  expect(localStorage.getItem("mission-runtime:v1")).toBeNull();
});

it("does not merge a retired account's response after switching away and back", async () => {
  let finish!: (value: unknown) => void;
  f.read.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const view = render(<CloudHydration />);
  await waitFor(() => expect(f.read).toHaveBeenCalledTimes(2));
  f.userId = "B";
  f.generation = { value: 2 };
  f.read.mockResolvedValue({ data: [], error: null });
  view.rerender(<CloudHydration />);
  f.userId = "A";
  f.generation = { value: 3 };
  view.rerender(<CloudHydration />);
  await act(async () =>
    finish({
      data: [
        {
          id: "private-old-A",
          type: "lesson_completed",
          lesson_id: "L1",
          title: "Old",
          short_description: "Old",
          created_at: "2026-01-01",
          metadata: null,
        },
      ],
      error: null,
    }),
  );
  expect(localStorage.getItem("build-logs:v2:A")).toBeNull();
  expect(localStorage.getItem("build-logs:v2:B")).toBeNull();
});

it("offers retry after a failed read and actually reads again", async () => {
  f.read.mockResolvedValue({ data: null, error: new Error("offline") });
  render(<CloudHydration />);
  const retry = await screen.findByRole("button", { name: "Retry restoring history" });
  f.read.mockResolvedValue({ data: [], error: null });
  fireEvent.click(retry);
  await waitFor(() => expect(f.read).toHaveBeenCalledTimes(4));
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Retry restoring history" })).toBeNull(),
  );
});
