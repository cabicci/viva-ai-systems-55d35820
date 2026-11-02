import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";
import { curriculumAdmin, curriculumAsset } from "@/lib/course-system/intake/functions";
import type { CourseArea } from "@/lib/course-system/contract";
import type { PublicIntake } from "@/lib/course-system/intake/package";
import { useLocale } from "@/lib/locale/locale-context";
import { useAuth } from "@/lib/auth-context";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import { CurriculumContent } from "@/components/course-intake/CurriculumContent";
import { Navbar } from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/admin/curricula")({
  beforeLoad: requireAdminBeforeLoad,
  head: () => ({
    meta: [
      { title: "Curriculum admission — Masaarat" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CurriculumAdminPage,
});
type Entry = {
  area: CourseArea;
  id: string;
  titles: Record<string, string>;
  activeVersion: string | null;
  versions: { version: string; state: "draft" | "approved" | "ready" }[];
};
type Review = {
  version: string;
  state: string;
  expectedActive: string | null;
  publicCourse: PublicIntake;
  model: { activities: string[] };
  source: { reference: string };
  assessmentKeys: {
    lessonId: string;
    locale: string;
    keys: { questionId: string; correctIndex: number }[];
  }[];
};
function CurriculumAdminPage() {
  const auth = useAuth();
  return (
    <CurriculumAdminSession key={`${auth.user?.id ?? "anonymous"}:${auth.authGeneration.value}`} />
  );
}
function CurriculumAdminSession() {
  const auth = useAuth();
  const { locale, dir } = useLocale();
  const c = intakeCopy(locale);
  const command = useServerFn(curriculumAdmin);
  const assetLink = useServerFn(curriculumAsset);
  const client = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [selectedStep, selectStep] = useState("");
  const [section, selectSection] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const list = useQuery({
    queryKey: ["curriculum-admin", auth.user?.id],
    enabled: !!auth.user && !auth.loading,
    queryFn: async () => (await command({ data: { action: "list" } })) as unknown as Entry[],
    refetchInterval: 15000,
  });
  useEffect(() => {
    setReview(null);
    setChecked(false);
    setFile(null);
  }, [auth.user?.id]);
  async function run(fn: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    const generation = auth.authGeneration;
    try {
      await fn();
      if (active.current && auth.isAuthGenerationCurrent(generation))
        await client.invalidateQueries({ queryKey: ["curriculum-admin"] });
    } catch {
      if (active.current && auth.isAuthGenerationCurrent(generation)) setError(c.error);
    } finally {
      operation.current = false;
      if (active.current && auth.isAuthGenerationCurrent(generation)) setBusy(false);
    }
  }
  const course = review?.publicCourse;
  const step =
    course?.stations.flatMap((s) => s.steps).find((s) => s.id === selectedStep) ??
    course?.stations[0].steps[0];
  const lang = course?.locales.includes(locale) ? locale : course?.locales[0];
  return (
    <div dir={dir} className="min-h-dvh">
      <Navbar variant="account" />
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <h1 className="text-3xl font-bold">{c.gateway}</h1>
        <label className="block space-y-2">
          {c.upload}
          <input
            type="file"
            accept=".json,application/json"
            className="block"
            disabled={busy}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setReview(null);
              setChecked(false);
            }}
          />
        </label>
        <Button
          disabled={!file || busy}
          onClick={() =>
            run(async () => {
              if (!file || file.size > 8_000_000) throw new Error("INTAKE_SIZE");
              await command({ data: { action: "stage", raw: await file.text() } });
            })
          }
        >
          {c.stage}
        </Button>
        {(error || list.isError) && <p role="alert">{error || c.error}</p>}
        {list.isPending && <p role="status">{c.loading}</p>}
        {list.data?.length === 0 && <p>{c.empty}</p>}
        {list.data?.map((entry) => (
          <section key={`${entry.area}:${entry.id}`} className="rounded-xl border p-4">
            <h2 className="text-xl font-bold">
              {entry.titles[locale] ?? Object.values(entry.titles)[0]}
            </h2>
            {entry.versions.map((v) => (
              <div key={v.version} className="mt-3 flex flex-wrap items-center gap-4">
                <span>{c[v.state]}</span>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const result = (await command({
                        data: {
                          action: "review",
                          area: entry.area,
                          course: entry.id,
                          version: v.version,
                        },
                      })) as unknown as Review;
                      if (!active.current) return;
                      setReview(result);
                      setChecked(false);
                      selectStep("");
                      selectSection("");
                    })
                  }
                >
                  {c.review}
                </Button>
              </div>
            ))}
          </section>
        ))}
        {course && review && step && lang && (
          <section className="space-y-6 rounded-2xl border p-5">
            <h2 className="text-2xl font-black">{course.title[lang]}</h2>
            <p>
              {c.source}: {review.source.reference}
            </p>
            <p>
              {c.model}:{" "}
              {review.model.activities
                .map((x) =>
                  x === "notes"
                    ? c.notes
                    : x === "reading"
                      ? c.explanation
                      : c[x as keyof typeof c],
                )
                .join(" · ")}
            </p>
            <nav aria-label={c.stations} className="space-y-3">
              {course.stations.map((station) => (
                <div key={station.id}>
                  <h3 className="font-bold">{station.title[lang]}</h3>
                  <div className="flex flex-wrap gap-2">
                    {station.steps.map((s) => (
                      <Button
                        key={s.id}
                        variant={step.id === s.id ? "default" : "outline"}
                        onClick={() => {
                          selectStep(s.id);
                          selectSection("");
                        }}
                      >
                        {s.title[lang]}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <CurriculumContent
              key={`${review.version}:${step.id}:${lang}`}
              locale={lang}
              selected={section}
              onSelect={selectSection}
              lesson={{ id: step.id, title: step.title[lang]!, ...step.content[lang]! }}
              resolveAsset={async (asset) => {
                if (!auth.user) throw new Error("CURRICULUM_ACCOUNT_REQUIRED");
                const result = await assetLink({
                  data: {
                    expectedAccountId: auth.user.id,
                    area: course.area,
                    course: course.id,
                    lesson: step.id,
                    locale: lang,
                    version: review.version,
                    asset,
                  },
                });
                if (!active.current) throw new Error("CURRICULUM_ACCOUNT_CHANGED");
                return result.url;
              }}
            >
              {step.content[lang]!.sections.find((s) => s.id === section)?.questions.map((q) => (
                <fieldset key={q.id} className="space-y-2">
                  <legend>{q.prompt}</legend>
                  {q.options.map((o, i) => (
                    <p key={i}>
                      {i + 1}. {o}
                      {review.assessmentKeys
                        .find((k) => k.lessonId === step.id && k.locale === lang)
                        ?.keys.some((k) => k.questionId === q.id && k.correctIndex === i)
                        ? ` · ${c.correctAnswer}`
                        : ""}
                    </p>
                  ))}
                </fieldset>
              ))}
            </CurriculumContent>
            {review.state === "draft" && (
              <>
                <label className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  {c.reviewed}
                </label>
                <Button
                  disabled={!checked || busy}
                  onClick={() =>
                    run(async () => {
                      await command({
                        data: {
                          action: "approve",
                          area: course.area,
                          course: course.id,
                          version: review.version,
                          expectedActive: review.expectedActive,
                          reviewed: true,
                        },
                      });
                      setReview(null);
                      setChecked(false);
                    })
                  }
                >
                  {c.approve}
                </Button>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
