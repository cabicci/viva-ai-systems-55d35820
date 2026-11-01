// @vitest-environment node
import { expect, it } from "vitest";
import { corsHeadersFor } from "../../../supabase/functions/assistant-runtime/runtime-cors";
const preview = "https://id-preview--0d675f0a-ecc5-4c62-9217-54973c927902.lovable.app";
const actualPreview = "https://0d675f0a-ecc5-4c62-9217-54973c927902.lovableproject.com";
const staging = "https://rifujqqlqtfmopaukghn.supabase.co";
const production = "https://abyqqeboyrkkwhjpwmtd.supabase.co";
const request = (origin: string) => new Request("https://runtime.invalid", { headers: { Origin: origin } });

it("allows the verified staging preview only on the pinned staging backend", () => {
  expect(corsHeadersFor(request(preview), staging)["Access-Control-Allow-Origin"]).toBe(preview);
  expect(corsHeadersFor(request(preview), staging + "/")["Access-Control-Allow-Origin"]).toBe(preview);
  expect(corsHeadersFor(request(preview), production)["Access-Control-Allow-Origin"]).toBe("");
  expect(corsHeadersFor(request(preview))["Access-Control-Allow-Origin"]).toBe("");
});
it("preserves existing public origins without admitting arbitrary previews", () => {
  expect(corsHeadersFor(request("https://masaarat.ai"), production)["Access-Control-Allow-Origin"]).toBe("https://masaarat.ai");
  expect(corsHeadersFor(request(preview + ".example.invalid"), staging)["Access-Control-Allow-Origin"]).toBe("");
  expect(corsHeadersFor(request("https://example.invalid"), staging)["Access-Control-Allow-Origin"]).toBe("");
});
it.each(["OPTIONS", "POST"])("admits the actual stage %s origin with the existing bounded method/header contract", (method) => {
  const req = new Request("https://runtime.invalid", { method, headers: { Origin: actualPreview } });
  const headers = corsHeadersFor(req, staging);
  expect(headers).toEqual({
    "Access-Control-Allow-Origin": actualPreview,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  });
});
it.each([production, undefined, "https://other-project.supabase.co"])("refuses the actual stage origin on a different or absent backend %s", (backend) => {
  expect(corsHeadersFor(request(actualPreview), backend)["Access-Control-Allow-Origin"]).toBe("");
});
it.each([
  actualPreview + ".example.invalid",
  "https://other-project.lovableproject.com",
  actualPreview.replace("https:", "http:"),
])("refuses lookalike origins %s on staging", (origin) => {
  expect(corsHeadersFor(request(origin), staging)["Access-Control-Allow-Origin"]).toBe("");
});
