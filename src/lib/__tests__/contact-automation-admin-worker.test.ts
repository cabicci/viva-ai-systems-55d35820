// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  readContactAdministrationCommand,
  runContactAdministrationCommand,
  isContactAdministrationCommand,
  verifyContactAdministrator,
} from "../../../supabase/functions/_shared/contact-automation-admin-worker";
const command = {
  actor: "11111111-1111-4111-8111-111111111111",
  action: "status" as const,
  id: null,
  reference: null,
};
const request = (value: unknown) =>
  new Request("https://example.test", { method: "POST", body: JSON.stringify(value) });
describe("administration uses the sending worker's routing source without sending", () => {
  it("reads the canonical worker address and executes only the protected admin command", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { ownerConfigured: true }, error: null });
    const parsed = await readContactAdministrationCommand(
      request({ contactAdministration: command }),
    );
    expect(await runContactAdministrationCommand({ rpc }, parsed!, "WORKER@example.test")).toEqual({
      ownerConfigured: true,
    });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("admin_contact_automation_command", {
      p_actor: command.actor,
      p_action: "status",
      p_id: null,
      p_owner: "worker@example.test",
      p_reference: null,
    });
  });
  it.each([
    { contactAdministration: { ...command, action: "send" } },
    { contactAdministration: { ...command, actor: "not-uuid" } },
    { contactAdministration: { ...command, p_owner: "spoofed@example.test" } },
    { contactAdministration: command, immediate: { stream: "contact", id: command.actor } },
    {
      contactAdministration: {
        ...command,
        action: "close_manual",
        id: command.actor,
        reference: null,
      },
    },
  ])("rejects an invalid admin mode without falling through to batch work", async (body) => {
    await expect(readContactAdministrationCommand(request(body))).rejects.toThrow(
      "contact_admin_request_invalid",
    );
  });
  it("fails closed on database role rejection with no other RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: "CONTACT_ADMIN_REQUIRED" });
    await expect(runContactAdministrationCommand({ rpc }, command, undefined)).rejects.toThrow(
      "contact_admin_unavailable",
    );
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("keeps authorization before mode parsing and a direct return before all send work", () => {
    const source = readFileSync("supabase/functions/account-welcome-job/index.ts", "utf8");
    const authorization = source.indexOf("if (!(await authorizedWelcomeJob");
    const parsing = source.indexOf(
      "contactAdministration = await readContactAdministrationCommand",
    );
    expect(authorization).toBeGreaterThanOrEqual(0);
    expect(parsing).toBeGreaterThanOrEqual(0);
    expect(authorization).toBeLessThan(parsing);
    const branch = source.slice(
      source.indexOf("if (contactAdministration) {"),
      source.indexOf("const loadAcademicTitles"),
    );
    expect(branch).toContain("return Response.json");
    expect(branch).toContain("runContactAdministrationCommand");
    expect(branch).not.toMatch(/runContactAutomationJob|sendTransactionalEmail|prepare_contact/);
  });
});

describe("contact administration end-user identity", () => {
  it.each([undefined, "Bearer wrong-user", "Bearer rejected"])(
    "rejects an absent or mismatched identity %s",
    async (header) => {
      const getUser = vi.fn().mockResolvedValue({
        data: { user: header === "Bearer wrong-user" ? { id: "another-user" } : null },
        error: null,
      });
      const request = new Request("https://example.test", {
        headers: header ? { "X-Contact-Admin-Authorization": header } : {},
      });
      expect(await verifyContactAdministrator(request, command, { getUser })).toBe(false);
      if (!header) expect(getUser).not.toHaveBeenCalled();
    },
  );
  it("verifies the forwarded token against Auth before accepting the actor", async () => {
    const getUser = vi
      .fn()
      .mockResolvedValue({ data: { user: { id: command.actor } }, error: null });
    const request = new Request("https://example.test", {
      headers: { "X-Contact-Admin-Authorization": "Bearer user-token" },
    });
    expect(await verifyContactAdministrator(request, command, { getUser })).toBe(true);
    expect(getUser).toHaveBeenCalledExactlyOnceWith("user-token");
  });
});
