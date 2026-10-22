// @vitest-environment node
import { expect, it } from "vitest";
import { currentReleaseFailureCode } from "../rag/current-release/contracts";
it.each([400, 401, 403, 429, 500, 503])("returns only the provider HTTP status %i", status => {
  expect(currentReleaseFailureCode(new Error(`PROVIDER_FAILED:HTTP_${status}`))).toBe(`CURRENT_PROVIDER_HTTP_${status}`);
});
it("retains bounded database/lease diagnostics without source details", () => {
  expect(currentReleaseFailureCode(new Error("CURRENT_LEASE_INVALID"))).toBe("CURRENT_LEASE_INVALID");
});
it("distinguishes a bounded provider timeout from an unavailable connection", () => {
  expect(currentReleaseFailureCode(new Error("PROVIDER_FAILED:TIMEOUT"))).toBe("CURRENT_PROVIDER_TIMEOUT");
  expect(currentReleaseFailureCode(new Error("PROVIDER_FAILED"))).toBe("CURRENT_PROVIDER_UNAVAILABLE");
});
it.each(["key sk-private; private teaching body", "CURRENT_FAILURE private detail", "PROVIDER_FAILED:HTTP_429 secret", "CURRENT_" + "A".repeat(65)])("never returns arbitrary diagnostic text", message => {
  expect(currentReleaseFailureCode(new Error(message))).toBe("CURRENT_OPERATION_UNAVAILABLE");
});
