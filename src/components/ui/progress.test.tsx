import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Progress } from "./progress";
afterEach(cleanup);
it.each([0, 33, 100])("announces determinate %s percent with its name", (value) => {
  const { container } = render(<Progress value={value} aria-label="Lesson progress" />);
  const bar = screen.getByRole("progressbar", { name: "Lesson progress" });
  expect(bar).toHaveAttribute("aria-valuenow", String(value));
  expect(bar).toHaveAttribute("aria-valuemax", "100");
  expect(bar).toHaveAttribute("data-state", value === 100 ? "complete" : "loading");
  expect(container.querySelector('[style*="translateX"]')).toHaveStyle({
    transform: `translateX(-${100 - value}%)`,
  });
});
it("keeps genuinely unknown progress indeterminate", () => {
  render(<Progress aria-label="Loading activity" />);
  const bar = screen.getByRole("progressbar", { name: "Loading activity" });
  expect(bar).not.toHaveAttribute("aria-valuenow");
  expect(bar).toHaveAttribute("data-state", "indeterminate");
});
