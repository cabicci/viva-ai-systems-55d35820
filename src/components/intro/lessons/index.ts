/**
 * Registry of full Introduction lesson bodies, keyed by route slug.
 *
 * Lesson modules are loaded on demand via loadIntroLessonContent() so the
 * learn route does not pull every lesson into the initial client bundle.
 */
export {
  INTRO_LESSON_CONTENT_KEYS,
  type IntroLessonContentKey,
  hasIntroLessonContent,
  loadIntroLessonContent,
  loadIntroLessonContentCached,
  loadAllIntroLessonContent,
} from "./lesson-registry";

import {
  INTRO_LESSON_CONTENT_KEYS,
  hasIntroLessonContent,
} from "./lesson-registry";
import type { IntroLessonContent } from "../intro-lesson-types";

/**
 * Legacy registry handle — supports key enumeration and `in` checks.
 * Synchronous value reads return `undefined`; use loadIntroLessonContent().
 */
export const INTRO_LESSON_CONTENT: Record<
  string,
  IntroLessonContent | undefined
> = new Proxy(
  {} as Record<string, IntroLessonContent | undefined>,
  {
    get(_target, prop: string | symbol) {
      if (typeof prop !== "string") return undefined;
      return hasIntroLessonContent(prop) ? undefined : undefined;
    },
    has(_target, prop) {
      return typeof prop === "string" && hasIntroLessonContent(prop);
    },
    ownKeys() {
      return [...INTRO_LESSON_CONTENT_KEYS];
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (typeof prop === "string" && hasIntroLessonContent(prop)) {
        return { enumerable: true, configurable: true };
      }
      return undefined;
    },
  },
);
