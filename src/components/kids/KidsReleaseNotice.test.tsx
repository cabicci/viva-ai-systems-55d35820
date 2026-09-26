import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KidsReleaseNotice } from "./KidsReleaseNotice";

const mock = vi.hoisted(() => ({ rpc: vi.fn(), locale: "ar-MSA" }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mock.rpc } }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: mock.locale }) }));

beforeEach(() => {
  vi.resetAllMocks();
  mock.locale = "ar-MSA";
});

describe("Kids public release notice", () => {
  it("shows an accurate closed-state notice while no market is released", async () => {
    mock.rpc.mockResolvedValue({ data: false, error: null });
    render(<KidsReleaseNotice />);
    expect(screen.getByRole("status")).toHaveTextContent("الدروس والفيديوهات جاهزة");
    await waitFor(() => expect(mock.rpc).toHaveBeenCalledWith("kids_public_launch_open"));
    expect(screen.getByRole("status")).toHaveTextContent("لم يُفعّلا بعد");
  });

  it("removes the closed-state claim when the server reports a launch", async () => {
    mock.rpc.mockResolvedValue({ data: true, error: null });
    render(<KidsReleaseNotice />);
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("fails closed when the readiness endpoint is unavailable", async () => {
    mock.locale = "en";
    mock.rpc.mockResolvedValue({ data: null, error: { message: "unavailable" } });
    render(<KidsReleaseNotice />);
    await waitFor(() => expect(mock.rpc).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("status")).toHaveTextContent("have not been opened");
  });
});
