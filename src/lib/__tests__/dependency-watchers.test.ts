// @vitest-environment node
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import chokidar from "chokidar";
import fsDriver from "unstorage/drivers/fs";
import { describe, expect, it } from "vitest";

describe("Chokidar 4 compatibility for the installed directory-watch consumers", () => {
  it("reports route-file creation, edits and removal from an absolute directory", async () => {
    const base = await mkdtemp(join(tmpdir(), "masaarat-router-watch-"));
    const directory = join(base, "routes{literal}");
    await mkdir(directory);
    const watcher = chokidar.watch(directory, { ignoreInitial: true, atomic: false });
    try {
      await once(watcher, "ready");
      const file = join(directory, "route.tsx");
      const added = once(watcher, "add");
      await writeFile(file, "export default 1");
      expect((await added)[0]).toBe(file);
      const changed = once(watcher, "change");
      await writeFile(file, "export default 22");
      expect((await changed)[0]).toBe(file);
      const removed = once(watcher, "unlink");
      await rm(file);
      expect((await removed)[0]).toBe(file);
    } finally {
      await watcher.close();
      await rm(base, { recursive: true, force: true });
    }
  }, 10_000);
  it("keeps unstorage filesystem notifications and cleanup working", async () => {
    const base = await mkdtemp(join(tmpdir(), "masaarat-storage-watch-"));
    const driver = fsDriver({ base, watchOptions: { atomic: false } });
    let resolveEvent: (event: [string, string]) => void = () => {};
    const next = () =>
      new Promise<[string, string]>((resolve) => {
        resolveEvent = resolve;
      });
    const stop = await driver.watch!((event, key) => resolveEvent([event, key]));
    try {
      const updated = next();
      await writeFile(join(base, "record"), "value");
      expect(await updated).toEqual(["update", "record"]);
      const removed = next();
      await rm(join(base, "record"));
      expect(await removed).toEqual(["remove", "record"]);
    } finally {
      await stop!();
      await rm(base, { recursive: true, force: true });
    }
  }, 10_000);
});
