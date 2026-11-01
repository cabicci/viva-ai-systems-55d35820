import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { KidsLessonBody, type KidsBodyActionContext } from "@/components/kids/KidsLessonBody";
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

type LessonScope = {
  generation: ReturnType<typeof useAuth>["authGeneration"];
  actorId: string | undefined;
  authLoading: boolean;
  kind: "administrator_preview" | "kids_profile";
  level: KidsLevelId;
  lessonNumber: number;
  locale: ReturnType<typeof useLocale>["locale"];
};
type LessonOwner = {
  scope: LessonScope;
  life: object;
  parent: ReturnType<typeof useKidsParentState>;
  active: boolean;
  selection: LessonSelection | null;
};
type LessonSelection = {
  owner: LessonOwner;
  profileId: string;
  active: boolean;
  request: LessonRequest | null;
};
type LessonRequest = {
  selection: LessonSelection;
  id: number;
  bodyContext: KidsBodyActionContext | null;
  active: boolean;
  stop: () => void;
};
type LessonView = {
  selection: LessonSelection;
  request: LessonRequest | null;
  result: { lesson: KidsLesson; embedUrl: string } | null;
  denied: boolean;
  loading: boolean;
};

export function KidsLessonPage() {
  const { levelId, lessonNumber: lessonText } = Route.useParams();
  const level = levelId as KidsLevelId;
  const lessonNumber = Number(lessonText);
  const { locale, dir } = useLocale();
  const localeSearch = useLocaleLinkSearch();
  const copy = getKidsJourneyCopy(locale);
  const parent = useKidsParentState();
  const { user, loading: authLoading, authGeneration, isAuthGenerationCurrent } = useAuth();
  const { isAdmin, freeTargets = [] } = useEntitlement();
  const hadFreeWindow = useRef(false);
  const adminReview = !!user?.id && isAdmin;
  const scope = useMemo<LessonScope>(() => ({
    generation: authGeneration, actorId: user?.id, authLoading,
    kind: adminReview ? "administrator_preview" : "kids_profile",
    level, lessonNumber, locale,
  }), [authGeneration, user?.id, authLoading, adminReview, levelId, lessonText, locale]);
  // A new local route incarnation also records A -> B -> A. It is not a grant.
  const latestScope = useRef(scope);
  latestScope.current = scope;
  const life = useRef<object | null>(null);
  const owner = useRef<LessonOwner | null>(null);
  const sequence = useRef(0);
  const [view, setView] = useState<LessonView | null>(null);

  const scopeCurrent = (captured: LessonScope) =>
    latestScope.current === captured && isAuthGenerationCurrent(captured.generation);
  const baseCurrent = (captured: LessonOwner) =>
    captured.active && owner.current === captured && life.current === captured.life &&
    !!captured.scope.actorId && !captured.scope.authLoading && scopeCurrent(captured.scope);
  const readParent = (
    api: ReturnType<typeof useKidsParentState>, current: () => boolean,
  ): { state: ReturnType<typeof useKidsParentState>["state"]; profiles: ReturnType<typeof useKidsParentState>["profiles"] } => {
    try {
      if (!current()) return { state: "checking", profiles: [] };
      const state = api.state;
      if (!current()) return { state: "checking", profiles: [] };
      if (state !== "ready") return { state, profiles: [] };
      const profiles = api.profiles;
      if (!current()) return { state: "checking", profiles: [] };
      const stillReady = api.state === "ready";
      if (!current() || !stillReady) return { state: "checking", profiles: [] };
      return Array.isArray(profiles)
        ? { state, profiles }
        : { state: "unavailable", profiles: [] };
    } catch {
      return { state: current() ? "unavailable" : "checking", profiles: [] };
    }
  };
  const ownerCurrent = (captured: LessonOwner) => {
    if (!baseCurrent(captured)) return false;
    if (captured.scope.kind === "administrator_preview") return true;
    const evidence = readParent(captured.parent, () => baseCurrent(captured));
    return evidence.state === "ready" && baseCurrent(captured);
  };
  const selectionCurrent = (captured: LessonSelection) => {
    const owned = () => captured.active && captured.owner.selection === captured &&
      ownerCurrent(captured.owner);
    if (!owned()) return false;
    if (captured.owner.scope.kind === "administrator_preview")
      return captured.profileId === captured.owner.scope.actorId && owned();
    if (!captured.profileId) return owned();
    const evidence = readParent(captured.owner.parent, () => baseCurrent(captured.owner));
    const found = evidence.state === "ready" &&
      evidence.profiles.some((profile) => profile.id === captured.profileId);
    return found && owned();
  };
  const requestCurrent = (captured: LessonRequest) => {
    const selected = captured.selection;
    if (!captured.active || selected.request !== captured || !selectionCurrent(selected)) return false;
    if (selected.owner.scope.kind === "kids_profile") {
      const evidence = readParent(selected.owner.parent, () => baseCurrent(selected.owner));
      const matches = evidence.state === "ready" && evidence.profiles.some((profile) =>
        profile.id === selected.profileId && profile.level_id === selected.owner.scope.level);
      if (!matches || !selectionCurrent(selected)) return false;
    }
    return captured.active && selected.request === captured && baseCurrent(selected.owner);
  };
  const viewCurrent = (captured: LessonView | null): captured is LessonView =>
    !!captured && selectionCurrent(captured.selection) &&
    captured.selection.request === captured.request &&
    (!captured.request || requestCurrent(captured.request));
  const publish = (next: LessonView) => {
    if (viewCurrent(next)) setView(next);
  };
  const retireRequest = (captured: LessonRequest | null) => {
    if (!captured) return;
    captured.active = false;
    const stop = captured.stop;
    captured.stop = () => {};
    stop(); // Remove only this request's own listeners.
  };
  const retireSelection = (captured: LessonSelection | null) => {
    if (!captured) return;
    captured.active = false;
    retireRequest(captured.request);
  };
  const retireOwner = (captured: LessonOwner | null) => {
    if (!captured) return;
    captured.active = false;
    if (owner.current === captured) owner.current = null;
    retireSelection(captured.selection);
  };
  const replaceSelection = (captured: LessonOwner, profileId: string) => {
    if (!ownerCurrent(captured)) return null;
    retireSelection(captured.selection);
    if (!ownerCurrent(captured)) return null;
    const next: LessonSelection = { owner: captured, profileId, active: true, request: null };
    captured.selection = next;
    return next;
  };
  const idle = (selection: LessonSelection) =>
    publish({ selection, request: null, result: null, denied: false, loading: false });

  const startRequest = (selection: LessonSelection) => {
    if (!selection.profileId || !selectionCurrent(selection)) return;
    retireRequest(selection.request);
    if (!selectionCurrent(selection)) return;
    const ticket: LessonRequest = {
      selection, id: ++sequence.current, bodyContext: null, active: true, stop: () => {},
    };
    selection.request = ticket;
    ticket.bodyContext = Object.freeze({
      incarnation: ticket, kind: selection.owner.scope.kind,
      isCurrent: () => requestCurrent(ticket),
    });
    if (!requestCurrent(ticket)) return;
    let result: LessonView["result"] = null;
    let denied = false;
    let loading = true;
    const commit = () => publish({ selection, request: ticket, result, denied, loading });
    commit();
    // Preview ignores unrelated parent refresh but retains its protected focus recheck.
    if (selection.owner.scope.kind === "administrator_preview") {
      const recheck = () => { if (requestCurrent(ticket)) startRequest(selection); };
      const onVisible = () => {
        if (!requestCurrent(ticket)) return;
        const visible = document.visibilityState === "visible";
        if (requestCurrent(ticket) && visible) recheck();
      };
      ticket.stop = () => {
        window.removeEventListener("focus", recheck);
        document.removeEventListener("visibilitychange", onVisible);
      };
      if (!requestCurrent(ticket)) return;
      window.addEventListener("focus", recheck);
      if (!requestCurrent(ticket)) return;
      document.addEventListener("visibilitychange", onVisible);
    }
    const captured = selection.owner.scope;
    const body = Object.freeze({
      profileId: selection.profileId, levelId: captured.level,
      lessonNumber: captured.lessonNumber, locale: captured.locale,
    });
    const dispatch = (name: "kids-lesson-content" | "kids-playback") => {
      if (!requestCurrent(ticket)) return null;
      const functions = supabase.functions;
      if (!requestCurrent(ticket)) return null;
      const invoke = functions.invoke;
      if (!requestCurrent(ticket)) return null;
      // Functions.invoke starts eagerly. Observe even a retired first call's rejection.
      const pending = Reflect.apply(invoke, functions, [name, { body }]);
      const observed = Promise.resolve<{ data: unknown; error: unknown }>(pending);
      // The sink handles abandoned calls; returning the same rejecting Promise
      // preserves Promise.all's original fail-fast boundary.
      void observed.then(() => undefined, () => undefined);
      return observed;
    };
    (async () => {
      const lessonPending = dispatch("kids-lesson-content");
      if (!lessonPending || !requestCurrent(ticket)) return;
      const playbackPending = dispatch("kids-playback");
      if (!playbackPending || !requestCurrent(ticket)) return;
      const [lessonResponse, playbackResponse] = await Promise.all([lessonPending, playbackPending]);
      if (!requestCurrent(ticket)) return;
      const lessonError = lessonResponse.error;
      if (!requestCurrent(ticket)) return;
      const playbackError = playbackResponse.error;
      if (!requestCurrent(ticket)) return;
      if (lessonError || playbackError) {
        denied = true;
        commit();
        return;
      }
      const lessonData = lessonResponse.data;
      if (!requestCurrent(ticket)) return;
      const parseLesson = parseProtectedLesson;
      if (!requestCurrent(ticket)) return;
      const lesson = parseLesson(lessonData, captured.level, captured.lessonNumber, captured.locale);
      if (!requestCurrent(ticket)) return;
      const playbackData = playbackResponse.data;
      if (!requestCurrent(ticket)) return;
      const parsePlayback = parseProtectedPlayback;
      if (!requestCurrent(ticket)) return;
      const embedUrl = parsePlayback(playbackData);
      if (!requestCurrent(ticket)) return;
      if (!lesson || !embedUrl) denied = true;
      else result = { lesson, embedUrl };
      commit();
    })().catch(() => {
      if (!requestCurrent(ticket)) return;
      denied = true;
      commit();
    }).finally(() => {
      if (!requestCurrent(ticket)) return;
      loading = false;
      commit();
    });
  };

  const exitProfile = (captured: LessonView | null) => {
    if (!viewCurrent(captured) || captured.selection.owner.scope.kind !== "kids_profile") return;
    const next = replaceSelection(captured.selection.owner, "");
    if (!next || !selectionCurrent(next)) return;
    const clear = clearActiveKidsProfile;
    if (!selectionCurrent(next)) return;
    try { clear(next.owner.scope.actorId!); } catch { /* Current page can still exit. */ }
    if (selectionCurrent(next)) idle(next);
  };
  const chooseProfile = (captured: LessonView | null, value: string) => {
    if (!viewCurrent(captured) || captured.selection.profileId ||
      captured.selection.owner.scope.kind !== "kids_profile" || !value) return;
    const evidence = readParent(captured.selection.owner.parent,
      () => baseCurrent(captured.selection.owner));
    const valid = evidence.state === "ready" && evidence.profiles.some((profile) =>
      profile.id === value && profile.level_id === captured.selection.owner.scope.level);
    if (!valid || !viewCurrent(captured)) return;
    const next = replaceSelection(captured.selection.owner, value);
    if (!next || !selectionCurrent(next)) return;
    const save = setActiveKidsProfile;
    if (!selectionCurrent(next)) return;
    try { save(next.owner.scope.actorId!, value); } catch { /* Preference is best effort. */ }
    if (selectionCurrent(next)) startRequest(next);
  };

  useEffect(() => {
    const mounted = {};
    life.current = mounted;
    return () => {
      if (life.current !== mounted) return;
      life.current = null;
      retireOwner(owner.current);
    };
  }, []);

  // Reconcile live evidence after each commit. API object identity is not permission:
  // a still-current captured API survives a cosmetic rerender; a retired getter does not.
  useEffect(() => {
    const existing = owner.current;
    if (existing?.selection && selectionCurrent(existing.selection)) return;
    retireOwner(existing);
    if (!life.current || !scopeCurrent(scope) || !scope.actorId || scope.authLoading) {
      if (view) setView(null);
      return;
    }
    if (scope.kind === "kids_profile" &&
      readParent(parent, () => scopeCurrent(scope)).state !== "ready") {
      if (view) setView(null);
      return;
    }
    const next: LessonOwner = { scope, life: life.current, parent, active: true, selection: null };
    owner.current = next;
    const seed = replaceSelection(next, scope.kind === "administrator_preview" ? scope.actorId : "");
    if (!seed || !selectionCurrent(seed)) return;
    if (scope.kind === "administrator_preview") {
      startRequest(seed);
      return;
    }
    const get = getActiveKidsProfile;
    if (!selectionCurrent(seed)) return;
    let stored: string | null = null;
    try { stored = get(scope.actorId); } catch { /* No preference is also usable. */ }
    if (!selectionCurrent(seed)) return;
    const evidence = readParent(parent, () => baseCurrent(next));
    const restored = evidence.profiles.find((profile) => profile.id === stored);
    if (!selectionCurrent(seed)) return;
    if (stored && !restored) {
      const clear = clearActiveKidsProfile;
      if (!selectionCurrent(seed)) return;
      try { clear(scope.actorId); } catch { /* Preference cleanup is best effort. */ }
      if (!selectionCurrent(seed)) return;
    }
    if (!restored) {
      idle(seed);
      return;
    }
    const selected = replaceSelection(next, restored.id);
    if (!selected || !selectionCurrent(selected)) return;
    idle(selected);
    if (restored.level_id === scope.level && selectionCurrent(selected)) startRequest(selected);
  });

  const evidence = adminReview
    ? { state: "ready" as const, profiles: [] }
    : readParent(parent, () => scopeCurrent(scope) && !authLoading);
  const state = evidence.state;
  const profiles = evidence.profiles;
  const availableProfiles = profiles.filter((profile) => profile.level_id === level);
  const renderedView = viewCurrent(view) ? view : null;
  const windowActive = freeTargets.includes("kids");
  const campaignRequest = renderedView?.request;
  useEffect(() => {
    const recheckWindow = windowActive || hadFreeWindow.current;
    hadFreeWindow.current = windowActive;
    const ticket = campaignRequest;
    if (!recheckWindow || !ticket || ticket.selection.owner.scope.kind !== "kids_profile") return;
    let cancelled = false;
    const current = () => !cancelled && requestCurrent(ticket);
    const revokeCampaignDelivery = () => {
      if (!current()) return;
      const selection = ticket.selection;
      retireRequest(ticket);
      selection.request = null;
      publish({ selection, request: null, result: null, denied: true, loading: false });
    };
    const check = async () => {
      if (!current()) return;
      const captured = ticket.selection.owner.scope;
      try {
        const response = await supabase.rpc("kids_can_access_lesson" as never, {
          requested_profile: ticket.selection.profileId,
          requested_level: captured.level,
          requested_lesson: captured.lessonNumber,
          requested_locale: captured.locale,
        } as never);
        if (current() && (response.error || response.data !== true)) revokeCampaignDelivery();
      } catch {
        if (current()) revokeCampaignDelivery();
      }
    };
    void check();
    const timer = windowActive ? setInterval(() => void check(), 30_000) : undefined;
    return () => { cancelled = true; clearInterval(timer); };
  }, [windowActive, campaignRequest]);
  const profileChecked = !!renderedView;
  const profileId = renderedView?.selection.profileId ?? "";
  const activeProfile = state === "ready"
    ? profiles.find((profile) => profile.id === profileId) : null;
  const selected = !!profileId && (
    (adminReview && profileId === user?.id) ||
    (state === "ready" && availableProfiles.some((profile) => profile.id === profileId))
  );
  const denied = renderedView?.denied ?? false;
  const visibleResult = selected && renderedView?.result && renderedView.request &&
    requestCurrent(renderedView.request) ? renderedView.result : null;
  const lessonKey = renderedView?.request?.id ?? 0;
  const openingLesson = (!adminReview && state === "checking") ||
    ((adminReview || state === "ready") &&
      (!profileChecked || (selected && !denied && !visibleResult)));


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
              actionContext={renderedView!.request!.bodyContext!}
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
                        onClick={() => exitProfile(renderedView)}
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
                          if (!viewCurrent(renderedView)) return;
                          const value = event.target.value;
                          chooseProfile(renderedView, value);
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
                onClick={() => exitProfile(renderedView)}
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
                  {copy.previous}
                </Link>
              )}
              {lessonNumber < 12 && (
                <Link
                  to="/kids/$levelId/$lessonNumber"
                  params={{ levelId, lessonNumber: String(lessonNumber + 1) }}
                  search={localeSearch()}
                  className="rounded-full border border-primary px-5 py-3 text-sm font-bold text-primary"
                >
                  {copy.next}
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
