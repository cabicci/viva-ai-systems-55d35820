/**
 * Ensure Chrome/Chromium is available for controlled-visuals:test-render.
 *
 * Prefers an already-resolvable system Chrome. When absent, installs Playwright's
 * Chromium (already a declared devDependency) and verifies the executable exists.
 * Fail-closed — never silently skips render tests.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolveChromeExecutable } from "../routes/instructionalComposition";

function tryResolve(): string | null {
  try {
    return resolveChromeExecutable();
  } catch {
    return null;
  }
}

function installPlaywrightChromium(): void {
  console.log("Chrome/Chromium not found — installing Playwright Chromium...");
  const result = spawnSync("bunx", ["playwright", "install", "chromium"], {
    encoding: "utf8",
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    throw new Error(
      `BLOCKED_CHROME_INSTALL_FAILED: playwright install chromium exited ${result.status}`,
    );
  }
}

function main(): void {
  let chrome = tryResolve();
  if (!chrome) {
    installPlaywrightChromium();
    chrome = tryResolve();
  }
  if (!chrome || !existsSync(chrome)) {
    throw new Error(
      "BLOCKED_CHROME_MISSING: Chrome/Chromium still not found after Playwright Chromium install. Set CHROME_PATH or run bun run controlled-visuals:ensure-chrome.",
    );
  }
  console.log(`CHROME_PATH=${chrome}`);
  const ver = spawnSync(chrome, ["--product-version"], { encoding: "utf8", timeout: 10_000 });
  const versionText = (ver.stdout || ver.stderr || "").trim();
  if (ver.status === 0 && versionText && !/opening in existing/i.test(versionText)) {
    console.log(`CHROME_VERSION=${versionText}`);
  } else {
    const ver2 = spawnSync(chrome, ["--version"], { encoding: "utf8", timeout: 10_000 });
    const text2 = (ver2.stdout || ver2.stderr || "").trim();
    if (ver2.status === 0 && text2 && !/opening in existing/i.test(text2)) {
      console.log(`CHROME_VERSION=${text2}`);
    }
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
