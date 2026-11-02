import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CurriculumContent, type LessonContent } from "./CurriculumContent";
import { validateIntake } from "@/lib/course-system/intake/package";
import { intakeFixture } from "@/lib/course-system/intake/test-fixture";
describe("new-course lesson delivery", () => {
  const base = () => {
    const p = validateIntake(intakeFixture());
    const s = p.stations[0].steps[0];
    return { id: s.id, title: s.title.en!, ...s.content.en! } as LessonContent;
  };
  it("does not mount video or expose a signed private link while reading", () => {
    const lesson = base();
    const source = lesson.sections[0];
    lesson.sections.push({
      ...source,
      id: "video",
      kind: "video",
      assets: ["v"],
      completion: "view",
    });
    lesson.assets.push({
      id: "v",
      type: "video",
      label: "Reviewed video",
      url: "https://media.b-cdn.net/video.mp4",
    });
    const { container, rerender } = render(
      <CurriculumContent lesson={lesson} locale="en" selected="intro" onSelect={vi.fn()} />,
    );
    expect(container.querySelector("video")).toBeNull();
    rerender(<CurriculumContent lesson={lesson} locale="en" selected="video" onSelect={vi.fn()} />);
    expect(container.querySelector("video")).toHaveAttribute("preload", "none");
  });
  it("resolves a private download only after an explicit click", async () => {
    const lesson = base();
    lesson.sections = [
      {
        ...lesson.sections[0],
        id: "files",
        kind: "downloads",
        assets: ["pdf"],
        completion: "view",
      },
    ];
    lesson.assets = [{ id: "pdf", type: "pdf", label: "Practice sheet" }];
    const resolve = vi.fn(async () => "https://example.invalid/short-lived-approved-file");
    render(
      <CurriculumContent
        lesson={lesson}
        locale="en"
        selected="files"
        onSelect={vi.fn()}
        resolveAsset={resolve}
      />,
    );
    expect(resolve).not.toHaveBeenCalled();
    expect(screen.queryByRole("link")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Practice sheet" }));
    expect(await screen.findByRole("link", { name: "Practice sheet" })).toHaveAttribute(
      "href",
      "https://example.invalid/short-lived-approved-file",
    );
    expect(resolve).toHaveBeenCalledExactlyOnceWith("pdf");
  });
  it("renders imported text as text and never executes author markup", () => {
    const lesson = base();
    lesson.sections[0].paragraphs = ["<script>alert('x')</script>"];
    const { container } = render(
      <CurriculumContent lesson={lesson} locale="en" selected="intro" onSelect={vi.fn()} />,
    );
    expect(screen.getByText("<script>alert('x')</script>")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
  });
});
