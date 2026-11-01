// @vitest-environment node
import { expect, it, vi } from "vitest";
import { callDirectAssistantModel } from "../../../supabase/functions/assistant-runtime/direct-model";

const call = (impl: () => Promise<Response>) => {
  const request = vi.fn<typeof fetch>().mockImplementation(impl);
  return { request, run: () => callDirectAssistantModel("SECRET_SOURCE", "SECRET_QUESTION", "test-only", request) };
};
const reply = (choice: unknown) => async () => new Response(JSON.stringify({ choices: [choice] }));

it.each([
  ["upstream 401", async () => new Response("PRIVATE", { status: 401 }), "upstream_http_401"],
  ["timeout", async () => { throw Object.assign(new Error("t"), { name: "TimeoutError" }); }, "timeout"],
  ["network", async () => { throw new TypeError("net"); }, "network"],
  ["length", reply({ finish_reason: "length", message: { content: "{" } }), "finish_length"],
  ["unknown finish", reply({ finish_reason: "PRIVATE_REASON", message: { content: "{}" } }), "finish_other"],
  ["refusal", reply({ finish_reason: "stop", message: { content: "x", refusal: "PRIVATE" } }), "refusal_present"],
  ["missing", reply({ finish_reason: "stop", message: {} }), "content_missing"],
  ["schema", reply({ finish_reason: "stop", message: { content: '{"grounding":"supported","answer":"SECRET","sourceIds":[]}' } }), "schema_invalid"],
] as const)("classifies %s with one call, no retry and no content", async (_n, impl, detail) => {
  const { request, run } = call(impl as () => Promise<Response>);
  const result = await run();
  expect(result).toMatchObject({ ok: false, detail });
  expect(request).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(result)).not.toMatch(/SECRET|PRIVATE|test-only/);
});
