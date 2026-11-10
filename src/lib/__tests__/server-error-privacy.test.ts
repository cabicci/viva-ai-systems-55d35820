// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import server from "../../server";

const { fetchHandler } = vi.hoisted(() => ({ fetchHandler: vi.fn() }));
vi.mock("@tanstack/react-start/server-entry", () => ({ default: { fetch: fetchHandler } }));

function request() {
  return server.fetch(new Request("https://example.test/lesson"), {}, {});
}

afterEach(() => {
  fetchHandler.mockReset();
  vi.restoreAllMocks();
});

describe("server error diagnostics", () => {
  it("renders the branded fallback with a fixed diagnostic for an unhandled HTTPError", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchHandler.mockResolvedValue(Response.json({ unhandled: true, message: "HTTPError" }, { status: 500 }));

    const response = await request();

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(log.mock.calls).toEqual([["SSR_HTTP_ERROR_NORMALIZED"]]);
  });

  it("keeps a thrown exception's private message out of shared diagnostics", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchHandler.mockRejectedValue(new Error("SYNTHETIC_PRIVATE_MARKER"));

    const response = await request();

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("SYNTHETIC_PRIVATE_MARKER");
    expect(log.mock.calls).toEqual([["SERVER_REQUEST_FAILED"]]);
  });

  it("leaves a large application error body and status intact", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const payload = { error: "service unavailable", detail: "x".repeat(2_048) };
    fetchHandler.mockResolvedValue(Response.json(payload, { status: 503 }));

    const response = await request();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(payload);
    expect(log).not.toHaveBeenCalled();
  });

  it("returns a stalled response without waiting for its body to finish", async () => {
    let controller: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({ start: (c) => { controller = c; } });
    fetchHandler.mockResolvedValue(new Response(body, {
      status: 503,
      headers: { "content-type": "application/json" },
    }));

    const response = await request();
    controller!.enqueue(new TextEncoder().encode('{"error":"late response"}'));
    controller!.close();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "late response" });
  });
});
