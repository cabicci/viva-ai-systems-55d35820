import { expect, it } from "vitest";
import { historyKey } from "@/lib/card-assistant/history";
import { assistantScopeKey } from "@/lib/card-assistant/types";
it("separates an admitted AI course from a legacy path with the same semantic ID without changing the old history key", () => {
  const legacy = { area: "ai" as const, cardId: "intro", locale: "en" as const };
  const admitted = { ...legacy, admitted: true as const };
  expect(historyKey(legacy, "account")).toBe(
    'masaarat.card-assistant.v1:["account","ai","intro",null,"en"]',
  );
  expect(historyKey(admitted, "account")).not.toBe(historyKey(legacy, "account"));
  expect(assistantScopeKey(admitted, "account")).not.toBe(assistantScopeKey(legacy, "account"));
});
