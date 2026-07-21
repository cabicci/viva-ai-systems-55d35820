/**
 * Screenshot reassessment — decides method 3 vs fallback with conclusive reasons.
 * No image capture. HEAD verification is done offline when authoring; this module
 * only encodes the authorized decisions + allowlist matching.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Method, ScreenshotSpec } from "./types";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

export interface AllowlistEntry {
  host: string;
  pathPrefix: string;
  product: string;
  rightsStatus: ScreenshotSpec["rightsStatus"];
  verifiedStatus: number;
}

export interface ScreenshotAllowlistFile {
  allowlistVersion: string;
  entries: AllowlistEntry[];
}

export type ScreenshotDecisionStatus =
  | "method-3-selected"
  | "assessed-not-used"
  | "schematic-preferred";

export interface ScreenshotDecision {
  lessonId: string;
  packageIntent: "screenshot" | "diagram" | "none";
  authenticScreenNecessary: boolean;
  status: ScreenshotDecisionStatus;
  method: Method;
  reason: string;
  screenshotSpec: ScreenshotSpec | null;
  exactUrl?: string;
  product?: string;
}

/** Lessons where authentic product UI recognition is instructionally necessary AND a verified public URL exists. */
const METHOD3_BY_LESSON: Record<
  string,
  Omit<ScreenshotSpec, "failOnLoginRedirect" | "allowlisted" | "url"> & { exactUrl: string }
> = {
  "builder-m6-l3-first-prompt-to-lovable": {
    exactUrl: "https://lovable.dev/",
    product: "Lovable",
    publicState: "public-marketing",
    capturePurpose:
      "Recognize Lovable's public prompt-left / preview-right builder chrome so learners match the lesson's first-prompt workflow to the real product surface.",
    rightsStatus: "vendor-public-docs",
    rightsRationale:
      "lovable.dev is the vendor's public marketing site; no login required for the landing experience used for recognition.",
    rightsNote: "Public Lovable marketing page — instructional recognition only; no login, no PII capture.",
    viewport: { width: 1440, height: 900 },
    requiredRedactions: ["any signed-in avatar", "any project-private preview content if present"],
    deterministicFallbackMethod: 4,
  },
  "automator-m3-l1-tools-landscape": {
    exactUrl: "https://n8n.io/",
    product: "n8n",
    publicState: "public-marketing",
    capturePurpose:
      "Recognize a real automation-product surface (n8n) so learners map Trigger → steps → exit layers named in the lesson to an authentic tool UI, not a fabricated mock.",
    rightsStatus: "vendor-public-docs",
    rightsRationale:
      "n8n.io is the vendor public marketing site verified HTTP 200 without auth; suitable for tool-landscape recognition.",
    rightsNote: "Public n8n marketing page — instructional recognition only; no login, no PII capture.",
    viewport: { width: 1440, height: 900 },
    requiredRedactions: ["cookie banners with emails", "any demo workspace private data"],
    deterministicFallbackMethod: 4,
  },
  "automator-m3-l2-triggers-actions": {
    exactUrl: "https://docs.n8n.io/workflows/",
    product: "n8n",
    publicState: "public-docs",
    capturePurpose:
      "Recognize public n8n workflow documentation UI so Trigger → Action composition is grounded in a real automation product docs surface.",
    rightsStatus: "vendor-public-docs",
    rightsRationale:
      "docs.n8n.io/workflows/ is public vendor documentation (verified 200 / redirects to public docs path) with no login wall.",
    rightsNote: "Public n8n docs — instructional recognition only; no login, no PII capture.",
    viewport: { width: 1440, height: 900 },
    requiredRedactions: ["account menus if any"],
    deterministicFallbackMethod: 4,
  },
};

/** Lessons that name ChatGPT/OpenAI UI but cannot use method 3 without a verifiable public no-auth URL. */
const CHATGPT_UI_LESSONS = new Set([
  "intro-m1-l2-first-prompt",
  "intro-m1-l3-setup-your-ai",
  "builder-m1-l1-what-is-llm",
]);

export function loadScreenshotAllowlist(
  absPath = resolve(MODULE_DIR, "screenshotAllowlist.json"),
): ScreenshotAllowlistFile {
  return JSON.parse(readFileSync(absPath, "utf8")) as ScreenshotAllowlistFile;
}

export function isUrlOnScreenshotAllowlist(
  url: string,
  allowlist: ScreenshotAllowlistFile = loadScreenshotAllowlist(),
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname || "/";
  return allowlist.entries.some((e) => {
    if (e.host.toLowerCase() !== host) return false;
    const prefix = e.pathPrefix.endsWith("/") && e.pathPrefix.length > 1
      ? e.pathPrefix.slice(0, -1)
      : e.pathPrefix;
    if (prefix === "/") return true;
    return path === prefix || path.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`) || path.startsWith(prefix);
  });
}

function buildSpec(
  partial: (typeof METHOD3_BY_LESSON)[string],
): ScreenshotSpec {
  return {
    url: partial.exactUrl,
    exactUrl: partial.exactUrl,
    product: partial.product,
    publicState: partial.publicState,
    capturePurpose: partial.capturePurpose,
    rightsStatus: partial.rightsStatus,
    rightsRationale: partial.rightsRationale,
    rightsNote: partial.rightsNote,
    viewport: partial.viewport,
    requiredRedactions: partial.requiredRedactions,
    deterministicFallbackMethod: partial.deterministicFallbackMethod,
    failOnLoginRedirect: true,
    allowlisted: true,
  };
}

/**
 * Per-lesson screenshot decision. `fallbackMethod` is the non-3 method already
 * chosen by authoring (1 diagram / 2 concept-scene / 4 hybrid).
 */
export function assessScreenshotDecision(input: {
  lessonId: string;
  packageIntent: "screenshot" | "diagram" | "none";
  visualSummary: string;
  fallbackMethod: Method;
}): ScreenshotDecision {
  const { lessonId, packageIntent, visualSummary, fallbackMethod } = input;
  const blob = `${lessonId} ${visualSummary}`.toLowerCase();

  if (METHOD3_BY_LESSON[lessonId]) {
    const spec = buildSpec(METHOD3_BY_LESSON[lessonId]);
    return {
      lessonId,
      packageIntent,
      authenticScreenNecessary: true,
      status: "method-3-selected",
      method: 3,
      reason: spec.capturePurpose,
      screenshotSpec: spec,
      exactUrl: spec.exactUrl,
      product: spec.product,
    };
  }

  if (packageIntent === "diagram" || packageIntent === "none") {
    return {
      lessonId,
      packageIntent,
      authenticScreenNecessary: false,
      status: "schematic-preferred",
      method: fallbackMethod,
      reason:
        packageIntent === "diagram"
          ? "Package marks Diagram intent — a deterministic schematic teaches the relationship better than an authentic product screenshot."
          : "No Screenshot/Diagram intent block — schematic/hybrid carries lesson labels without fabricating UI.",
      screenshotSpec: null,
    };
  }

  // Screenshot intent present
  if (CHATGPT_UI_LESSONS.has(lessonId) || /chatgpt|openai|gemini|claude|chatbot interface/.test(blob)) {
    return {
      lessonId,
      packageIntent,
      authenticScreenNecessary: true,
      status: "assessed-not-used",
      method: fallbackMethod,
      reason:
        "Authentic chatbot/product UI recognition would help, but no safe public URL verified HTTP 200 without login/bot wall (OpenAI/ChatGPT endpoints returned 403 from audit). Refusing to fabricate UI; using deterministic/hybrid with package labels.",
      screenshotSpec: null,
    };
  }

  if (/lovable/.test(blob) && !METHOD3_BY_LESSON[lessonId]) {
    return {
      lessonId,
      packageIntent,
      authenticScreenNecessary: false,
      status: "schematic-preferred",
      method: fallbackMethod,
      reason:
        "Lesson mentions Lovable process steps but the instructional goal is the iteration/debug loop schematic, not product-chrome recognition — method 1/2/4 preferred.",
      screenshotSpec: null,
    };
  }

  if (/\bn8n\b|zapier|make\.com|automation tool/.test(blob) && !METHOD3_BY_LESSON[lessonId]) {
    return {
      lessonId,
      packageIntent,
      authenticScreenNecessary: false,
      status: "schematic-preferred",
      method: fallbackMethod,
      reason:
        "Automation concepts are taught as Trigger/Action/Filter relationships; a schematic panel is clearer than a vendor screenshot for this lesson's objective.",
      screenshotSpec: null,
    };
  }

  if (/dashboard|screen|interface|button|click|preview|editor|layout|wireframe/.test(blob)) {
    return {
      lessonId,
      packageIntent,
      authenticScreenNecessary: false,
      status: "schematic-preferred",
      method: fallbackMethod,
      reason:
        "Screenshot intent describes a schematic/layout illustration rather than recognizing a named public product UI; hybrid/deterministic carries real locale labels without fabricating chrome.",
      screenshotSpec: null,
    };
  }

  return {
    lessonId,
    packageIntent,
    authenticScreenNecessary: false,
    status: "schematic-preferred",
    method: fallbackMethod,
    reason:
      "Screenshot intent assessed; authentic screen recognition is not instructionally necessary — schematic or hybrid teaches the package comparison more clearly.",
    screenshotSpec: null,
  };
}
