#!/usr/bin/env bun
/**
 * Deterministic corpus verification — read-only, no paid API calls.
 * Usage: bun run scripts/rag/verify-corpus.ts
 */
import path from "node:path";
import { verifyCorpus } from "../../src/lib/rag/corpus-verification";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const report = verifyCorpus(REPO_ROOT);

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
