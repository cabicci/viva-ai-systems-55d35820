// @vitest-environment node
import { describe, expect, it } from "vitest";
import * as contract from "../../../supabase/functions/_shared/assistant-question-contract.ts";
import * as existing from "../../../supabase/functions/assistant-runtime/question-metering.ts";

describe("runtime-neutral assistant question contract", () => {
  it("preserves the established exports without a second implementation", () => {
    expect(existing.questionBalance).toBe(contract.questionBalance);
    expect(existing.questionRpcFailure).toBe(contract.questionRpcFailure);
    expect(existing.validQuestionId).toBe(contract.validQuestionId);
  });
  it("preserves validated zero and positive balances and optional boolean flags", () => {
    expect(contract.questionBalance({ monthly_remaining: 0, purchased_remaining: 7, access_allowed: false, unlimited: true })).toEqual({ monthly_remaining: 0, purchased_remaining: 7, access_allowed: false, unlimited: true });
  });
  it.each([null, [], {}, {monthly_remaining: -1, purchased_remaining: 0}, {monthly_remaining: 0, purchased_remaining: 0.5}, {monthly_remaining: Number.MAX_SAFE_INTEGER + 1, purchased_remaining: 0}])("denies malformed balances %#", value => {
    expect(contract.questionBalance(value)).toBeNull();
  });
  it("retains the safe error mapping and hides unknown provider errors", () => {
    expect(contract.questionRpcFailure("ASSISTANT_QUOTA_EXCEEDED")).toEqual({ok:false,status:429,error:"ASSISTANT_QUOTA_EXCEEDED"});
    expect(contract.questionRpcFailure(new Error("provider details"))).toEqual({ok:false,status:503,error:"ASSISTANT_BILLING_UNAVAILABLE"});
  });
  it("retains UUID validation", () => {
    expect(contract.validQuestionId("9d2a93fc-c371-4d26-a461-e303d6d7915a")).toBe(true);
    expect(contract.validQuestionId("invalid")).toBe(false);
  });
});
