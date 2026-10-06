import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { KidsLessonBody } from "@/components/kids/KidsLessonBody";
import { KIDS_LEVELS, type KidsLevelId } from "@/lib/kids/catalogue";
import { getKidsJourneyCopy } from "@/lib/kids/journey-copy";
import {
  parseProtectedLesson,
  parseProtectedPlayback,
  type KidsLesson,
} from "@/lib/kids/lesson-client";
import { useKidsParentState } from "@/lib/kids/parent-state";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/entitlements";
import {
  clearActiveKidsProfile,
  getActiveKidsProfile,
  setActiveKidsProfile,
} from "@/lib/kids/active-profile";
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

export function KidsLessonPage() {
  const { levelId, lessonNumber: lessonText } = Route.useParams();
  const level = levelId as KidsLevelId;
  const lessonNumber = Number(lessonText);
  const { locale, dir } = useLocale();
  const localeSearch = useLocaleLinkSearch();
  const copy = getKidsJourneyCopy(locale);
  const { state, profiles } = useKidsParentState();
  const { user } = useAuth();
  const { isAdmin } = useEntitlement();
  const adminReview = !!user?.id && isAdmin;
  const [profileId, setProfileId] = useState("");
  const [profileChecked, setProfileChecked] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    key: string;
    lesson: KidsLesson;
    embedUrl: string;
  } | null>(null);
  const [denied, setDenied] = useState(false);
  const availableProfiles = profiles.filter((profile) => profile.level_id === level);
  const activeProfile =
    state === "ready" ? profiles.find((profile) => profile.id === profileId) : null;
  const selected =
    (adminReview && profileId === user?.id) ||
    (state === "ready" && availableProfiles.some((profile) => profile.id === profileId));
  const lessonKey = `${level}-${lessonNumber}-${locale}-${profileId}`;
  const visibleResult = selected && result?.key === lessonKey ? result : null;
  const openingLesson =
    (!adminReview && state === "checking") ||
    ((adminReview || state === "ready") &&
      (!profileChecked || (selected && !denied && !visibleResult && (loading || attempt > 0))));

  const scopedParentState = adminReview ? "ready" : state;
  const scopedProfiles = adminReview ? null : profiles;

  useEffect(() => {
    setResult(null);
    setDenied(false);
    setAttempt(0);
    setProfileChecked(false);
    if (adminReview && user?.id) {
      setProfileId(user.id);
      setAttempt(1);
      setProfileChecked(true);
      return;
    }
    if (scopedParentState !== "ready" || !user?.id) {
      setProfileId("");
      return;
    }
    const stored = getActiveKidsProfile(user.id);
    if (stored && !(scopedProfiles ?? []).some((profile) => profile.id === stored)) {
      clearActiveKidsProfile(user.id);
    }
    const current = (scopedProfiles ?? []).find((profile) => profile.id === stored);
    setProfileId(current?.id ?? "");
    if (current?.level_id === level) setAttempt(1);
    setProfileChecked(true);
  }, [
    levelId,
    lessonText,
    locale,
    scopedParentState,
    scopedProfiles,
    user?.id,
    level,
    adminReview,
  ]);

  // The administrator uses the same protected delivery endpoints. A parent-state
  // refresh cannot erase that scope, but focus still rechecks its server grant.
  useEffect(() => {
    if (!adminReview) return;
    const recheck = () => {
      setResult(null);
      setAttempt((value) => value + 1);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") recheck();
    };
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [adminReview]);

  // Returning to a tab rechecks the parent grant. Do not redisplay a lesson
  // from memory after that check; its own entitlement may have changed.
  useEffect(() => {
    if (adminReview || state === "ready") return;
    setResult(null);
    setDenied(false);
    setAttempt(0);
    setLoading(false);
  }, [state, adminReview]);

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
      <Navbar variant="account" />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto max-w-5xl space-y-7 px-4 py-10 md:py-16">
          <Link
            to="/kids/$levelId/contents"
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
              {openingLesson ? (
                <div role="status" className="mt-6 space-y-4" aria-label={copy.loading}>
                  <span className="sr-only">{copy.loading}</span>
                  <div
                    aria-hidden="true"
                    className="h-5 w-3/4 animate-pulse rounded-full bg-primary/10"
                  />
                  <div
                    aria-hidden="true"
                    className="aspect-video animate-pulse rounded-2xl bg-primary/10"
                  />
                </div>
              ) : (
                <p role="status" className="mt-4 text-sm text-muted-foreground">
                  {adminReview && denied
                    ? copy.unavailableLesson
                    : state === "signed-out"
                      ? copy.signInNotice
                      : state === "pending"
                        ? copy.pending
                        : state === "not-released"
                          ? copy.setupPending
                          : state === "unavailable"
                            ? copy.unavailable
                            : denied
                              ? copy.unavailableLesson
                              : !selected && profileChecked
                                ? copy.chooseProfile
                                : null}
                </p>
              )}
              {!adminReview && state === "ready" && profileChecked && (
                <div className="mt-6 max-w-sm space-y-3">
                  {activeProfile ? (
                    <div className="space-y-3">
                      <p className="text-sm font-bold">
                        {copy.activeProfile}: {activeProfile.display_name}
                      </p>
                      {activeProfile.level_id !== level && (
                        <p className="text-sm">{copy.otherLevelProfile}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (user?.id) clearActiveKidsProfile(user.id);
                          setResult(null);
                          setDenied(false);
                          setAttempt(0);
                          setProfileId("");
                        }}
                        className="min-h-11 rounded-full border border-primary px-5 text-sm font-bold text-primary"
                      >
                        {copy.exitProfile}
                      </button>
                    </div>
                  ) : availableProfiles.length > 0 ? (
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
                          if (user?.id && event.target.value)
                            setActiveKidsProfile(user.id, event.target.value);
                          if (event.target.value) setAttempt(1);
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
                    </>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm">{copy.noLevelProfile}</p>
                      <Link
                        to="/kids/family"
                        search={localeSearch()}
                        className="inline-flex min-h-11 items-center rounded-full border border-primary px-5 py-3 text-sm font-bold text-primary"
                      >
                        {copy.manageFamily}
                      </Link>
                    </div>
                  )}
                </div>
              )}
              {!adminReview && state !== "ready" && (
                <div className="mt-6">
                  <Link
                    to={state === "signed-out" ? "/login" : "/kids/family"}
                    search={
                      state === "signed-out" ? localeSearch({ intent: "kids" }) : localeSearch()
                    }
                    className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                  >
                    {state === "signed-out" ? copy.signIn : copy.manageFamily}
                  </Link>
                </div>
              )}
            </section>
          )}
          {visibleResult && !adminReview && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-card p-4">
              <span className="text-sm font-bold">
                {copy.activeProfile}: {activeProfile?.display_name}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (user?.id) clearActiveKidsProfile(user.id);
                  setResult(null);
                  setDenied(false);
                  setAttempt(0);
                  setProfileId("");
                }}
                className="min-h-11 rounded-full border border-primary px-5 text-sm font-bold text-primary"
              >
                {copy.exitProfile}
              </button>
            </div>
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
