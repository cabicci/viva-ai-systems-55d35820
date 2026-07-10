import * as React from "react";
import { ArrowLeft, CheckCircle2, AlertTriangle, PlayCircle, Wrench, Image as ImageIcon, BookOpen, Monitor, ArrowUpLeft, Target } from "lucide-react";
import { IntroSection } from "./IntroSection";
import { IntroMissionPrompt } from "./IntroMission";
import type { IntroBlock, IntroLessonContent } from "./intro-lesson-types";
import { LESSON_DIAGRAMS } from "./diagrams/LessonDiagrams";
import { QuizBlock } from "./QuizBlock";
import { getBunnyEmbedUrl } from "@/lib/bunny-videos";
import { getValueHookForLocale } from "./value-hooks";
import { resolveLearnerLessonIcon } from "./resolve-learner-lesson-icon";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";

function lessonVideoHasSource(
  block: Extract<IntroBlock, { kind: "lessonVideo" }>,
  lessonId?: string,
): boolean {
  return Boolean(getBunnyEmbedUrl(lessonId) || block.url);
}

function VideoSkipNotice() {
  const { locale, dir } = useLocale();
  return (
    <div className="text-center py-1 space-y-1.5" dir={dir}>
      <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/[0.06] px-2.5 py-1 text-[11px] text-muted-foreground">
        {getUiString(locale, "intro.video.optionalBadge")}
      </span>
      <p className="text-xs text-muted-foreground/90 leading-relaxed px-2">
        {getUiString(locale, "intro.video.skipBody")}
      </p>
    </div>
  );
}

/**
 * Resolve a video URL (legacy `/lessons/intro/{slug}.mp4` or any other path)
 * to a Bunny Stream iframe embed when we have a GUID for that lesson slug.
 * Falls back to the original URL so legacy explicit URLs still work.
 */
function resolveVideoSource(url: string | undefined, lessonId?: string): {
  embed?: string;
  direct?: string;
} {
  // Prefer Bunny by lessonId.
  const byLesson = getBunnyEmbedUrl(lessonId);
  if (byLesson) return { embed: byLesson };
  // Try to derive slug from a /lessons/intro/{slug}.mp4 URL.
  if (url) {
    const m = url.match(/\/lessons\/intro\/([^/]+)\.mp4$/);
    if (m) {
      const byUrl = getBunnyEmbedUrl(m[1]);
      if (byUrl) return { embed: byUrl };
    }
    return { direct: url };
  }
  return {};
}

/**
 * Turn bare URLs / domain.tld occurrences inside a paragraph into
 * clickable links that open in a new tab.
 */
function linkify(text: string): React.ReactNode {
  const regex = /(https?:\/\/[^\s)]+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)]*)?)/gi;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const raw = m[0];
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    parts.push(
      <a
        key={`lnk-${key++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {raw}
      </a>
    );
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/**
 * Renders a full Introduction lesson body from a content array.
 * Adding a new intro lesson = writing a new IntroLessonContent
 * array. No new components or JSX wiring needed.
 */
export function IntroLessonRenderer({
  content,
  lessonId,
  lessonTitle,
}: {
  content: IntroLessonContent;
  lessonId?: string;
  lessonTitle?: string;
}) {
  const { locale, dir } = useLocale();
  const hook = getValueHookForLocale(lessonId, locale);
  const hasMission = content.some((s) => s.block.kind === "mission");
  return (
    <article className="space-y-4 md:space-y-7">
      {hook && (
        <aside
          dir={dir}
          className="rounded-2xl border border-accent/30 bg-gradient-to-l from-accent/[0.08] to-primary/[0.05] px-4 sm:px-5 py-4 flex items-start gap-3 shadow-[0_8px_30px_-14px_hsl(var(--accent)/0.25)]"
          aria-label={getUiString(locale, "intro.valueHook.ariaLabel")}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/15 border border-accent/30 text-accent shrink-0 mt-0.5">
            <Target className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <p className="text-[10px] font-mono tracking-widest text-accent">
              {getUiString(locale, "intro.valueHook.label")}
            </p>
            <p className="text-[15px] leading-[1.7] font-semibold text-foreground">
              {hook}
            </p>
          </div>
        </aside>
      )}
      {hasMission && (
        <div className="flex justify-center sm:justify-end -mt-1">
          <a
            href="#mission"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.08] px-4 py-2.5 text-xs font-medium text-primary/90 hover:bg-primary/[0.12] hover:text-primary transition min-h-[44px]"
          >
            {getUiString(locale, "intro.mission.jumpCta")}
          </a>
        </div>
      )}
      {content.map((section, i) => {
        if (
          section.block.kind === "lessonVideo" &&
          !lessonVideoHasSource(section.block, lessonId)
        ) {
          return <VideoSkipNotice key={i} />;
        }
        const SectionIcon = resolveLearnerLessonIcon(section.icon, section.block.kind);
        return (
          <IntroSection
            key={i}
            index={i + 1}
            icon={SectionIcon}
            eyebrow={section.eyebrow}
            title={section.title}
            tone={section.tone}
          >
            <BlockBody block={section.block} lessonId={lessonId} lessonTitle={lessonTitle} />
          </IntroSection>
        );
      })}
    </article>
  );
}

function BlockBody({ block, lessonId, lessonTitle }: { block: IntroBlock; lessonId?: string; lessonTitle?: string }) {
  const { locale, dir } = useLocale();

  switch (block.kind) {
    case "paragraphs":
      return (
        <>
          {block.paragraphs.map((p, i) => (
            <p key={i}>{linkify(p)}</p>
          ))}
        </>
      );

    case "comparison":
      return (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-foreground/5 p-3">
            <p className="text-[11px] font-mono text-muted-foreground mb-1">
              {block.left.label}
            </p>
            <p>{block.left.body}</p>
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/[0.05] p-3">
            <p className="text-[11px] font-mono text-accent mb-1">
              {block.right.label}
            </p>
            <p>{block.right.body}</p>
          </div>
        </div>
      );

    case "quote":
      return <p className="italic">{block.quote}</p>;

    case "flow":
      return (
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="rounded-lg border border-border bg-foreground/5 px-3 py-1.5">
            {block.steps[0]}
          </span>
          <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="rounded-lg border border-accent/25 bg-accent/[0.06] px-3 py-1.5 text-accent">
            {block.steps[1]}
          </span>
          <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-1.5 text-primary">
            {block.steps[2]}
          </span>
        </div>
      );

    case "mission":
      return (
        <div id="mission" className="scroll-mt-24">
          <IntroMissionPrompt
            intro={block.intro}
            prompt={block.prompt}
            buttonLabel={block.buttonLabel}
            copiedLabel={block.copiedLabel}
            rubric={block.rubric}
            lessonId={block.lessonId ?? lessonId}
            missionId={block.missionId}
            lessonTitle={lessonTitle}
            template={block.template}
          />
        </div>
      );

    case "checklist":
      return (
        <ul className="space-y-2">
          {block.items.map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      );

    case "numberedList":
      return (
        <ul className="space-y-2">
          {block.items.map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-accent/15 text-accent text-[10px] font-mono shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      );

    case "rule":
      return <p className="font-semibold">{block.statement}</p>;

    case "video": {
      if (!block.url) {
        return <VideoSkipNotice />;
      }
      const src = resolveVideoSource(block.url, lessonId);
      return (
        <figure className="space-y-2">
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface-scrim">
            {src.embed ? (
              <iframe
                src={src.embed}
                loading="lazy"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            ) : (
              <video
                src={src.direct}
                poster={block.poster}
                controls
                className="h-full w-full"
              />
            )}
          </div>
          {block.caption && (
            <figcaption className="text-xs text-muted-foreground flex items-center gap-1.5">
              <PlayCircle className="h-3.5 w-3.5" /> {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "lessonVideo": {
      // Canonical lesson video — slot #2 in the unified lesson rhythm.
      // Resolution order:
      //   1. Bunny Stream GUID by lessonId (preferred, CDN-delivered)
      //   2. explicit block.url (legacy override)
      // If nothing resolves → "coming soon" placeholder.
      const embed = getBunnyEmbedUrl(lessonId);
      const resolvedUrl = embed ?? block.url;
      return (
        <LessonVideoBlock
          url={resolvedUrl}
          isEmbed={Boolean(embed)}
          poster={block.poster}
          caption={block.caption}
          durationLabel={block.durationLabel}
        />
      );
    }

    case "executionTask": {
      if (!block.title && !block.steps?.length && !block.expectedResult) return null;
      return (
        <div className="rounded-xl border border-accent/25 bg-accent/[0.05] p-4 sm:p-5 space-y-3 sm:space-y-4">
          {block.title && (
            <p className="text-[11px] font-mono text-accent flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> {block.title}
            </p>
          )}
          {block.steps && block.steps.length > 0 && (
            <ol className="space-y-2.5 sm:space-y-3">
              {block.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-accent/15 text-accent text-[11px] font-mono shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          )}
          {block.expectedResult && (
            <p className="text-sm text-muted-foreground border-t border-accent/15 pt-3">
              <span className="text-foreground font-semibold">
                {getUiString(locale, "intro.block.expectedResultLabel")}
              </span>
              {block.expectedResult}
            </p>
          )}
        </div>
      );
    }

    case "toolBlock": {
      if (!block.name && !block.description) return null;
      return (
        <div className="rounded-xl border border-border bg-foreground/5 p-4 space-y-1">
          <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" /> {getUiString(locale, "intro.block.toolLabel")}
          </p>
          {block.name && <p className="font-semibold">{block.name}</p>}
          {block.description && <p>{block.description}</p>}
          {block.url && (
            <a
              href={block.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-block mt-1"
            >
              {block.url}
            </a>
          )}
        </div>
      );
    }

    case "warning": {
      if (!block.title && !block.body) return null;
      return (
        <div className="rounded-xl border border-accent-warning/40 bg-accent-warning/20 p-4 space-y-1">
          <p className="text-[11px] font-mono text-accent-warning-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />{" "}
            {block.title ?? getUiString(locale, "intro.block.warningDefault")}
          </p>
          {block.body && <p>{block.body}</p>}
        </div>
      );
    }

    case "screenshot": {
      const label = block.label ?? getUiString(locale, "intro.block.screenshotLabel");
      if (!block.src) {
        return (
          <div className="rounded-2xl border border-primary/25 ring-1 ring-primary/5 bg-card overflow-hidden shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.2)]">
            <div className="flex items-center gap-1.5 bg-primary/10 border-b border-primary/20 px-3 py-2">
              <Monitor className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-mono text-primary">{label}</span>
            </div>
            <div className="p-6 text-center space-y-2 border border-dashed border-primary/20 m-3 rounded-xl bg-primary/[0.03]">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary/10">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-foreground">
                {block.caption ?? getUiString(locale, "intro.block.screenshotPlaceholder")}
              </p>
              <p className="text-[10px] font-mono text-primary/80">
                {getUiString(locale, "intro.block.comingSoon")}
              </p>
            </div>
          </div>
        );
      }
      return (
        <figure className="space-y-2">
          <div className="overflow-hidden rounded-2xl border border-primary/25 ring-1 ring-primary/5 bg-card shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.2)]">
            <div className="flex items-center gap-1.5 bg-primary/10 border-b border-primary/20 px-3 py-2">
              <Monitor className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-mono text-primary">{label}</span>
            </div>
            <img
              src={block.src}
              alt={block.alt ?? block.caption ?? getUiString(locale, "intro.block.screenshotAlt")}
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
          {block.caption && (
            <figcaption className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-primary" /> {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "concepts": {
      if (!block.items?.length) return null;
      return (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 sm:p-5 space-y-3">
          <p className="text-[11px] font-mono text-primary flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> {getUiString(locale, "intro.block.conceptsHeader")}
          </p>
          <ul className="space-y-3">
            {block.items.map((it, i) => (
              <li key={i} className="border-s-2 border-primary/30 ps-3">
                <p className="font-semibold leading-snug">
                  <span className="font-mono text-primary">{it.term}</span>
                  <span className="text-muted-foreground mx-1.5">·</span>
                  <span>{it.meaning}</span>
                </p>
                {it.example && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {it.example}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case "diagram": {
      const Diagram = LESSON_DIAGRAMS[block.id];
      if (!Diagram) return null;
      const label = block.label ?? getUiString(locale, "intro.block.diagramLabel");
      return (
        <figure className="space-y-2">
          <div className="overflow-hidden rounded-2xl border border-primary/20 bg-card">
            <Diagram />
          </div>
          {block.caption && (
            <figcaption className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-primary" /> {block.caption}
            </figcaption>
          )}
          <p className="text-[10px] font-mono text-primary/70">{label}</p>
        </figure>
      );
    }

    case "quiz":
      return <QuizBlock lessonId={block.lessonId} items={block.items} />;

    case "caseStudy": {
      const angleLabel: Record<string, string> = {
        builder: "Builder",
        creator: "Creator",
        automator: "Automator",
        analyst: "Analyst",
        business: "Business",
      };
      return (
        <div className="rounded-2xl border border-accent/30 border-e-4 bg-accent/[0.05] p-4 sm:p-5 space-y-3 shadow-[0_8px_30px_-14px_hsl(var(--accent)/0.25)]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[11px] font-mono text-accent flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> {getUiString(locale, "intro.block.caseStudyHeader")}
            </p>
            {block.pathAngle && (
              <span className="text-[10px] font-mono rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-accent">
                {angleLabel[block.pathAngle]}
              </span>
            )}
          </div>
          <p className="font-semibold text-base leading-snug">{block.title}</p>
          <p className="text-sm leading-relaxed text-foreground/90">{block.summary}</p>
          <ul className="space-y-2">
            {block.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
          {block.link && (
            <a
              href={block.link.href}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-accent hover:underline mt-1"
            >
              <ArrowUpLeft className="h-3.5 w-3.5" /> {block.link.label}
            </a>
          )}
        </div>
      );
    }
  }
}

function LessonVideoBlock({
  url,
  isEmbed,
  poster,
  caption,
  durationLabel,
}: {
  url?: string;
  isEmbed?: boolean;
  poster?: string;
  caption?: string;
  durationLabel?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  if (!url || errored) {
    return <VideoSkipNotice />;
  }
  return (
    <figure className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-accent/20 bg-surface-scrim shadow-lg shadow-accent/5">
        {isEmbed ? (
          <iframe
            src={url}
            loading="lazy"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <video
            src={url}
            poster={poster}
            controls
            preload="metadata"
            className="h-full w-full"
            onError={() => setErrored(true)}
          />
        )}
        {durationLabel && (
          <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-surface-scrim px-2 py-0.5 text-[10px] font-mono text-primary-foreground">
            {durationLabel}
          </span>
        )}
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground flex items-center gap-1.5">
          <PlayCircle className="h-3.5 w-3.5 text-accent" /> {caption}
        </figcaption>
      )}
    </figure>
  );
}