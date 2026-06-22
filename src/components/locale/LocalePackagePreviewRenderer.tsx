import { useMemo } from "react";
import {
  Image as ImageIcon,
  Monitor,
} from "lucide-react";
import { IntroSection } from "@/components/intro/IntroSection";
import { resolveLearnerLessonIcon } from "@/components/intro/resolve-learner-lesson-icon";
import {
  adaptLocalizedPackageToPreviewContent,
  previewBodyDirection,
  type PreviewLessonBlock,
  type PreviewLessonSection,
} from "@/lib/locale-lessons/adapt-package-to-preview-content";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";
import { LocalePreviewMission } from "./LocalePreviewMission";
import { LocalePreviewQuiz } from "./LocalePreviewQuiz";
import { PackageLearnerMarkdown } from "./PackageLearnerMarkdown";

type PreviewPackage = Pick<
  LocalizedLessonPackage,
  "locale" | "lessonId" | "title" | "sections"
>;

function previewBlockKind(
  block: PreviewLessonBlock,
): "paragraphs" | "concepts" | "comparison" | "quiz" | "mission" | "screenshot" {
  switch (block.kind) {
    case "quizPreview":
      return "quiz";
    case "missionPreview":
      return "mission";
    case "concepts":
      return "concepts";
    case "comparison":
      return "comparison";
    case "screenshotPlaceholder":
      return "screenshot";
    default:
      return "paragraphs";
  }
}

function PreviewBlockBody({ block }: { block: PreviewLessonBlock }) {
  switch (block.kind) {
    case "paragraphs":
      return (
        <div className="space-y-3">
          {block.paragraphs.map((paragraph, index) => (
            <PackageLearnerMarkdown key={index} text={paragraph} />
          ))}
        </div>
      );

    case "concepts":
      return (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 sm:p-5 space-y-3">
          <ul className="space-y-3">
            {block.items.map((item, index) => (
              <li key={index} className="border-s-2 border-primary/30 ps-3">
                <p className="font-semibold leading-snug">
                  <span className="font-mono text-primary">{item.term}</span>
                  <span className="text-muted-foreground mx-1.5">·</span>
                  <span>{item.meaning}</span>
                </p>
                {item.example ? (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {item.example}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      );

    case "comparison":
      return (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-foreground/5 p-3">
            <p className="text-[11px] font-mono text-muted-foreground mb-1">
              {block.left.label}
            </p>
            <PackageLearnerMarkdown text={block.left.body} />
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/[0.05] p-3">
            <p className="text-[11px] font-mono text-accent mb-1">
              {block.right.label}
            </p>
            <PackageLearnerMarkdown text={block.right.body} />
          </div>
        </div>
      );

    case "dataTable":
      return (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full min-w-[20rem] text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                {block.headers.map((header) => (
                  <th key={header} className="px-4 py-2 text-start font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border/30 align-top">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-foreground/90">
                      <PackageLearnerMarkdown text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "quizPreview":
      return (
        <LocalePreviewQuiz question={block.question} options={block.options} />
      );

    case "missionPreview":
      return (
        <LocalePreviewMission
          intro={block.intro}
          delivery={block.delivery}
          rubric={block.rubric}
        />
      );

    case "screenshotPlaceholder":
      return (
        <div className="rounded-2xl border border-primary/25 ring-1 ring-primary/5 bg-card overflow-hidden">
          <div className="flex items-center gap-1.5 bg-primary/10 border-b border-primary/20 px-3 py-2">
            <Monitor className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-mono text-primary">
              Platform preview
            </span>
          </div>
          <div className="p-6 text-center space-y-2 border border-dashed border-primary/20 m-3 rounded-xl bg-primary/[0.03]">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary/10">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-foreground">
              {block.caption ?? "Screenshot placeholder in localized preview."}
            </p>
          </div>
        </div>
      );

    case "videoPreviewNote":
      return (
        <p
          className="text-xs text-muted-foreground font-mono"
          data-preview-video="omitted"
        >
          [Internal preview: lesson video omitted for localized packages]
        </p>
      );
  }
}

function PreviewSectionCard({
  section,
  index,
}: {
  section: PreviewLessonSection;
  index: number;
}) {
  const blockKind = previewBlockKind(section.block);
  const Icon = resolveLearnerLessonIcon(section.icon, blockKind);

  return (
    <IntroSection
      index={index + 1}
      icon={Icon}
      eyebrow={section.eyebrow}
      title={section.title}
      tone={section.tone}
    >
      <PreviewBlockBody block={section.block} />
    </IntroSection>
  );
}

/**
 * Internal locale package preview with live-like section cards.
 * Missions, quizzes, and videos stay read-only / omitted — no Supabase side effects.
 */
export function LocalePackagePreviewRenderer({
  pkg,
}: {
  pkg: PreviewPackage;
}) {
  const sections = useMemo(
    () => adaptLocalizedPackageToPreviewContent(pkg),
    [pkg],
  );
  const bodyDir = previewBodyDirection(pkg.locale);

  return (
    <article
      dir={bodyDir}
      className="space-y-4 md:space-y-7"
      data-locale-preview={pkg.locale}
      data-lesson-id={pkg.lessonId}
      data-preview-body-direction={bodyDir}
    >
      {sections.map((section, index) => (
        <PreviewSectionCard key={`${section.title}-${index}`} section={section} index={index} />
      ))}
    </article>
  );
}
