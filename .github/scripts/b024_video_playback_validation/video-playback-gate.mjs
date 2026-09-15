#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const GUID = "49f45275-18f2-42f8-b9eb-53bcab98098a";
const LIBRARY_ID = "670679";
const LESSON_ID = "intro-m1-l5-ai-vs-software";
const LOCALE = "ar-EG";

function fail(message, details) {
  const suffix = details === undefined ? "" : `\n${JSON.stringify(details, null, 2)}`;
  throw new Error(`${message}${suffix}`);
}

function localOrigin(name, fallback) {
  const value = process.env[name] || fallback;
  const url = new URL(value);
  if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname)) {
    fail(`${name} must use a loopback origin`, { origin: url.origin });
  }
  return url.origin;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function isBunnyHost(hostname) {
  return (
    hostname === "iframe.mediadelivery.net" ||
    hostname.endsWith(".mediadelivery.net") ||
    hostname.endsWith(".b-cdn.net") ||
    hostname.endsWith(".bunnycdn.com")
  );
}

const repo = resolve(process.env.B023_REPO_ROOT || process.cwd());
const expectedHead = (process.env.B023_EXPECTED_GIT_HEAD || "").trim();
const baseOrigin = localOrigin("B023_BASE_URL", "http://127.0.0.1:4173");
const supabaseOrigin = localOrigin("B023_LOCAL_SUPABASE_ORIGIN", "http://127.0.0.1:54321");
const statePath = resolve(process.env.B023_AUTH_STORAGE_STATE || "");
const fixtureId = (process.env.B023_DISPOSABLE_FIXTURE_ID || "").trim();
if (!/^[a-f0-9]{40}$/i.test(expectedHead)) fail("Exact candidate SHA is required");
if (!statePath || !existsSync(statePath)) fail("Normal-login storage state is required");
if (!fixtureId || /[\r\n]/.test(fixtureId)) fail("Disposable fixture identity is required");
const actualHead = execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
if (actualHead !== expectedHead) fail("Candidate HEAD changed", { actualHead, expectedHead });

const registry = readFileSync(join(repo, "src/lib/bunny-videos.ts"), "utf8");
const expectedEntry = `"${LESSON_ID}": "${GUID}"`;
if (
  (registry.match(new RegExp(expectedEntry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || [])
    .length !== 1
) {
  fail("Exact canonical Bunny mapping must occur once");
}

const requireFromRepo = createRequire(join(repo, "package.json"));
const { chromium } = requireFromRepo("playwright");
const gateScriptSha256 = sha256(fileURLToPath(import.meta.url));
const allowedExternalOrigins = new Set();
const blockedExternalOrigins = new Set();
const mediaResponses = [];
const browser = await chromium.launch({
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});

try {
  const context = await browser.newContext({
    storageState: statePath,
    serviceWorkers: "block",
  });
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      [baseOrigin, supabaseOrigin].includes(url.origin)
    ) {
      return route.continue();
    }
    if (isBunnyHost(url.hostname)) {
      allowedExternalOrigins.add(url.origin);
      return route.continue();
    }
    blockedExternalOrigins.add(url.origin);
    return route.abort("blockedbyclient");
  });
  context.on("response", (response) => {
    const url = new URL(response.url());
    if (!isBunnyHost(url.hostname)) return;
    const contentType = response.headers()["content-type"] || "";
    const resourceType = response.request().resourceType();
    if (resourceType === "media" || /video|mpegurl|mp2t|octet-stream/i.test(contentType)) {
      mediaResponses.push({
        origin: url.origin,
        status: response.status(),
        contentType,
        resourceType,
      });
    }
  });

  const page = await context.newPage();
  page.setDefaultTimeout(35_000);
  const routePath = `/learn/intro/${LESSON_ID}?locale=${LOCALE}`;
  const navigation = await page.goto(`${baseOrigin}${routePath}`, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  if (!navigation?.ok())
    fail("Authenticated lesson navigation failed", { status: navigation?.status() });

  const iframe = page.locator(`iframe[src*="/${GUID}"]`);
  await iframe.waitFor({ state: "visible" });
  if ((await iframe.count()) !== 1) fail("Expected exactly one canonical lesson video iframe");
  await iframe.scrollIntoViewIfNeeded();
  const src = await iframe.getAttribute("src");
  const expectedEmbed = `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${GUID}`;
  if (!src?.startsWith(expectedEmbed)) fail("Lesson selected the wrong Bunny embed", { src });

  let frame;
  const frameDeadline = Date.now() + 45_000;
  while (!frame && Date.now() < frameDeadline) {
    frame = page.frames().find((candidate) => candidate.url().startsWith(expectedEmbed));
    if (!frame) await page.waitForTimeout(250);
  }
  if (!frame) fail("Bunny player frame did not attach");
  const video = frame.locator("video").first();
  await video.waitFor({ state: "attached", timeout: 45_000 });
  await frame.waitForFunction(
    () => {
      const element = document.querySelector("video");
      return Boolean(
        element &&
        element.readyState >= 3 &&
        Number.isFinite(element.duration) &&
        element.duration > 0,
      );
    },
    undefined,
    { timeout: 60_000 },
  );
  const before = await video.evaluate((element) => ({
    currentTime: element.currentTime,
    duration: element.duration,
    readyState: element.readyState,
    error: element.error ? { code: element.error.code, message: element.error.message } : null,
  }));
  if (before.error) fail("Video element reported an error before playback", before.error);
  await video.evaluate(async (element) => {
    element.muted = true;
    await element.play();
  });
  await frame.waitForFunction(
    () => {
      const element = document.querySelector("video");
      return Boolean(element && element.currentTime >= 1 && !element.paused && !element.error);
    },
    undefined,
    { timeout: 30_000 },
  );
  const after = await video.evaluate((element) => ({
    currentTime: element.currentTime,
    duration: element.duration,
    readyState: element.readyState,
    paused: element.paused,
    error: element.error ? { code: element.error.code, message: element.error.message } : null,
  }));
  const progressedSeconds = after.currentTime - before.currentTime;
  if (after.error || after.readyState < 3 || after.paused || progressedSeconds < 0.75) {
    fail("Video did not prove playable progress", { before, after, progressedSeconds });
  }
  if (!mediaResponses.some((item) => item.status >= 200 && item.status < 400)) {
    fail("No successful Bunny media response was observed", { mediaResponses });
  }

  const receipt = {
    gate: "B024_AUTHENTICATED_VIDEO_PLAYBACK",
    result: "PASS",
    candidateGitHead: actualHead,
    gateScriptSha256,
    browserVersion: browser.version(),
    lessonId: LESSON_ID,
    locale: LOCALE,
    bunnyLibraryId: LIBRARY_ID,
    bunnyGuid: GUID,
    routePath,
    embedOrigin: new URL(src).origin,
    before,
    after,
    progressedSeconds,
    mediaResponses,
    allowedExternalOrigins: [...allowedExternalOrigins].sort(),
    blockedExternalOrigins: [...blockedExternalOrigins].sort(),
    disposableFixtureId: fixtureId,
    totals: { cases: 1 },
  };
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
} finally {
  await browser.close();
}
