import { act, fireEvent, render, screen } from "@testing-library/react";
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
  it("isolates scientific units while keeping author markup inert", () => {
    const lesson = base();
    lesson.sections[0].paragraphs = [
      "راجع `mg/kg food` ثم 0.08 × 0.25 = 0.020، <img src=x onerror=alert(1)>.",
    ];
    const view = render(
      <CurriculumContent lesson={lesson} selected="intro" onSelect={vi.fn()} locale="ar-EG" />,
    );
    expect(view.container.querySelector('bdi[dir="ltr"] code')).toHaveTextContent("mg/kg food");
    expect(view.container.querySelector("img")).toBeNull();
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
  it("loads a protected illustration only in its selected section and keeps its disclosure", async () => {
    const lesson = base();
    lesson.sections[0].assets = ["image"];
    lesson.assets = [
      {
        id: "image",
        type: "image",
        label: "Teaching illustration",
        caption: "Generated illustration; not experimental evidence.",
      },
    ];
    const resolve = vi.fn(async () => "https://example.invalid/protected-image");
    const view = render(
      <CurriculumContent
        lesson={lesson}
        selected="task"
        onSelect={vi.fn()}
        locale="en"
        resolveAsset={resolve}
      />,
    );
    expect(resolve).not.toHaveBeenCalled();
    view.rerender(
      <CurriculumContent
        lesson={lesson}
        selected="intro"
        onSelect={vi.fn()}
        locale="en"
        resolveAsset={resolve}
      />,
    );
    expect(await screen.findByRole("img", { name: "Teaching illustration" })).toHaveAttribute(
      "src",
      "https://example.invalid/protected-image",
    );
    expect(screen.getByText("Generated illustration; not experimental evidence.")).toBeVisible();
  });
  it("ignores an image link that arrives after its owning lesson unmounts", async () => {
    const lesson = base();
    lesson.sections[0].assets = ["image"];
    lesson.assets = [{ id: "image", type: "image", label: "Retired image", caption: "Disclosure" }];
    let deliver!: (s: string) => void;
    const resolve = vi.fn(
      () =>
        new Promise<string>((r) => {
          deliver = r;
        }),
    );
    const view = render(
      <CurriculumContent
        lesson={lesson}
        selected="intro"
        onSelect={vi.fn()}
        locale="en"
        resolveAsset={resolve}
      />,
    );
    view.unmount();
    await act(async () => deliver("https://example.invalid/retired"));
    expect(screen.queryByRole("img", { name: "Retired image" })).toBeNull();
  });
});
