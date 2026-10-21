#!/usr/bin/env bun
import fs from "node:fs";
import path from "node:path";
import { writeCurrentAiRelease } from "../../src/lib/rag/current-source-release";
import type { PackageManifest, RagChunkRecord } from "../../src/lib/rag/types";

const root = path.resolve(import.meta.dirname, "../..");
const release = writeCurrentAiRelease(root);
const previous = JSON.parse(fs.readFileSync(path.join(root, "artifacts/rag/package-manifest.json"), "utf8")) as PackageManifest;
const oldChunks = JSON.parse(fs.readFileSync(path.join(root, "artifacts/rag/chunks.json"), "utf8")) as RagChunkRecord[];
const oldById = new Map(oldChunks.map(c => [c.chunkId, c]));
const currentById = new Map(release.chunks.map(c => [c.chunkId, c]));
const changedPackages = release.packageManifest.packages.filter(p => previous.packages.find(old => old.packagePath === p.packagePath)?.packageChecksum !== p.packageChecksum);
const textChangedPackages = changedPackages.filter(p => release.chunks.filter(c => c.packagePath === p.packagePath).some(c => oldById.get(c.chunkId)?.textChecksum !== c.textChecksum) || oldChunks.some(c => c.packagePath === p.packagePath && !currentById.has(c.chunkId)));
const report = { releaseId: release.approval.releaseId, indexVersion: release.approval.indexVersion,
  packages: release.packageManifest.packageCount, chunks: release.chunks.length, changedPackages: changedPackages.length,
  changedRetrievablePackages: textChangedPackages.length, changedOrNewChunks: release.chunks.filter(c => oldById.get(c.chunkId)?.textChecksum !== c.textChecksum).length,
  removedChunkIds: oldChunks.filter(c => !currentById.has(c.chunkId)).map(c => c.chunkId),
  changedPackagePaths: changedPackages.map(p => p.packagePath),
  exampleChanges: release.chunks.filter(c => oldById.has(c.chunkId) && oldById.get(c.chunkId)!.textChecksum !== c.textChecksum).slice(0, 3).map(c => ({ chunkId: c.chunkId, before: oldById.get(c.chunkId)!.displayText.slice(0, 500), after: c.displayText.slice(0, 500) })) };
fs.writeFileSync(path.join(root, "artifacts/rag/current/change-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report, changedPackagePaths: undefined, exampleChanges: undefined, removedChunkIds: report.removedChunkIds.length }));
