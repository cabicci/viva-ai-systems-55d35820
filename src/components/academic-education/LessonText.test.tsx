import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { LessonText } from "./LessonText";
afterEach(cleanup);
it("keeps subtraction and negative results in arithmetic order inside Arabic prose", () => {
  const { container } = render(
    <div dir="rtl">
      <LessonText text="الرصيد: 500 + 1800 - 2700 = -400 وحدة. والنسبة 4 ÷ 40 × 100 = 10%." />
    </div>,
  );
  const expressions = [...container.querySelectorAll('bdi[dir="ltr"]')];
  expect(expressions.map((x) => x.textContent)).toEqual([
    "500 + 1800 - 2700 = -400",
    "4 ÷ 40 × 100 = 10%",
  ]);
});
it("renders emphasis while keeping embedded HTML and links inert", () => {
  const { container } = render(
    <LessonText text={"**خطوة الحل** <script>alert(1)</script> [link](https://example.test)"} />,
  );
  expect(container.querySelector("strong")?.textContent).toBe("خطوة الحل");
  expect(container.querySelector("script, a")).toBeNull();
  expect(container.textContent).toContain("<script>alert(1)</script>");
});
