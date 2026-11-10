// Keep the instrumented Vite build in lockstep with the reviewed product build.
// Arbitrary package commands must be reviewed here before this harness executes them.
const GUARDS = [
  ["assistant:verify"],
  ["roadmap:guard", "--for-build"],
  ["contextual-visuals:verify"],
];
export const REVIEWED_BUILD = [
  ...GUARDS.map((args) => ["bun", "run", ...args].join(" ")),
  "vite build",
].join(" && ");

export function runReviewedBuildGuards(buildScript, run) {
  if (buildScript !== REVIEWED_BUILD) {
    throw new Error("Build script differs from the reviewed B023 sequence; inspect rather than skipping a build step");
  }
  for (const args of GUARDS) run(...args);
}

