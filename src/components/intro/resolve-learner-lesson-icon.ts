import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CircleCheck,
  Compass,
  Rocket,
  Route,
  Sparkles,
} from "lucide-react";
import type { IntroBlock } from "./intro-lesson-types";

/** Map legacy generic icons to calm journey/learning glyphs at render time. */
export function resolveLearnerLessonIcon(
  icon: LucideIcon,
  blockKind: IntroBlock["kind"],
): LucideIcon {
  if (blockKind === "concepts") return BookOpen;
  if (icon === Sparkles) return Compass;
  if (icon === Rocket) {
    if (blockKind === "quiz") return CircleCheck;
    if (blockKind === "mission") return Route;
    return Route;
  }
  return icon;
}
