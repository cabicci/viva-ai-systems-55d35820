// @vitest-environment node
import { expect, it } from "vitest";
import { corsHeadersFor } from "../../../supabase/functions/assistant-runtime/runtime-cors";
const preview = "https://id-preview--0d675f0a-ecc5-4c62-9217-54973c927902.lovable.app";
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
