import { Fragment } from "react";
import { LessonInlineText } from "@/components/academic-education/LessonText";
/** Authored inline units/arithmetic are isolated from RTL prose; HTML stays inert text. */
export function CourseInlineText({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    i % 2 ? (
      <bdi dir="ltr" key={i}>
        <code>{part.slice(1, -1)}</code>
      </bdi>
    ) : (
      <Fragment key={i}>
        <LessonInlineText text={part} />
      </Fragment>
    ),
  );
}
