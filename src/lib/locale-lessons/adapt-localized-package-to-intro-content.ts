import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
  Lightbulb,
  PlayCircle,
  Rocket,
  Scale,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type {
  IntroBlock,
  IntroLessonContent,
  IntroLessonSection,
} from "@/components/intro/intro-lesson-types";
import type { IntroSectionTone } from "@/components/intro/IntroSection";
import { getUiString } from "@/lib/locale/ui-strings";
import {
  isInternalLearnerHeading,
  isProductionReferenceSection,
  learnerFacingTitle,
  localizedSectionEyebrow,
  parseInternalHeading,
} from "./package-section-labels";
import { adaptPackageMissionToLiveShape } from "./adapt-package-to-live-mission";
import { adaptPackageQuizToQuizItem } from "./adapt-package-to-live-quiz";
import {
  acceptStrictVisualPackageText,
  usesStrictLocalizedVisualPolicy,
} from "./strict-localized-visual-policy";
import type {
  LessonPackageLocale,
  LocalizedLessonPackage,
  LocalizedLessonSection,
  LocalizedLessonTable,
} from "./types";

export type LocalizedPackageInput = Pick<
  LocalizedLessonPackage,
  "locale" | "lessonId" | "sections"
>;

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

function cleanLearnerLine(text: string): string {
  return stripMarkdownEmphasis(text)
    .replace(/^(correct answer|الإجابة الصحيحة)\s*:?\s*/i, "")
    .replace(/\(correctIndex\s*:\s*\d+\)/gi, "")
    .trim();
}

function collectParagraphs(section: LocalizedLessonSection): string[] {
  const lines: string[] = [];
  for (const bullet of section.bullets) {
    const cleaned = cleanLearnerLine(bullet);
    if (cleaned) lines.push(cleaned);
  }
  if (lines.length > 0) return lines;

  return section.contentMarkdown
    .split(/\n{2,}/)
    .map((chunk) => cleanLearnerLine(chunk))
    .filter(Boolean);
}

function isGlossaryTable(table: LocalizedLessonTable): boolean {
  const headers = table.headers.map((header) => header.toLowerCase());
  return (
    headers.includes("term") ||
    headers.includes("المصطلح") ||
    headers.includes("meaning") ||
    headers.includes("المعنى")
  );
}

function isComparisonTable(table: LocalizedLessonTable): boolean {
  if (table.headers.length !== 2) return false;
  const joined = table.headers.join(" ").toLowerCase();
  return /misunderstand|understand|غامض|واضح|if you|vs|versus|مقارنة|quickly|verify/.test(
    joined,
  );
}

function tableToConcepts(table: LocalizedLessonTable) {
  const termIdx = table.headers.findIndex((header) =>
    /term|مصطلح/i.test(header),
  );
  const meaningIdx = table.headers.findIndex((header) =>
    /meaning|معنى/i.test(header),
  );
  const exampleIdx = table.headers.findIndex((header) =>
    /example|مثال/i.test(header),
  );

  return table.rows
    .map((row) => ({
      term: row[termIdx >= 0 ? termIdx : 0] ?? "",
      meaning: row[meaningIdx >= 0 ? meaningIdx : 1] ?? "",
      example: exampleIdx >= 0 ? row[exampleIdx] : undefined,
    }))
    .filter((item) => item.term && item.meaning);
}

function tableToComparison(table: LocalizedLessonTable) {
  const [leftLabel, rightLabel] = table.headers;
  const row = table.rows[0] ?? ["", ""];
  return {
    left: { label: leftLabel ?? "", body: row[0] ?? "" },
    right: { label: rightLabel ?? "", body: row[1] ?? "" },
  };
}

function sectionIcon(role: string): LucideIcon {
  const normalized = normalizeRole(role);
  if (normalized.includes("orientation")) return Sparkles;
  if (normalized.includes("tension")) return AlertCircle;
  if (normalized.includes("core")) return Lightbulb;
  if (normalized.includes("glossary")) return BookOpen;
  if (normalized.includes("comparison")) return Scale;
  if (normalized.includes("quiz")) return CheckCircle2;
  if (normalized.includes("mission")) return Rocket;
  if (normalized.includes("screenshot")) return ImageIcon;
  if (normalized.includes("video")) return PlayCircle;
  if (normalized.includes("confidence")) return CheckCircle2;
  return Lightbulb;
}

function sectionTone(role: string): IntroSectionTone {
  const normalized = normalizeRole(role);
  if (normalized.includes("tension")) return "warn";
  if (normalized.includes("mission")) return "primary";
  return "accent";
}

function sectionEyebrow(
  section: LocalizedLessonSection,
  locale: LessonPackageLocale,
): string {
  if (
    isInternalLearnerHeading(section.heading) ||
    normalizeRole(section.role).includes("quiz")
  ) {
    return localizedSectionEyebrow(section.role, locale);
  }
  const subtitle = section.subtitle?.trim();
  if (subtitle) {
    const parsed = parseInternalHeading(subtitle);
    if (parsed.isInternal) {
      return localizedSectionEyebrow(section.role, locale);
    }
    if (!isInternalLearnerHeading(subtitle)) {
      return subtitle;
    }
  }
  return localizedSectionEyebrow(section.role, locale);
}

function sectionTitle(
  section: LocalizedLessonSection,
  block: IntroBlock,
  locale: LessonPackageLocale,
): string {
  if (block.kind === "quiz") {
    const quizSection = section.quiz;
    return (
      quizSection?.question?.trim() ||
      learnerFacingTitle(
        section.heading,
        section.subtitle,
        localizedSectionEyebrow(section.role, locale),
      )
    );
  }
  return learnerFacingTitle(
    section.heading,
    section.subtitle,
    localizedSectionEyebrow(section.role, locale),
  );
}

function buildQuizBlock(
  pkg: LocalizedPackageInput,
  section: LocalizedLessonSection,
  quizIndex: number,
): IntroBlock | null {
  if (!section.quiz?.options?.length) return null;
  try {
    const item = adaptPackageQuizToQuizItem(
      pkg.lessonId,
      section.quiz,
      quizIndex,
    );
    return {
      kind: "quiz",
      lessonId: pkg.lessonId,
      items: [item],
    };
  } catch {
    return null;
  }
}

function buildMissionBlock(
  pkg: LocalizedPackageInput,
  section: LocalizedLessonSection,
  missionIndex: number,
): IntroBlock | null {
  if (!section.mission) return null;
  try {
    const live = adaptPackageMissionToLiveShape(
      pkg.lessonId,
      section,
      missionIndex,
    );
    return {
      kind: "mission",
      intro: live.intro,
      prompt: live.prompt,
      buttonLabel: getUiString(pkg.locale, "mission.copy.cta"),
      copiedLabel: getUiString(pkg.locale, "mission.copy.done"),
      rubric: live.rubric,
      missionId: live.missionId,
      lessonId: pkg.lessonId,
    };
  } catch {
    return null;
  }
}

function buildIntroBlockFromSection(
  pkg: LocalizedPackageInput,
  section: LocalizedLessonSection,
  counters: { quiz: number; mission: number },
): IntroBlock | null {
  const role = section.role;

  if (
    isProductionReferenceSection(role) ||
    /production reference/i.test(section.heading ?? "")
  ) {
    return null;
  }

  if (normalizeRole(role).includes("video")) {
    return null;
  }

  if (normalizeRole(role).includes("quiz")) {
    const block = buildQuizBlock(pkg, section, counters.quiz);
    if (block) counters.quiz += 1;
    return block;
  }

  if (normalizeRole(role).includes("mission")) {
    const block = buildMissionBlock(pkg, section, counters.mission);
    if (block) counters.mission += 1;
    return block;
  }

  if (normalizeRole(role).includes("comparison")) {
    for (const table of section.tables) {
      if (table.headers.length === 2 && table.rows.length > 0) {
        return { kind: "comparison", ...tableToComparison(table) };
      }
    }
  }

  if (normalizeRole(role).includes("screenshot")) {
    const caption = collectParagraphs(section)[0];
    return {
      kind: "screenshot",
      caption: acceptStrictVisualPackageText(pkg.locale, caption),
    };
  }

  for (const table of section.tables) {
    if (isGlossaryTable(table)) {
      const items = tableToConcepts(table);
      if (items.length > 0) return { kind: "concepts", items };
    }
    if (isComparisonTable(table)) {
      return { kind: "comparison", ...tableToComparison(table) };
    }
  }

  const paragraphs = collectParagraphs(section);
  if (paragraphs.length > 0) {
    return { kind: "paragraphs", paragraphs };
  }

  return null;
}

function buildPackageIntroSections(
  pkg: LocalizedPackageInput,
): IntroLessonSection[] {
  const sections: IntroLessonSection[] = [];
  const counters = { quiz: 0, mission: 0 };

  for (const section of pkg.sections) {
    const block = buildIntroBlockFromSection(pkg, section, counters);
    if (!block) continue;

    sections.push({
      icon: sectionIcon(section.role),
      eyebrow: sectionEyebrow(section, pkg.locale),
      title: sectionTitle(section, block, pkg.locale),
      tone: sectionTone(section.role),
      block,
    });
  }

  return sections;
}

function blockKindKey(block: IntroBlock): string {
  return block.kind;
}

function queueSectionsByKind(
  sections: IntroLessonSection[],
): Map<string, IntroLessonSection[]> {
  const queues = new Map<string, IntroLessonSection[]>();
  for (const section of sections) {
    const key = blockKindKey(section.block);
    const queue = queues.get(key) ?? [];
    queue.push(section);
    queues.set(key, queue);
  }
  return queues;
}

function takeQueuedSection(
  queues: Map<string, IntroLessonSection[]>,
  kind: IntroBlock["kind"],
): IntroLessonSection | null {
  const queue = queues.get(kind);
  if (!queue?.length) return null;
  return queue.shift() ?? null;
}

function findVideoCaption(pkg: LocalizedPackageInput): string | undefined {
  for (const section of pkg.sections) {
    if (!normalizeRole(section.role).includes("video")) continue;
    const caption = collectParagraphs(section)[0];
    if (caption) return caption;
  }
  return undefined;
}

function strictPackageText(
  locale: LessonPackageLocale,
  value: string | undefined | null,
): string | undefined {
  return acceptStrictVisualPackageText(locale, value);
}

function strictChromeOrPackage(
  locale: LessonPackageLocale,
  packageValue: string | undefined,
  chromeRole: string,
): string {
  return (
    strictPackageText(locale, packageValue) ??
    localizedSectionEyebrow(chromeRole, locale)
  );
}

function findVideoSectionMeta(
  pkg: LocalizedPackageInput,
): Pick<IntroLessonSection, "title" | "eyebrow"> | null {
  for (const section of pkg.sections) {
    if (!normalizeRole(section.role).includes("video")) continue;
    return {
      eyebrow: sectionEyebrow(section, pkg.locale),
      title: learnerFacingTitle(
        section.heading,
        section.subtitle,
        localizedSectionEyebrow(section.role, pkg.locale),
      ),
    };
  }
  return null;
}

function findDiagramSectionMeta(
  pkg: LocalizedPackageInput,
): (Pick<IntroLessonSection, "title" | "eyebrow"> & { caption?: string }) | null {
  for (const section of pkg.sections) {
    if (!normalizeRole(section.role).includes("diagram")) continue;
    return {
      eyebrow: sectionEyebrow(section, pkg.locale),
      title: learnerFacingTitle(
        section.heading,
        section.subtitle,
        localizedSectionEyebrow(section.role, pkg.locale),
      ),
      caption: collectParagraphs(section)[0],
    };
  }
  return null;
}

function mergeCanonicalSection(
  canonSection: IntroLessonSection,
  localized: IntroLessonSection | null,
  pkg: LocalizedPackageInput,
): IntroLessonSection | null {
  const kind = canonSection.block.kind;
  const strictVisual = usesStrictLocalizedVisualPolicy(pkg.locale);

  if (kind === "lessonVideo") {
    const videoMeta = findVideoSectionMeta(pkg);
    if (strictVisual) {
      // Block 2: never inherit ar-EG title/eyebrow/caption/url/poster/duration.
      // Package-sourced text must pass exact-locale lexical policy.
      return {
        ...canonSection,
        eyebrow: strictChromeOrPackage(
          pkg.locale,
          videoMeta?.eyebrow,
          "Video block",
        ),
        title: strictChromeOrPackage(
          pkg.locale,
          videoMeta?.title,
          "Video block",
        ),
        block: {
          kind: "lessonVideo",
          caption: strictPackageText(pkg.locale, findVideoCaption(pkg)),
        },
      };
    }
    const canonVideo =
      canonSection.block.kind === "lessonVideo" ? canonSection.block : null;
    return {
      ...canonSection,
      eyebrow: videoMeta?.eyebrow ?? canonSection.eyebrow,
      title: videoMeta?.title ?? canonSection.title,
      block: {
        kind: "lessonVideo",
        caption: findVideoCaption(pkg) ?? canonVideo?.caption,
        url: canonVideo?.url,
        poster: canonVideo?.poster,
        durationLabel: canonVideo?.durationLabel,
      },
    };
  }

  if (kind === "diagram") {
    if (!strictVisual) {
      return canonSection;
    }
    // Block 7: keep slot parity id for structure, but never carry ar-EG
    // chrome/caption. Renderer must not mount LESSON_DIAGRAMS for package locales.
    const diagramMeta = findDiagramSectionMeta(pkg);
    const canonDiagram =
      canonSection.block.kind === "diagram" ? canonSection.block : null;
    if (!canonDiagram) return null;
    return {
      icon: canonSection.icon,
      tone: canonSection.tone,
      eyebrow: strictChromeOrPackage(
        pkg.locale,
        diagramMeta?.eyebrow,
        "Diagram block (intent)",
      ),
      title: strictChromeOrPackage(
        pkg.locale,
        diagramMeta?.title,
        "Diagram block (intent)",
      ),
      block: {
        kind: "diagram",
        id: canonDiagram.id,
        caption: strictPackageText(pkg.locale, diagramMeta?.caption),
        label: undefined,
      },
    };
  }

  if (kind === "caseStudy") {
    return null;
  }

  if (kind === "screenshot") {
    const localizedCaption =
      localized?.block.kind === "screenshot"
        ? localized.block.caption
        : undefined;
    if (strictVisual) {
      // Block 7: never inherit ar-EG src/alt/label/caption/chrome.
      return {
        ...canonSection,
        title: strictChromeOrPackage(
          pkg.locale,
          localized?.title,
          "Screenshot block (intent)",
        ),
        eyebrow: strictChromeOrPackage(
          pkg.locale,
          localized?.eyebrow,
          "Screenshot block (intent)",
        ),
        block: {
          kind: "screenshot",
          caption: strictPackageText(pkg.locale, localizedCaption),
          // src/alt/label resolved at render from exact-locale assets / UI only.
        },
      };
    }
    const canonShot =
      canonSection.block.kind === "screenshot" ? canonSection.block : null;
    return {
      ...canonSection,
      title: localized?.title ?? canonSection.title,
      eyebrow: localized?.eyebrow ?? canonSection.eyebrow,
      block: {
        kind: "screenshot",
        src: canonShot?.src,
        alt: canonShot?.alt,
        label: canonShot?.label,
        caption: localizedCaption ?? canonShot?.caption,
      },
    };
  }

  if (!localized) {
    if (kind === "paragraphs" && /خلّصت|wrap-up|confidence/i.test(canonSection.eyebrow)) {
      return null;
    }
    return null;
  }

  return {
    icon: localized.icon,
    eyebrow: localized.eyebrow,
    title: localized.title,
    tone: localized.tone ?? canonSection.tone,
    block: localized.block,
  };
}

function alignPackageToCanonicalStructure(
  packageSections: IntroLessonSection[],
  canonical: IntroLessonContent,
  pkg: LocalizedPackageInput,
): IntroLessonContent {
  const queues = queueSectionsByKind(packageSections);
  const aligned: IntroLessonSection[] = [];

  for (const canonSection of canonical) {
    const kind = canonSection.block.kind;
    const localized =
      kind === "lessonVideo" || kind === "diagram" || kind === "caseStudy"
        ? null
        : takeQueuedSection(queues, kind);
    const merged = mergeCanonicalSection(canonSection, localized, pkg);
    if (merged) aligned.push(merged);
  }

  return aligned;
}

/** Block-kind sequence for parity assertions against canonical ar-EG content. */
export function introContentBlockKinds(
  content: IntroLessonContent,
): readonly string[] {
  return content.map((section) => section.block.kind);
}

/**
 * Adapt a localized JSON package into canonical IntroLessonContent shape.
 * When canonical ar-EG content exists, section order and block kinds follow it exactly.
 */
export function adaptLocalizedPackageToIntroContent(
  pkg: LocalizedPackageInput,
  canonical: IntroLessonContent | null,
): IntroLessonContent {
  const packageSections = buildPackageIntroSections(pkg);
  if (canonical?.length) {
    return alignPackageToCanonicalStructure(packageSections, canonical, pkg);
  }
  return packageSections;
}
