import type { PathId } from "@/lib/curriculum-data";
import {
  getCurriculumLessonLabel,
  getCurriculumPathLabel,
} from "@/lib/locale-curriculum/resolve-curriculum-label";
import { resolveLearnDisplayTitle } from "@/lib/locale/learn-display-title";
import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "./types";

export type LearnerRouteMetaKind = "curriculum" | "dashboard" | "learn";

export type RouteMetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

export type BuildLocalizedLearnerMetaData = {
  pathId?: PathId;
  lessonId?: string;
  packageTitle?: string;
  /** True when path id is missing or invalid for learn meta. */
  unknownPath?: boolean;
};

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function withSocialTags(title: string, description: string): RouteMetaTag[] {
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}

function resolveLearnLessonTitle(
  locale: SupportedLocale,
  lessonId: string,
  packageTitle?: string,
): string {
  const curriculumTitle = getCurriculumLessonLabel(locale, lessonId);
  return resolveLearnDisplayTitle(curriculumTitle, packageTitle ? { title: packageTitle } : null);
}

export function buildLocalizedLearnerMeta(
  locale: SupportedLocale,
  kind: LearnerRouteMetaKind,
  data: BuildLocalizedLearnerMetaData = {},
): { meta: RouteMetaTag[] } {
  const brandSuffix = getUiString(locale, "meta.brandSuffix");

  if (kind === "curriculum") {
    const title = getUiString(locale, "meta.curriculum.title");
    const description = getUiString(locale, "meta.curriculum.description");
    return { meta: withSocialTags(title, description) };
  }

  if (kind === "dashboard") {
    const title = getUiString(locale, "meta.dashboard.title");
    const description = getUiString(locale, "meta.dashboard.description");
    return { meta: withSocialTags(title, description) };
  }

  if (data.unknownPath || !data.pathId) {
    const title = getUiString(locale, "meta.learn.titleUnknown");
    const description = interpolate(
      getUiString(locale, "meta.learn.descriptionPathOnly"),
      { pathTitle: title, brandSuffix },
    );
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  }

  const pathTitle = getCurriculumPathLabel(locale, data.pathId, "title");

  if (!data.lessonId) {
    const title = interpolate(getUiString(locale, "meta.learn.titlePathOnly"), {
      pathTitle,
      brandSuffix,
    });
    const description = interpolate(
      getUiString(locale, "meta.learn.descriptionPathOnly"),
      { pathTitle, brandSuffix },
    );
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  }

  const lessonTitle = resolveLearnLessonTitle(
    locale,
    data.lessonId,
    data.packageTitle,
  );
  const title = interpolate(getUiString(locale, "meta.learn.titleWithLesson"), {
    lessonTitle,
    pathTitle,
    brandSuffix,
  });
  const description = interpolate(
    getUiString(locale, "meta.learn.descriptionWithLesson"),
    { lessonTitle, pathTitle, brandSuffix },
  );

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  };
}
