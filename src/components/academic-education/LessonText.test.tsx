import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { LessonText } from "./LessonText";
afterEach(cleanup);
it("renders authored bullet groups and keeps literal asterisks and HTML inert", () => {
  const { container } = render(
    <LessonText
      text={
        "**Period 1**\n* Orders: 500\n* Returns: 25\n\n**Period 2**\n* Orders: 800\n* Returns: 32\n\n**Additional information**\n* Easier returns\n* A promotional sale\n\nLiteral **** and 5 * 4; <img src=x onerror=unsafe()>"
      }
    />,
  );
  expect(container.querySelectorAll("ul")).toHaveLength(3);
  expect(container.querySelectorAll("li")).toHaveLength(6);
  expect([...container.querySelectorAll("strong")].map((e) => e.textContent)).toEqual([
    "Period 1",
    "Period 2",
    "Additional information",
  ]);
  expect(container.textContent).toContain("Literal **** and 5 * 4");
  expect(container.querySelector("img")).toBeNull();
});
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
