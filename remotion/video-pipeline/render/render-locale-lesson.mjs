// Render locale pipeline lesson using dynamic scenes from JSON props file.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const propsPath = process.argv[2];
const outputPath = process.argv[3];
if (!propsPath || !outputPath) {
  console.error("usage: render-locale-lesson.mjs <props.json> <output.mp4>");
  process.exit(1);
}

const inputProps = JSON.parse(fs.readFileSync(propsPath, "utf8"));
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

let browser;
try {
  const bundled = await bundle({
    entryPoint: path.resolve(__dirname, "entry.tsx"),
    publicDir: path.resolve(__dirname, "public"),
    webpackOverride: (config) => config,
  });

  browser = await openBrowser("chrome", {
    chromeMode: "headless-shell",
    chromiumOptions: { headless: false },
    logLevel: "verbose",
  });

  const composition = await selectComposition({
    serveUrl: bundled,
    id: "locale-pipeline-lesson",
    inputProps,
    puppeteerInstance: browser,
  });

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
    puppeteerInstance: browser,
    muted: true,
    concurrency: Number(process.env.REMOTION_CONCURRENCY ?? 2),
    timeoutInMilliseconds: 600000,
    logLevel: "verbose",
  });

  console.log(`Render complete -> ${outputPath}`);
} catch (error) {
  console.error(error?.stack || error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close({ silent: false });
}
