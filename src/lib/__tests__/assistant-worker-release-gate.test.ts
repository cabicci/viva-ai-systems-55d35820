// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import { expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../../..");
const yaml = createRequire(import.meta.url)("js-yaml");
const workflow = yaml.load(readFileSync(path.join(root, ".github/workflows/assistant-auto-index.yml"), "utf8"));
const job = workflow.jobs["prepare-approved-content"];
const repository = "cabicci/viva-ai-systems-55d35820";
const enabled = "MASAARAT_ASSISTANT_INDEXING_RELEASE_ENABLED";

// Evaluate the actual checked-in condition with virtual GitHub/vars contexts.
// No GitHub call, variable mutation, OIDC token, workflow or worker is run.
function admitted(value?: string, overrides: Record<string, unknown> = {}) {
  const github = { repository, event_name: "schedule", event: {}, ...overrides };
  const vars = value === undefined ? {} : { [enabled]: value };
  return vm.runInNewContext("Boolean(" + job.if + ")", { github, vars }, { timeout: 100 });
}

it.each([undefined, "", "false", "False", "1", "true "])("skips production maintenance for absent/disabled release value %s", value => {
  for (const event_name of ["schedule", "workflow_dispatch", "workflow_run"])
    expect(admitted(value, { event_name })).toBe(false);
});

it("retains trusted successful main-CI admission only after explicit release enablement", () => {
  expect(admitted("true")).toBe(true);
  expect(admitted("true", { event_name: "workflow_dispatch" })).toBe(true);
  const run = { conclusion: "success", event: "push", head_branch: "main", head_repository: { full_name: repository } };
  expect(admitted("true", { event_name: "workflow_run", event: { workflow_run: run } })).toBe(true);
  for (const changed of [
    { conclusion: "failure" }, { event: "pull_request" }, { head_branch: "other" },
    { head_repository: { full_name: "other/repository" } },
  ]) expect(admitted("true", { event_name: "workflow_run", event: { workflow_run: { ...run, ...changed } } })).toBe(false);
  expect(admitted("true", { repository: "cabicci/masaarat-capacity-staging-20261019" })).toBe(false);
});

it("preserves automatic indexing, trusted-main checkout and existing OIDC permissions", () => {
  expect(workflow.on.schedule).toEqual([{ cron: "*/15 * * * *" }]);
  expect(job.steps[0].with).toMatchObject({ ref: "main", "persist-credentials": false });
  expect(job.permissions).toEqual({ contents: "read", "id-token": "write" });
  expect(job.steps.at(-1).run).toBe("bun run scripts/assistant/automatic-worker-client.ts");
});
