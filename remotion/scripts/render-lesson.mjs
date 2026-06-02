// Generic Remotion renderer. Accepts a lesson id and renders its composition.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const id = process.argv[2];
if (!id) {
  console.error("usage: render-lesson.mjs <lessonId>");
  process.exit(1);
}

let browser;
const chromeMode = "headless-shell";
const chromiumOptions = {
  // Remotion 4 still passes --headless=old for headless-shell by default.
  // Newer GitHub-hosted Chrome builds reject that flag, while the shell binary
  // is headless already, so skip adding the legacy flag entirely.
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
    id,
    puppeteerInstance: browser,
  });

  const silent = `/tmp/${id}/remotion-silent.mp4`;
  fs.mkdirSync(path.dirname(silent), { recursive: true });

  const requestedConcurrency = Number(process.env.REMOTION_CONCURRENCY ?? 0);
  const concurrency = requestedConcurrency > 0 ? requestedConcurrency : 2;
  console.log(`Rendering composition=${id} frames=${composition.durationInFrames} concurrency=${concurrency}`);

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
