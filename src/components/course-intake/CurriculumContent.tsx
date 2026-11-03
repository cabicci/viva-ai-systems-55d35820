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
}: {
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
    <div className="grid min-w-0 gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label={c.step} className="flex gap-2 overflow-auto md:flex-col">
        {lesson.sections.map((s) => (
          <Button
            key={s.id}
            variant={section.id === s.id ? "default" : "outline"}
            onClick={() => onSelect(s.id)}
            aria-current={section.id === s.id ? "page" : undefined}
            className="min-h-11 shrink-0 justify-start whitespace-normal text-start"
          >
            {c[s.kind]} · {s.title}
          </Button>
        ))}
      </nav>
      <section className="min-w-0 space-y-5" aria-label={section.title}>
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
