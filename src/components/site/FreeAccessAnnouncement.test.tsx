// @vitest-environment jsdom
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FreeAccessAnnouncement } from "./FreeAccessAnnouncement";

const fixture = vi.hoisted(() => ({ rpc: vi.fn(), signedIn: false }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: fixture.rpc } }));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ loading: false, user: fixture.signedIn ? { id: "learner" } : null }),
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en", dir: "ltr" }) }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    hash,
    onClick,
    children,
  }: {
    to: string;
    hash?: string;
    onClick?: () => void;
    children: ReactNode;
  }) => (
    <a href={to + (hash ? `#${hash}` : "")} onClick={onClick}>
      {children}
    </a>
  ),
}));

const campaign = {
  id: "00000000-0000-4000-8000-000000000061",
  server_time: "2026-11-11T11:26:00Z",
  ends_at: "2026-11-25T11:26:00Z",
};

function show() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <FreeAccessAnnouncement />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  fixture.signedIn = false;
  fixture.rpc.mockReset();
});
afterEach(cleanup);

describe("free access announcement", () => {
  it("shows the active window once and leads guests to registration", async () => {
    fixture.rpc.mockResolvedValue({ data: campaign });
    const first = show();
    const popup = await screen.findByRole("dialog", {
      name: "Masaarat is free for a limited time",
    });
    expect(popup.querySelector("time")?.getAttribute("datetime")).toBe(campaign.ends_at);
    expect(screen.getByRole("link", { name: "Start learning" }).getAttribute("href")).toBe(
      "/signup",
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    first.unmount();
    show();
    await waitFor(() => expect(fixture.rpc).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("sends learners back to their journey and keeps email preferences optional", async () => {
    fixture.signedIn = true;
    fixture.rpc.mockResolvedValue({ data: campaign });
    show();
    const start = await screen.findByRole("link", { name: "Start learning" });
    expect(start.getAttribute("href")).toBe("/my-learning");
    expect(
      screen.getByRole("link", { name: "Offer email preferences (optional)" }).getAttribute("href"),
    ).toBe("/payments#mail-preferences");
  });

  it("leaves the page clear when the campaign has ended", async () => {
    fixture.rpc.mockResolvedValue({ data: { ...campaign, server_time: campaign.ends_at } });
    show();
    await waitFor(() => expect(fixture.rpc).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
