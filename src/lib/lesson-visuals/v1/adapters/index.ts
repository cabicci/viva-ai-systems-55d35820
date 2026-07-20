import type { AdapterContext, AdapterResult } from "../types";
import { renderDeterministicSvg } from "./deterministic";
import { captureScreenshot } from "./screenshot";
import { generateAiIllustration } from "./ai_illustration";
import { renderHybrid } from "./hybrid";

export async function runMethodAdapter(
  ctx: AdapterContext,
): Promise<AdapterResult> {
  switch (ctx.method) {
    case 1:
      return renderDeterministicSvg(ctx);
    case 2:
      return generateAiIllustration(ctx);
    case 3:
      return captureScreenshot(ctx);
    case 4:
      return renderHybrid(ctx);
    default: {
      const _exhaustive: never = ctx.method;
      return { ok: false, error: `Unknown method: ${_exhaustive}` };
    }
  }
}

export {
  renderDeterministicSvg,
  captureScreenshot,
  generateAiIllustration,
  renderHybrid,
};
