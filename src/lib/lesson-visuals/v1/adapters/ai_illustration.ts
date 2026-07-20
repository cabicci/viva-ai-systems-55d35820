import type { AdapterContext, AdapterResult } from "../types";

/**
 * AI text-free illustration adapter.
 * Refuses paid generation unless authId + costCeilingUsd are provided.
 * Local library path never performs paid calls.
 */
export async function generateAiIllustration(
  ctx: AdapterContext,
): Promise<AdapterResult> {
  const contract = ctx.master.aiPromptContract;
  if (!contract) {
    return {
      ok: false,
      error: "ai_illustration: master.aiPromptContract is null",
    };
  }
  if (contract.paidAllowed !== false || contract.textFree !== true) {
    return {
      ok: false,
      error: "ai_illustration: contract must be paidAllowed:false and textFree:true",
    };
  }

  const wantsPaid = (ctx.costCeilingUsd ?? 0) > 0 || Boolean(ctx.authId);
  // Paid path requires BOTH auth id and explicit cost ceiling.
  if (wantsPaid) {
    if (!ctx.authId || ctx.authId.trim().length === 0) {
      return {
        ok: false,
        skippedPaid: true,
        error: "ai_illustration: paid refused — missing authId",
      };
    }
    if (
      ctx.costCeilingUsd === undefined ||
      ctx.costCeilingUsd === null ||
      ctx.costCeilingUsd <= 0
    ) {
      return {
        ok: false,
        skippedPaid: true,
        error: "ai_illustration: paid refused — costCeilingUsd required",
      };
    }
    // Even with credentials, this candidate pipeline does not call paid providers.
    return {
      ok: false,
      skippedPaid: true,
      error:
        "ai_illustration: paid providers disabled in candidate pipeline (no paid AI generation)",
    };
  }

  if (ctx.fixtureMode) {
    return {
      ok: false,
      error:
        "ai_illustration: fixtureMode does not synthesize AI pixels; use deterministic fixture",
    };
  }

  return {
    ok: false,
    error:
      "ai_illustration: unpaid local generation not implemented; workflow-owned when enabled",
  };
}
