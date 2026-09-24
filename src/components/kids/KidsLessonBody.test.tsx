import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KidsLessonBody } from "./KidsLessonBody";

const mock = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: mock.invoke } },
}));

const lesson = {
  locale: "en" as const,
  title: "A protected lesson",
  hints: [{ question: "What next?", source: "concept" }],
};
const citation = {
  product: "kids",
  levelId: "level-2",
  lessonNumber: 2,
  locale: "en",
  sourceId: "concept",
};

beforeEach(() => vi.resetAllMocks());

describe("Kids authored hint integration", () => {
  it("uses hint-1 as a request ID, then verifies the returned source-scene citation", async () => {
    mock.invoke.mockResolvedValue({
      data: { question: "What next?", answer: "Read the concept.", citation },
      error: null,
    });
    render(
      <KidsLessonBody
        lesson={lesson}
        embedUrl="https://player.mediadelivery.net/embed/761387/123e4567-e89b-12d3-a456-426614174000"
        locale="en"
        levelId="level-2"
        lessonNumber={2}
        profileId="parent-profile"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "What next?" }));
    expect(await screen.findByText("Read the concept.")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledWith("kids-lesson-help", {
      body: {
        profileId: "parent-profile",
        levelId: "level-2",
        lessonNumber: 2,
        locale: "en",
        hintId: "hint-1",
      },
    });
  });

  it("hides an answer whose source citation does not match the authored hint", async () => {
    mock.invoke.mockResolvedValue({
      data: {
        question: "What next?",
        answer: "Wrong source",
        citation: { ...citation, sourceId: "other" },
      },
      error: null,
    });
    render(
      <KidsLessonBody
        lesson={lesson}
        embedUrl="https://player.mediadelivery.net/embed/761387/123e4567-e89b-12d3-a456-426614174000"
        locale="en"
        levelId="level-2"
        lessonNumber={2}
        profileId="parent-profile"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "What next?" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Wrong source")).not.toBeInTheDocument();
  });
});
