#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

function fail(message, details = undefined) {
  const suffix = details === undefined ? "" : `\n${JSON.stringify(details, null, 2)}`;
  throw new Error(`${message}${suffix}`);
}

function isLoopback(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
}

const repoRoot = resolve(process.env.B023_REPO_ROOT || process.cwd());
const baseUrl = new URL(process.env.B023_BASE_URL || "http://127.0.0.1:4173");
const storageStatePath = process.env.B023_AUTH_STORAGE_STATE
  ? resolve(process.env.B023_AUTH_STORAGE_STATE)
  : "";
const expectedGitHead = (process.env.B023_EXPECTED_GIT_HEAD || "").trim();
const fixtureId = (process.env.B023_DISPOSABLE_FIXTURE_ID || "").trim();
const localSupabaseOrigin = new URL(
  process.env.B023_LOCAL_SUPABASE_ORIGIN || "http://127.0.0.1:54321",
);
const browserManifestPath = join(
  repoRoot,
  "src",
  "lib",
  "lesson-visuals",
  "contextual-v2",
  "runtime",
  "contextualV2BrowserManifest.json",
);

if (!isLoopback(baseUrl.hostname)) {
  fail("B023_BASE_URL must be a loopback local preview URL; live deployments are outside this gate", {
    origin: baseUrl.origin,
  });
}
if (!storageStatePath || !existsSync(storageStatePath)) {
  fail("B023_AUTH_STORAGE_STATE must name an existing Playwright storage-state file for a disposable local Pro/admin user");
}
if (!expectedGitHead || !/^[a-f0-9]{40}$/i.test(expectedGitHead)) {
  fail("B023_EXPECTED_GIT_HEAD must be the exact 40-hex integrated candidate commit");
}
if (!fixtureId || fixtureId.length > 120 || /[\r\n]/.test(fixtureId)) {
  fail("B023_DISPOSABLE_FIXTURE_ID must be a short nonsecret identity for the disposable local Pro/admin fixture");
}
if (!isLoopback(localSupabaseOrigin.hostname)) {
  fail("B023_LOCAL_SUPABASE_ORIGIN must be loopback; live Supabase is prohibited", {
    origin: localSupabaseOrigin.origin,
  });
}
if (!existsSync(browserManifestPath)) {
  fail("The integrated contextual-v2 browser manifest is missing", { browserManifestPath });
}

const actualGitHead = execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
if (actualGitHead.toLowerCase() !== expectedGitHead.toLowerCase()) {
  fail("Repository HEAD differs from B023_EXPECTED_GIT_HEAD", {
    expectedGitHead,
    actualGitHead,
  });
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const gateScriptPath = fileURLToPath(import.meta.url);
const gateScriptSha256 = sha256File(gateScriptPath);
const browserManifestSha256 = sha256File(browserManifestPath);

const storageState = JSON.parse(readFileSync(storageStatePath, "utf8"));
if (!Array.isArray(storageState.origins) || !storageState.origins.some((entry) => entry.origin === baseUrl.origin)) {
  fail("The storage state does not contain browser storage for the exact preview origin", {
    expectedOrigin: baseUrl.origin,
    availableOrigins: Array.isArray(storageState.origins)
      ? storageState.origins.map((entry) => entry.origin)
      : [],
  });
}

const requireFromRepo = createRequire(join(repoRoot, "package.json"));
const { chromium } = requireFromRepo("playwright");

const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"];
const lessons = [
  {
    pathId: "builder",
    lessonId: "builder-m7-l1-tables-columns",
    extension: "png",
    purpose: "accepted genuine-screenshot PNG pilot",
  },
  {
    pathId: "intro",
    lessonId: "intro-m1-l1-what-is-ai",
    extension: "webp",
    purpose: "representative lossless WebP",
  },
  {
    pathId: "builder",
    lessonId: "builder-m5-l5-mini-win",
    extension: "webp",
    purpose: "formerly zero-slot Builder lesson",
  },
  {
    pathId: "creator",
    lessonId: "creator-m4-repurposing",
    extension: "webp",
    purpose: "formerly zero-slot Creator lesson",
  },
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stats = statSync(path);
    if (stats.isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

const legacyRoots = [
  join(repoRoot, "src", "assets", "lessons"),
  join(repoRoot, "src", "assets", "lesson-visuals", "controlled-v1"),
];
const legacyStems = new Set(
  legacyRoots
    .flatMap((root) => walk(root))
    .filter((path) => /\.(?:png|jpe?g|webp|svg)$/i.test(path))
    .map((path) => basename(path).replace(/\.(?:png|jpe?g|webp|svg)$/i, "")),
);

function looksLikeLegacyLessonImage(url) {
  const parsed = new URL(url);
  const pathname = decodeURIComponent(parsed.pathname);
  if (pathname.startsWith("/lesson-visuals/contextual-v2/")) return false;
  if (/\/(?:src\/)?assets\/lesson-visuals\/controlled-v1\//i.test(pathname)) return true;
  if (/\/(?:src\/)?assets\/lessons\//i.test(pathname)) return true;
  const file = basename(pathname);
  for (const stem of legacyStems) {
    if (file === `${stem}.png` || file === `${stem}.jpg` || file === `${stem}.jpeg` || file === `${stem}.webp` || file === `${stem}.svg`) {
      return true;
    }
    if (file.startsWith(`${stem}-`) && /\.(?:png|jpe?g|webp|svg)$/i.test(file)) return true;
  }
  return false;
}

function routeUrl(pathId, lessonId, locale) {
  const url = new URL(`/learn/${pathId}/${lessonId}`, baseUrl);
  url.searchParams.set("locale", locale);
  return url.href;
}

const launchOptions = { headless: process.env.B023_HEADED !== "1" };
if (process.env.B023_CHROME_EXECUTABLE) launchOptions.executablePath = process.env.B023_CHROME_EXECUTABLE;
else launchOptions.channel = process.env.B023_BROWSER_CHANNEL || "chrome";

const browser = await chromium.launch(launchOptions);
const browserVersion = await browser.version();
const results = [];
const blockedExternalOrigins = new Set();
let localSupabaseRequestCount = 0;

try {
  // A new context supplies an empty HTTP cache and no service-worker cache.
  // The only retained state is the explicitly supplied disposable local auth state.
  const context = await browser.newContext({
    storageState,
    serviceWorkers: "block",
  });

  // Routing also disables the Playwright HTTP cache. Block every non-loopback
  // request so this local gate cannot touch production Supabase or other live services.
  await context.route("**/*", async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.protocol !== "http:" && requestUrl.protocol !== "https:") {
      await route.continue();
      return;
    }
    if (requestUrl.origin === localSupabaseOrigin.origin) {
      localSupabaseRequestCount += 1;
    }
    if (!isLoopback(requestUrl.hostname)) {
      blockedExternalOrigins.add(requestUrl.origin);
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });

  for (const locale of locales) {
    for (const lesson of lessons) {
      const page = await context.newPage();
      const imageRequests = [];
      const imageResponses = [];

      page.on("request", (request) => {
        if (request.resourceType() === "image" && request.url().startsWith("http")) {
          imageRequests.push(request.url());
        }
      });
      page.on("response", (response) => {
        const request = response.request();
        if (request.resourceType() === "image") {
          imageResponses.push({ url: response.url(), status: response.status() });
        }
      });

      const requestedRoute = routeUrl(lesson.pathId, lesson.lessonId, locale);
      const documentResponse = await page.goto(requestedRoute, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      if (!documentResponse || !documentResponse.ok()) {
        fail("Learner document did not load successfully", {
          requestedRoute,
          status: documentResponse?.status(),
        });
      }

      const visual = page.locator('[data-contextual-v2-img="1"]');
      try {
        await visual.waitFor({ state: "attached", timeout: 20_000 });
      } catch {
        const diagnostics = await page.locator("body").innerText().catch(() => "");
        fail("Contextual visual did not mount. Confirm the disposable local user is authenticated and Pro/admin, and that local Supabase has the required migrations/fixtures", {
          requestedRoute,
          visibleText: diagnostics.slice(0, 1200),
          contextualError: await page.locator("[data-contextual-v2-error]").first().getAttribute("data-contextual-v2-error").catch(() => null),
        });
      }

      if ((await visual.count()) !== 1) {
        fail("Expected exactly one contextual-v2 image element", {
          requestedRoute,
          count: await visual.count(),
        });
      }

      await visual.scrollIntoViewIfNeeded();
      const expectedPath = `/lesson-visuals/contextual-v2/${locale}/${lesson.lessonId}.${lesson.extension}`;
      const decoded = await visual.evaluate(
        (element) =>
          new Promise((resolveImage) => {
            const image = element;
            if (image.complete) {
              resolveImage({ complete: image.complete, naturalWidth: image.naturalWidth });
              return;
            }
            image.addEventListener(
              "load",
              () => resolveImage({ complete: image.complete, naturalWidth: image.naturalWidth }),
              { once: true },
            );
            image.addEventListener(
              "error",
              () => resolveImage({ complete: image.complete, naturalWidth: image.naturalWidth }),
              { once: true },
            );
          }),
        undefined,
        { timeout: 20_000 },
      );
      if (!decoded.complete || decoded.naturalWidth <= 0) {
        fail("The selected contextual image did not decode successfully", {
          requestedRoute,
          expectedPath,
          decoded,
        });
      }

      const src = await visual.getAttribute("src");
      const cell = await visual.evaluate((element) =>
        element.parentElement?.getAttribute("data-contextual-v2-cell"),
      );
      if (!src || new URL(src, baseUrl).pathname !== expectedPath) {
        fail("Mounted contextual image URL differs from the exact locale/lesson path", {
          requestedRoute,
          expectedPath,
          src,
        });
      }
      if (cell !== `${lesson.lessonId}__${locale}`) {
        fail("Mounted contextual cell identity is incorrect", {
          requestedRoute,
          expectedCell: `${lesson.lessonId}__${locale}`,
          cell,
        });
      }

      const contextualRequests = imageRequests
        .map((url) => new URL(url).pathname)
        .filter((pathname) => pathname.startsWith("/lesson-visuals/contextual-v2/"));
      const contextualPaths = [...new Set(contextualRequests)];
      if (
        contextualRequests.length !== 1 ||
        contextualPaths.length !== 1 ||
        contextualPaths[0] !== expectedPath
      ) {
        fail("Actual browser network selected more than one contextual image URL, the wrong locale, or the wrong lesson", {
          requestedRoute,
          expectedPath,
          contextualRequests,
          contextualPaths,
        });
      }

      const expectedResponses = imageResponses.filter(
        (response) => new URL(response.url).pathname === expectedPath,
      );
      if (!expectedResponses.some((response) => response.status === 200)) {
        fail("The selected contextual image did not receive an HTTP 200 response", {
          requestedRoute,
          expectedPath,
          expectedResponses,
        });
      }

      const legacyRequests = [...new Set(imageRequests.filter(looksLikeLegacyLessonImage))];
      if (legacyRequests.length > 0) {
        fail("Legacy lesson-image bytes were requested by the actual browser", {
          requestedRoute,
          legacyRequests,
        });
      }

      results.push({
        locale,
        lessonId: lesson.lessonId,
        purpose: lesson.purpose,
        route: requestedRoute,
        selectedPath: contextualPaths[0],
        status: 200,
        contextualRequestCount: contextualRequests.length,
        contextualUrlCount: contextualPaths.length,
        legacyRequestCount: legacyRequests.length,
      });
      await page.close();
    }
  }

  await context.close();
} finally {
  await browser.close();
}

if (localSupabaseRequestCount <= 0) {
  fail("No request reached the declared loopback Supabase origin; the premium-route fixture was not evidenced", {
    localSupabaseOrigin: localSupabaseOrigin.origin,
  });
}

process.stdout.write(
  `${JSON.stringify(
    {
      gate: "B023_CONTEXTUAL_V2_ACTUAL_BROWSER_NETWORK",
      result: "PASS",
      candidateGitHead: actualGitHead,
      browserVersion,
      gateScriptSha256,
      browserManifestSha256,
      baseOrigin: baseUrl.origin,
      localSupabaseOrigin: localSupabaseOrigin.origin,
      disposableFixtureId: fixtureId,
      localSupabaseRequestCount,
      freshContext: true,
      cacheDisabledByRouting: true,
      serviceWorkersBlocked: true,
      externalRequestsBlocked: [...blockedExternalOrigins].sort(),
      cases: results,
      totals: {
        locales: new Set(results.map((entry) => entry.locale)).size,
        lessons: new Set(results.map((entry) => entry.lessonId)).size,
        cases: results.length,
      },
    },
    null,
    2,
  )}\n`,
);
