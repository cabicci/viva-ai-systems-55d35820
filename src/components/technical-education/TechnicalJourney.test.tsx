import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TechnicalLessonView } from "./TechnicalJourney";
import lesson from "@/lib/technical-education/lessons/M01-L01__en.json";
import type { TechnicalLesson } from "@/lib/technical-education/types";

afterEach(() => {
  cleanup();
  localStorage.clear();
});
describe("technical lesson preview", () => {
  it("requires correct answers and a completed self-review, then restores the saved practice", () => {
    const view = render(<TechnicalLessonView lesson={lesson as TechnicalLesson} />);
    fireEvent.click(screen.getByRole("button", { name: "I have read the explanation" }));
    fireEvent.click(screen.getByRole("button", { name: "Check understanding" }));
    expect(screen.getByRole("button", { name: "Check answers" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("An open assumption with an owner"));
    fireEvent.click(
      screen.getByLabelText("The confirmed bag can be inserted and removed without a clash"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Check answers" }));
    expect(screen.getByRole("status")).toHaveTextContent("2 / 2");
    fireEvent.click(screen.getByRole("button", { name: /^Practice$/ }));
    screen
      .getAllByRole("textbox")
      .forEach((input, index) =>
        fireEvent.change(input, { target: { value: `Evidence ${index + 1}` } }),
      );
    fireEvent.click(screen.getByRole("button", { name: "Save practice" }));
    expect(
      JSON.parse(localStorage.getItem("masaarat:technical-preview:v1")!)["M01-L01"]
        .practiceReviewed,
    ).toBe(false);
    screen.getAllByRole("checkbox").forEach((input) => fireEvent.click(input));
    fireEvent.click(screen.getByRole("button", { name: "Save practice" }));
    expect(
      JSON.parse(localStorage.getItem("masaarat:technical-preview:v1")!)["M01-L01"]
        .practiceReviewed,
    ).toBe(true);
    view.unmount();
    render(<TechnicalLessonView lesson={lesson as TechnicalLesson} />);
    fireEvent.click(screen.getByRole("button", { name: /^Practice$/ }));
    expect(screen.getAllByRole("textbox")[0]).toHaveValue("Evidence 1");
    fireEvent.click(screen.getByRole("button", { name: "Downloads" }));
    expect(screen.getAllByRole("link")).toHaveLength(2);
    for (const link of screen.getAllByRole("link"))
      expect(link.getAttribute("download")).toMatch(
        / — Turn a client request into a design brief\.pdf$/,
      );
  });
});
