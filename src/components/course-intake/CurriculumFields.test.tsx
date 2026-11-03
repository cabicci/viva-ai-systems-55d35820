import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CurriculumFields } from "./CurriculumFields";
import { trainingFixture } from "@/lib/course-system/intake/training-fixture";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import { intakeCopy } from "@/lib/course-system/intake/copy";
const section = trainingFixture().stations[0].steps[0].content.en!.sections[2];
const values = {
  concentration: "0.08",
  mass: "0.25",
  body: "40",
  answer: "0.0005",
  unit: "intake-unit",
  identity: "verified",
  reason: "Needs review",
};
afterEach(cleanup);
it.each(SUPPORTED_LOCALES)(
  "shows local arithmetic feedback without writing or submitting in %s",
  (locale) => {
    const change = vi.fn();
    const c = intakeCopy(locale);
    const view = render(
      <CurriculumFields
        section={section}
        values={values}
        onChange={change}
        disabled={false}
        locale={locale}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: c.trainingCheck }));
    expect(screen.getByRole("status")).toHaveTextContent(c.trainingCorrect);
    expect(change).not.toHaveBeenCalled();
    view.rerender(
      <CurriculumFields
        section={section}
        values={{ ...values, answer: "0" }}
        onChange={change}
        disabled={false}
        locale={locale}
      />,
    );
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.change(screen.getByLabelText("Answer unit"), { target: { value: "food-unit" } });
    expect(change).toHaveBeenCalledWith("unit", "food-unit");
  },
);
it("does not allow editing or checking before the owned attempt opens", () => {
  const change = vi.fn();
  render(<CurriculumFields section={section} values={{}} onChange={change} disabled locale="en" />);
  expect(screen.getByLabelText("Food mass")).toBeDisabled();
  expect(screen.getByLabelText("Answer unit")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Check my calculation" })).toBeDisabled();
});
