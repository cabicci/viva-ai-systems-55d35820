// Generic Remotion renderer.
// Usage: render-lesson.mjs <compositionId> [workId]
//   compositionId: Remotion composition id (hyphen-safe, e.g. "lid--ar-MSA"
//                  in locale mode, or plain "lid" in legacy mode).
//   workId:        identity used for /tmp/<workId>/ paths. Defaults to
//                  compositionId. In locale mode the caller passes
//                  "${lid}__${locale}" so /tmp paths, mapping keys, evidence
//                  files, and output stems all share the same composite.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compositionId = process.argv[2];
const workId = process.argv[3] || compositionId;
if (!compositionId) {
  console.error("usage: render-lesson.mjs <compositionId> [workId]");
  process.exit(1);
}

let browser;
const chromeMode = "headless-shell";
const chromiumOptions = {
  headless: false,
};

const browserOpts = {
  chromiumOptions,
  chromeMode,
  logLevel: "verbose",
};

try {
  console.log("Bundling Remotion project...");
  const bundled = await bundle({
    entryPoint: path.resolve(__dirname, "../src/index.ts"),
    webpackOverride: (config) => config,
  });

  console.log(`Opening Remotion browser with chromeMode=${browserOpts.chromeMode}`);
  browser = await openBrowser("chrome", browserOpts);

  const composition = await selectComposition({
    serveUrl: bundled,
    id: compositionId,
    puppeteerInstance: browser,
  });

  const silent = `/tmp/${workId}/remotion-silent.mp4`;
  fs.mkdirSync(path.dirname(silent), { recursive: true });

  const requestedConcurrency = Number(process.env.REMOTION_CONCURRENCY ?? 0);
  const concurrency = requestedConcurrency > 0 ? requestedConcurrency : 2;
  console.log(`Rendering compositionId=${compositionId} workId=${workId} frames=${composition.durationInFrames} concurrency=${concurrency}`);

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: silent,
    puppeteerInstance: browser,
    muted: true,
    concurrency,
    dumpBrowserLogs: true,
    chromeMode,
    chromiumOptions,
    logLevel: "verbose",
    timeoutInMilliseconds: 300000,
  });

  console.log(`Silent render done -> ${silent}`);
} catch (error) {
  console.error("Remotion render failed:");
  console.error(error?.stack || error);
  process.exitCode = 1;
} finally {
  if (browser) {
    await browser.close({ silent: false });
  }
}
