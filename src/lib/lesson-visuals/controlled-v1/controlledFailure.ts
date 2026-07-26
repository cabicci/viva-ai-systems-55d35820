import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { CONTROLLED_FAILURE_TARGET_CELL_ID } from "./constants";
import { CONTROLLED_FAILURE_STATE_PATH } from "./paths";
import type { RunnerMode } from "./types";

export interface ControlledFailureState {
  triggered: boolean;
  triggeredAt: string | null;
  cellId: string | null;
}

function readState(path: string = CONTROLLED_FAILURE_STATE_PATH): ControlledFailureState {
  if (!existsSync(path)) {
    return { triggered: false, triggeredAt: null, cellId: null };
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ControlledFailureState;
  } catch {
    return { triggered: false, triggeredAt: null, cellId: null };
  }
}

function writeState(
  state: ControlledFailureState,
  path: string = CONTROLLED_FAILURE_STATE_PATH,
): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

/**
 * Decides whether to inject the controlled failure for this cell.
 *
 * HARD INVARIANT: mode === "full-400" always returns false, unconditionally,
 * regardless of any persisted state. The controlled failure is impossible in
 * full-400 by construction — it is never even consulted for a decision there.
 */
export function shouldInjectControlledFailure(
  mode: RunnerMode,
  cid: string,
  path: string = CONTROLLED_FAILURE_STATE_PATH,
): boolean {
  if (mode === "full-400" || mode === "method-c-remaining") return false;
  if (mode !== "pilot") return false;
  if (cid !== CONTROLLED_FAILURE_TARGET_CELL_ID) return false;
  const state = readState(path);
  return !state.triggered;
}

export function markControlledFailureTriggered(
  cid: string,
  path: string = CONTROLLED_FAILURE_STATE_PATH,
): void {
  writeState({ triggered: true, triggeredAt: new Date().toISOString(), cellId: cid }, path);
}

export function getControlledFailureState(
  path: string = CONTROLLED_FAILURE_STATE_PATH,
): ControlledFailureState {
  return readState(path);
}

export function resetControlledFailureState(path: string = CONTROLLED_FAILURE_STATE_PATH): void {
  if (existsSync(path)) rmSync(path, { force: true });
}
