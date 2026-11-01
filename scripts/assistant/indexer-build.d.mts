export const INDEXER_ALGORITHM_INPUTS: readonly string[];
export const ASSISTANT_DEPLOYMENT_INPUTS: readonly string[];
export function computeAssistantBuildIdentities(root?: string): {
  indexerBuild: string;
  deploymentFingerprint: string;
};
