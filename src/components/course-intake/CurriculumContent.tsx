import type { IntakeSection } from "@/lib/course-system/intake/package";
import type { SupportedLocale } from "@/lib/locale/types";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { CourseInlineText } from "./CourseInlineText";
export type LessonContent = {
  id: string;
  title: string;
  sections: IntakeSection[];
  assets: { id: string; url?: string; label: string; type: string; caption?: string }[];
};
/** Text and reviewed hosted media only. No imported JSX, HTML, scripts or frames
 * from arbitrary origins. Video mounts only in its selected third tab. */
export function CurriculumContent({
  lesson,
  selected,
  onSelect,
  locale,
  children,
  resolveAsset,
  progressLabel,
}: {
  progressLabel?: string;
  lesson: LessonContent;
  selected: string;
  onSelect(id: string): void;
  locale: SupportedLocale;
  children?: React.ReactNode;
  resolveAsset?: (id: string) => Promise<string>;
}) {
  const c = intakeCopy(locale);
  const section = lesson.sections.find((s) => s.id === selected) ?? lesson.sections[0];
  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-3xl border bg-card p-4 lg:sticky lg:top-24">
        <nav aria-label={c.step} className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {lesson.sections.map((s) => {
            const kind = c[s.kind];
            const active = section.id === s.id;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => onSelect(s.id)}
                aria-current={active ? "page" : undefined}
                aria-controls="curriculum-lesson-section"
                className={`min-h-11 min-w-0 break-words rounded-xl p-3 text-start font-bold ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {kind && kind !== s.title && (
                  <span
                    className={`block text-xs font-semibold ${active ? "" : "text-muted-foreground"}`}
                  >
                    {kind}
                  </span>
                )}
                {s.title}
              </button>
            );
          })}
        </nav>
        {progressLabel && (
          <p className="mt-5 border-t pt-4 text-sm leading-7 text-muted-foreground" role="status">
            {progressLabel}
          </p>
        )}
      </aside>
      <section
        id="curriculum-lesson-section"
        className="min-w-0 space-y-5 rounded-3xl border bg-card p-5 md:p-8"
        aria-label={section.title}
      >
        <h2 className="text-2xl font-bold">{section.title}</h2>
        <p className="text-sm text-muted-foreground">
          {section.required ? c.required : c.optional}
        </p>
        {section.durationMinutes !== undefined && (
          <p>
            {c.duration}: {section.durationMinutes}
          </p>
        )}
        {section.passPercent !== undefined && (
          <p>
            {c.passMark}: {section.passPercent}%
          </p>
        )}
        {section.paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-wrap break-words leading-8">
            <CourseInlineText text={p} />
          </p>
        ))}
        {section.assets
          .map((id) => lesson.assets.find((a) => a.id === id))
          .filter((a) => !!a)
          .map((asset) =>
            section.kind === "video" && asset.type === "video" && asset.url ? (
              <div key={asset.id}>
                {new URL(asset.url).hostname === "iframe.mediadelivery.net" ? (
                  <iframe
                    title={asset.label}
                    src={asset.url}
                    className="aspect-video w-full rounded-xl"
                    allow="fullscreen; picture-in-picture"
                    allowFullScreen
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
        {children}
      </section>
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
          className="block min-h-11 font-semibold text-primary underline"
        >
          {asset.label}
        </a>
      ) : (
        <Button
          variant="outline"
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
