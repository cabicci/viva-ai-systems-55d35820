import {
  automaticTick as runExistingTick,
  currentAutomaticPlans,
  executeAutomaticScope,
} from "@/lib/assistant-automation/worker.server";
import { automationRpc } from "@/lib/assistant-automation/store.server";
import { CARD_REGISTRY } from "@/lib/card-assistant/registry";
import { curriculumAutomaticPlans, indexCurriculumScope } from "./index.server";
declare const __ASSISTANT_INDEXER_BUILD__: string;
/** Add admitted curricula to the same queue and lease driver. The existing
 * algorithm modules and manifest identities are untouched, so a feature release
 * does not queue every already completed curriculum for duplicate indexing. */
export function automaticTick(
  requestId: string,
  _dependencies?: undefined,
  pruneResponseCache = false,
) {
  return runExistingTick(
    requestId,
    {
      plans: async () => {
        const [existing, added] = await Promise.all([
          currentAutomaticPlans(),
          curriculumAutomaticPlans(__ASSISTANT_INDEXER_BUILD__),
        ]);
        if (existing.length + added.length > 200) throw new Error("AUTOMATION_SCOPE_LIMIT");
        return [...existing, ...added];
      },
      rpc: automationRpc,
      registry: CARD_REGISTRY,
      execute: (lease) =>
        "adapter" in lease.manifest && lease.manifest.adapter === "curriculum"
          ? indexCurriculumScope(lease)
          : executeAutomaticScope(lease),
    },
    pruneResponseCache,
  );
}
