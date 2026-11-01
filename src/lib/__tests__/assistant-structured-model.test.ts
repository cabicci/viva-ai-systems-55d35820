// @vitest-environment node
import { expect, it, vi } from "vitest";
import { callDirectAssistantModel } from "../../../supabase/functions/assistant-runtime/direct-model";
import { ASSISTANT_ANSWER_FORMAT, parseAssistantAnswer } from "../../../supabase/functions/assistant-runtime/answer-contract";

const decision = { grounding: "supported", answer: "An evidence-based explanation.", sourceIds: ["admitted-chunk-id"] };
function provider(content: string, finish_reason: string = "stop", refusal: unknown = null) {
  return vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
    choices: [{ finish_reason, message: { content, refusal } }],
  })));
}

it("requests the strict schema from the same bounded direct model and validates the result without retry", async () => {
  const request = provider(JSON.stringify(decision));
  expect(await callDirectAssistantModel("Policy", "Question and verified evidence", "fixture-only", request))
    .toEqual({ ok: true, answer: JSON.stringify(decision) });
  expect(request).toHaveBeenCalledTimes(1);
  const [url, options] = request.mock.calls[0];
  expect(url).toBe("https://api.openai.com/v1/chat/completions");
  expect(JSON.parse(String(options!.body))).toMatchObject({
    model: "gpt-4.1-mini-2025-04-14", max_tokens: 1800, temperature: 0.2, stream: false,
    response_format: ASSISTANT_ANSWER_FORMAT,
  });
  expect(ASSISTANT_ANSWER_FORMAT.json_schema.strict).toBe(true);
  expect(ASSISTANT_ANSWER_FORMAT.json_schema.schema.additionalProperties).toBe(false);
});

it.each(["length", "content_filter", "tool_calls", ""])("rejects unfinished/filtered output %s even if its JSON parses", async finish => {
  const request = provider(JSON.stringify(decision), finish);
  expect(await callDirectAssistantModel("Policy", "Question", "fixture-only", request))
    .toEqual({ ok: false, status: 502, error: "ASSISTANT_PROVIDER_INVALID_RESPONSE",
      detail: `finish_${finish === "" ? "other" : finish}` });
  expect(request).toHaveBeenCalledTimes(1);
});

it("does not mistake provider refusal metadata for a successful curriculum answer", async () => {
  const request = provider(JSON.stringify(decision), "stop", "PRIVATE_PROVIDER_REFUSAL");
  const response = await callDirectAssistantModel("Policy", "Question", "fixture-only", request);
  expect(response).toMatchObject({ ok: false, status: 502 });
  expect(JSON.stringify(response)).not.toContain("PRIVATE_PROVIDER_REFUSAL");
});

it.each(["Plain legacy text", "{bad json", JSON.stringify({ ...decision, sourceIds: [] }),
  JSON.stringify({ ...decision, sourceIds: Array(9).fill("source") }),
  JSON.stringify({ ...decision, answer: "x".repeat(16001) }),
  JSON.stringify({ ...decision, sourceIds: ["x".repeat(513)] }),
  JSON.stringify({ ...decision, unexpected: true }),
])("rejects malformed, untyped or unbounded output", async content => {
  const request = provider(content);
  expect(await callDirectAssistantModel("Policy", "Question", "fixture-only", request))
    .toMatchObject({ ok: false, status: 502 });
  expect(request).toHaveBeenCalledTimes(1);
});

it("accepts an explicit empty-citation insufficient decision without guessing from refusal wording", () => {
  expect(parseAssistantAnswer(JSON.stringify({ grounding: "insufficient", answer: "Any locale wording", sourceIds: [] })))
    .toEqual({ grounding: "insufficient", answer: "Any locale wording", sourceIds: [] });
  expect(parseAssistantAnswer(JSON.stringify({ ...decision, answer: "  Trimmed explanation  " }))?.answer)
    .toBe("Trimmed explanation");
});

it("constrains provider sourceIds to the exact admitted IDs while keeping the strict schema", async () => {
  const admitted = ["ar-EG/intro-m1-l6-learn-without-fear/s1/c0", "ar-EG/intro-m1-l6-learn-without-fear/s2/c0"];
  const request = provider(JSON.stringify({ ...decision, sourceIds: [admitted[0]] }));
  await callDirectAssistantModel("Policy", "Question", "fixture-only", request, admitted);
  const format = JSON.parse(String(request.mock.calls[0][1]!.body)).response_format;
  expect(format.json_schema.strict).toBe(true);
  expect(format.json_schema.schema.additionalProperties).toBe(false);
  expect(format.json_schema.schema.properties.sourceIds).toEqual({ type: "array", items: { type: "string", enum: admitted }, maxItems: 2 });
});
