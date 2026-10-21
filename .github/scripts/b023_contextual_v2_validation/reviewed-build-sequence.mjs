// Keep the instrumented Vite build in lockstep with the reviewed product build.
// Arbitrary package commands must be reviewed here before this harness executes them.
const GUARDS = Object.freeze(["assistant:verify", "roadmap:guard", "contextual-visuals:verify"]);
export const REVIEWED_BUILD = [...GUARDS.map((script) => `bun run ${script}`), "vite build"].join(" && ");

export function runReviewedBuildGuards(buildScript, run) {
  if (buildScript !== REVIEWED_BUILD) {
    throw new Error("Build script differs from the reviewed B023 sequence; inspect rather than skipping a build step");
  }
  for (const script of GUARDS) run(script);
}

