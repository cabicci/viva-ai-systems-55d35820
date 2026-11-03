import { automaticTick as runExistingTick } from "@/lib/assistant-automation/worker.server";
import { automationRpc } from "@/lib/assistant-automation/store.server";
import { CARD_REGISTRY } from "@/lib/card-assistant/registry";
import { curriculumAutomaticPlans, indexCurriculumScope } from "./index.server";
declare const __ASSISTANT_INDEXER_BUILD__: string;
/** Admission worker: the only plans offered to the shared queue are approved,
 * pending curriculum versions admitted through the Add Curriculum workflow.
 * Legacy catalogue manifests are never enumerated or registered here, so their
 * stored indexes stay untouched and their old queued jobs are no longer claimable
 * (claim only selects from the keys passed). The shared single-worker lock,
 * global busy/uncertain-hold checks and in-flight leases are unchanged. */
export function automaticTick(
  requestId: string,
  _dependencies?: undefined,
  pruneResponseCache = false,
) {
  return runExistingTick(
    requestId,
    {
      plans: async () => {
        const added = await curriculumAutomaticPlans(__ASSISTANT_INDEXER_BUILD__);
        if (added.length > 200) throw new Error("AUTOMATION_SCOPE_LIMIT");
        return added;
      },
      rpc: automationRpc,
      registry: CARD_REGISTRY,
      execute: async (lease) => {
        if (!("adapter" in lease.manifest) || lease.manifest.adapter !== "curriculum")
          throw new Error("AUTOMATION_SCOPE_NOT_ADMITTED");
        return indexCurriculumScope(lease);
      },
    },
    pruneResponseCache,
  );
}
