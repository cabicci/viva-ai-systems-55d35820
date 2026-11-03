import type { IntakeSection } from "@/lib/course-system/intake/package";
import type { SupportedLocale } from "@/lib/locale/types";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import { getAcademicCopy } from "@/lib/academic-education/copy";
import {
  exampleLayout,
  groupSections,
  lessonLead,
  parseBlocks,
  resolveGroup,
  type Block,
  type SectionGroup,
} from "@/lib/course-system/intake/presentation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CourseInlineText } from "./CourseInlineText";
export type LessonContent = {
  id: string;
  title: string;
  sections: IntakeSection[];
  assets: { id: string; url?: string; label: string; type: string; caption?: string }[];
};
const ACTIVITY = new Set(["questions", "exam", "mission", "practice"]);

/** Text and reviewed hosted media only. No imported JSX, HTML, scripts or frames
 * from arbitrary origins. Sections are shown in seven AC-BUS groups; every
 * section keeps its own id and activity. Media mounts only in its selected group. */
export function CurriculumContent({
  lesson,
  selected,
  onSelect,
  locale,
  children,
  activity,
  resolveAsset,
  progressLabel,
  progressValue,
  leadInHero = false,
}: {
  progressLabel?: string;
  progressValue?: number;
  lesson: LessonContent;
  /** Group key or a section id. */
  selected: string;
  onSelect(id: SectionGroup): void;
  locale: SupportedLocale;
  children?: ReactNode;
  /** Activity controls for one section; mounted for every section so input survives tab changes. */
  activity?: (section: IntakeSection) => ReactNode;
  resolveAsset?: (id: string) => Promise<string>;
  /** The first explanation paragraph is already shown in the lesson hero. */
  leadInHero?: boolean;
}) {
  const c = intakeCopy(locale);
  const groups = groupSections(lesson.sections);
  const current = resolveGroup(lesson.sections, selected);
  const lead = leadInHero ? lessonLead(lesson.sections) : null;
  const label = (g: SectionGroup) => (g === "check" ? c.check : c[g]);
  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-3xl border bg-card p-4 lg:sticky lg:top-24">
        <nav
          aria-label={getAcademicCopy(locale).sections}
          className="grid grid-cols-2 gap-2 lg:grid-cols-1"
        >
          {groups.map(({ group }) => (
            <button
              type="button"
              key={group}
              onClick={() => onSelect(group)}
              aria-pressed={group === current}
              aria-controls="curriculum-lesson-section"
              className={`min-h-11 min-w-0 break-words rounded-xl p-3 text-start font-bold ${group === current ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {label(group)}
            </button>
          ))}
        </nav>
        {progressLabel && (
          <section className="mt-6 space-y-3 border-t pt-5">
            <h2 className="font-bold">{c.learnerProgress}</h2>
            {progressValue !== undefined && (
              <Progress value={progressValue} aria-label={c.learnerProgress} />
            )}
            <p className="text-sm leading-7 text-muted-foreground" role="status">
              {progressLabel}
            </p>
          </section>
        )}
      </aside>
      <section
        id="curriculum-lesson-section"
        className="min-w-0 scroll-mt-24 space-y-6 rounded-3xl border bg-card p-5 md:p-8"
        aria-label={label(current)}
      >
        {groups.map(({ group, sections }) => (
          <div key={group} hidden={group !== current} className="space-y-6" data-group={group}>
            {sections.map((section) => {
              const showTitle = sections.length > 1 || section.title !== label(group);
              const paragraphs =
                lead && section.id === lead.sectionId
                  ? section.paragraphs.slice(1)
                  : section.paragraphs;
              return (
                <article
                  key={section.id}
                  id={`section-${section.id}`}
                  data-section={section.id}
                  className={`space-y-5 ${sections.length > 1 ? "border-t pt-5 first:border-t-0 first:pt-0" : ""}`}
                >
                  {showTitle && <h2 className="text-xl font-bold">{section.title}</h2>}
                  {ACTIVITY.has(section.kind) &&
                    (section.required ||
                      section.passPercent !== undefined ||
                      section.durationMinutes !== undefined) && (
                      <p className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {section.required && <span>{c.required}</span>}
                        {section.durationMinutes !== undefined && (
                          <span>
                            {c.duration}: {section.durationMinutes}
                          </span>
                        )}
                        {section.passPercent !== undefined && (
                          <span>
                            {c.passMark}: {section.passPercent}%
                          </span>
                        )}
                      </p>
                    )}
                  <SectionBody section={section} paragraphs={paragraphs} locale={locale} />
                  {group === current && (
                    <SectionAssets
                      section={section}
                      lesson={lesson}
                      locale={locale}
                      resolveAsset={resolveAsset}
                    />
                  )}
                  {activity?.(section)}
                </article>
              );
            })}
          </div>
        ))}
        {children}
      </section>
    </div>
  );
}

function SectionBody({
  section,
  paragraphs,
  locale,
}: {
  section: IntakeSection;
  paragraphs: string[];
  locale: SupportedLocale;
}) {
  const blocks = parseBlocks(paragraphs, section.kind === "faq");
  if (section.kind === "example") {
    const layout = exampleLayout(blocks);
    if (layout)
      return (
        <div className="space-y-5">
          {layout.opening && (
            <div className="rounded-xl border bg-muted/30 p-4 leading-8">
              <p className="mb-2 text-sm font-bold text-primary">{intakeCopy(locale).caseData}</p>
              <BlockView block={layout.opening} plain />
            </div>
          )}
          <ol className="list-none space-y-4 leading-8" role="list">
            {layout.steps.map((s, i) => (
              <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 font-bold"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 space-y-2">
                  {s.lead && <BlockView block={s.lead} plain />}
                  {s.formulas.map((f, j) => (
                    <BlockView key={j} block={f} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
          {layout.closing.map((b, i) => (
            <div key={i} className="rounded-xl bg-accent/20 p-4 leading-8">
              <BlockView block={b} plain />
            </div>
          ))}
        </div>
      );
  }
  return (
    <div className="space-y-4 leading-8">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  );
}

/** Renders a parsed block as inert text. `plain` drops box styling inside cards. */
export function BlockView({ block, plain = false }: { block: Block; plain?: boolean }) {
  switch (block.type) {
    case "heading":
      return (
        <h3 className="pt-2 text-lg font-bold">
          <CourseInlineText text={block.text} />
        </h3>
      );
    case "formula":
      return (
        <p className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-start" dir="ltr">
          <code className="whitespace-pre-wrap break-words">{block.text}</code>
        </p>
      );
    case "list": {
      const list = (
        <>
          {block.lead !== null && (
            <p className="font-bold">
              <CourseInlineText text={block.lead} />
            </p>
          )}
          <ul className="list-disc space-y-2 ps-6">
            {block.items.map((item, i) => (
              <li key={i}>
                <CourseInlineText text={item.text} />
              </li>
            ))}
          </ul>
        </>
      );
      return block.tone === "outcome" && !plain ? (
        <div className="space-y-3 rounded-xl bg-accent/20 p-4">{list}</div>
      ) : (
        <div className="space-y-3">{list}</div>
      );
    }
    case "callout":
      return plain ? (
        <p className="whitespace-pre-wrap break-words">
          <strong>{block.label}:</strong> <CourseInlineText text={block.body} />
        </p>
      ) : (
        <div
          className={`rounded-xl p-4 ${block.tone === "case" ? "border bg-muted/30" : "bg-accent/20"}`}
        >
          <p className="mb-1 font-bold">{block.label}</p>
          <p className="whitespace-pre-wrap break-words">
            <CourseInlineText text={block.body} />
          </p>
        </div>
      );
    case "faq":
      return (
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer font-bold">
            <CourseInlineText text={block.question} />
          </summary>
          <p className="mt-4 whitespace-pre-wrap break-words leading-8">
            <CourseInlineText text={block.answer} />
          </p>
        </details>
      );
    case "text":
      return (
        <p className="whitespace-pre-wrap break-words">
          <CourseInlineText text={block.text} />
        </p>
      );
  }
}

function SectionAssets({
  section,
  lesson,
  locale,
  resolveAsset,
}: {
  section: IntakeSection;
  lesson: LessonContent;
  locale: SupportedLocale;
  resolveAsset?: (id: string) => Promise<string>;
}) {
  const assets = section.assets
    .map((id) => lesson.assets.find((a) => a.id === id))
    .filter((a) => !!a);
  if (!assets.length) return null;
  return (
    <div className={section.kind === "downloads" ? "flex flex-wrap gap-3" : "space-y-4"}>
      {assets.map((asset) =>
        section.kind === "video" && asset.type === "video" && asset.url ? (
          <div key={asset.id}>
            {new URL(asset.url).hostname === "iframe.mediadelivery.net" ? (
              <iframe
                title={asset.label}
                src={asset.url}
                className="aspect-video w-full rounded-xl border-0"
                allow="fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <video
                aria-label={asset.label}
                src={asset.url}
                className="aspect-video w-full rounded-xl"
                controls
                preload="none"
              />
            )}
          </div>
        ) : asset.type === "image" ? (
          <PrivateImage key={asset.id} asset={asset} resolve={resolveAsset} locale={locale} />
        ) : (
          <PrivateAsset key={asset.id} asset={asset} resolve={resolveAsset} locale={locale} />
        ),
      )}
    </div>
  );
}

function PrivateImage({
  asset,
  resolve,
  locale,
}: {
  asset: { id: string; label: string; caption?: string };
  resolve?: (id: string) => Promise<string>;
  locale: SupportedLocale;
}) {
  const c = intakeCopy(locale),
    resolver = useRef(resolve);
  resolver.current = resolve;
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    setUrl("");
    setError(false);
    const lookup = resolver.current;
    if (!lookup) {
      setError(true);
      return;
    }
    void lookup(asset.id).then(
      (value) => {
        if (current) setUrl(value);
      },
      () => {
        if (current) setError(true);
      },
    );
    return () => {
      current = false;
    };
  }, [asset.id, retry]);
  return (
    <figure className="space-y-2">
      {url && !error ? (
        <img
          src={url}
          alt={asset.label}
          loading="lazy"
          className="max-w-full rounded-xl"
          onError={() => setError(true)}
        />
      ) : error ? (
        <p role="alert">
          {c.error}{" "}
          <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
            {c.retry}
          </Button>
        </p>
      ) : (
        <p role="status">{c.loading}</p>
      )}
      <figcaption className="text-sm text-muted-foreground">{asset.caption}</figcaption>
    </figure>
  );
}

function PrivateAsset({
  asset,
  resolve,
  locale,
}: {
  asset: { id: string; label: string };
  resolve?: (id: string) => Promise<string>;
  locale: SupportedLocale;
}) {
  const c = intakeCopy(locale);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const current = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    current.current = true;
    return () => {
      current.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  return (
    <div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-md px-4 font-semibold text-primary underline"
        >
          {asset.label}
        </a>
      ) : (
        <Button
          disabled={!resolve || busy}
          onClick={async () => {
            if (!resolve || busy) return;
            setBusy(true);
            setError(false);
            try {
              const signed = await resolve(asset.id);
              if (!current.current) return;
              setUrl(signed);
              timer.current = setTimeout(() => {
                if (current.current) setUrl("");
              }, 45000);
            } catch {
              if (current.current) setError(true);
            } finally {
              if (current.current) setBusy(false);
            }
          }}
        >
          {busy ? c.loading : asset.label}
        </Button>
      )}
      {error && <p role="alert">{c.error}</p>}
    </div>
  );
}
