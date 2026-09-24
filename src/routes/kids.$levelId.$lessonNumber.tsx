import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { KidsLessonBody } from "@/components/kids/KidsLessonBody";
import { KidsParentPanel } from "@/components/kids/KidsParentPanel";
import { KIDS_LEVELS, type KidsLevelId } from "@/lib/kids/catalogue";
import { getKidsJourneyCopy } from "@/lib/kids/journey-copy";
import {
  parseProtectedLesson,
  parseProtectedPlayback,
  type KidsLesson,
} from "@/lib/kids/lesson-client";
import { useKidsParentState } from "@/lib/kids/parent-state";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";

export const Route = createFileRoute("/kids/$levelId/$lessonNumber")({
  validateSearch: parseLocaleSearchParam,
  beforeLoad: ({ params }) => {
    if (
      !KIDS_LEVELS.some((level) => level.id === params.levelId) ||
      !/^(?:[1-9]|1[0-2])$/.test(params.lessonNumber)
    )
      throw notFound();
  },
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    const publicMeta = buildLocalizedPublicMeta(locale, "kids");
    return {
      ...publicMeta,
      meta: [...publicMeta.meta, { name: "robots", content: "noindex, nofollow" }],
    };
  },
  component: KidsLessonPage,
});

function KidsLessonPage() {
  const { levelId, lessonNumber: lessonText } = Route.useParams();
  const level = levelId as KidsLevelId;
  const lessonNumber = Number(lessonText);
  const { locale, dir } = useLocale();
  const localeSearch = useLocaleLinkSearch();
  const copy = getKidsJourneyCopy(locale);
  const { state, profiles } = useKidsParentState();
  const [profileId, setProfileId] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    key: string;
    lesson: KidsLesson;
    embedUrl: string;
  } | null>(null);
  const [denied, setDenied] = useState(false);
  const availableProfiles = profiles.filter((profile) => profile.level_id === level);
  const selected =
    state === "ready" && availableProfiles.some((profile) => profile.id === profileId);
  const lessonKey = `${level}-${lessonNumber}-${locale}-${profileId}`;
  const visibleResult = selected && result?.key === lessonKey ? result : null;

  useEffect(() => {
    setResult(null);
    setDenied(false);
    setProfileId("");
    setAttempt(0);
  }, [levelId, lessonText, locale]);

  useEffect(() => {
    let active = true;
    if (attempt < 1 || !selected)
      return () => {
        active = false;
      };
    setLoading(true);
    setDenied(false);
    setResult(null);
    const body = { profileId, levelId: level, lessonNumber, locale };
    (async () => {
      // Neither response may be rendered alone. Both endpoints enforce the same server grant.
      const [lessonResponse, playbackResponse] = await Promise.all([
        supabase.functions.invoke("kids-lesson-content", { body }),
        supabase.functions.invoke("kids-playback", { body }),
      ]);
      if (!active) return;
      const lesson =
        !lessonResponse.error &&
        parseProtectedLesson(lessonResponse.data, level, lessonNumber, locale);
      const embedUrl = !playbackResponse.error && parseProtectedPlayback(playbackResponse.data);
      if (!lesson || !embedUrl) {
        setDenied(true);
        return;
      }
      setResult({ key: `${level}-${lessonNumber}-${locale}-${profileId}`, lesson, embedUrl });
    })()
      .catch(() => {
        if (active) setDenied(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt, selected, profileId, level, lessonNumber, locale]);

  return (
    <div className="flex min-h-dvh flex-col" dir={dir}>
      <Navbar />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto max-w-5xl space-y-7 px-4 py-10 md:py-16">
          <Link
            to="/kids/$levelId"
            params={{ levelId }}
            search={localeSearch()}
            className="text-sm font-bold text-primary hover:underline"
          >
            {copy.backLevel}
          </Link>
          {visibleResult ? (
            <KidsLessonBody
              key={lessonKey}
              lesson={visibleResult.lesson}
              embedUrl={visibleResult.embedUrl}
              locale={locale}
              levelId={level}
              lessonNumber={lessonNumber}
              profileId={profileId}
            />
          ) : (
            <section className="rounded-3xl border border-primary/20 bg-card p-6 md:p-9">
              <p className="text-sm font-semibold text-primary">
                {copy.level} {Number(level.slice(-1))}
              </p>
              <h1 className="mt-3 text-3xl font-black">
                {copy.lesson} {lessonNumber}
              </h1>
              <p role="status" className="mt-4 text-sm text-muted-foreground">
                {loading ? copy.loading : denied ? copy.unavailableLesson : copy.lockedDetail}
              </p>
              {state === "ready" && (
                <div className="mt-6 max-w-sm space-y-3">
                  {availableProfiles.length > 0 ? (
                    <>
                      <label htmlFor="kids-profile-choice" className="block text-sm font-bold">
                        {copy.chooseProfile}
                      </label>
                      <select
                        id="kids-profile-choice"
                        value={profileId}
                        onChange={(event) => {
                          setResult(null);
                          setDenied(false);
                          setAttempt(0);
                          setProfileId(event.target.value);
                        }}
                        className="min-h-11 w-full rounded-md border border-input bg-background px-3"
                      >
                        <option value="">{copy.chooseProfile}</option>
                        {availableProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.display_name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!selected || loading}
                        onClick={() => setAttempt((value) => value + 1)}
                        className="min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50"
                      >
                        {copy.openLesson}
                      </button>
                    </>
                  ) : (
                    <p className="text-sm">{copy.noLevelProfile}</p>
                  )}
                </div>
              )}
              {state !== "ready" && (
                <div className="mt-6">
                  <KidsParentPanel />
                </div>
              )}
            </section>
          )}
          {visibleResult && (
            <nav aria-label={copy.lesson} className="flex flex-wrap gap-3">
              {lessonNumber > 1 && (
                <Link
                  to="/kids/$levelId/$lessonNumber"
                  params={{ levelId, lessonNumber: String(lessonNumber - 1) }}
                  search={localeSearch()}
                  className="rounded-full border border-primary px-5 py-3 text-sm font-bold text-primary"
                >
                  {copy.lesson} {lessonNumber - 1}
                </Link>
              )}
              {lessonNumber < 12 && (
                <Link
                  to="/kids/$levelId/$lessonNumber"
                  params={{ levelId, lessonNumber: String(lessonNumber + 1) }}
                  search={localeSearch()}
                  className="rounded-full border border-primary px-5 py-3 text-sm font-bold text-primary"
                >
                  {copy.lesson} {lessonNumber + 1}
                </Link>
              )}
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
