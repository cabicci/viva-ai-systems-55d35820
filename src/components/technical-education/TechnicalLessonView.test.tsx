import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import { TechnicalLessonView } from "./TechnicalJourney";
import { FurniturePilotLesson } from "../furniture-pilot/FurniturePilotLesson";
import { getPilotCopy } from "../../../scripts/technical-education/source/furniture-pilot/content";
import { getTechnicalCopy } from "@/lib/technical-education/copy";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import type { TechnicalLesson } from "@/lib/technical-education/types";
const { rpc, download, update } = vi.hoisted(() => ({
  rpc: vi.fn(),
  download: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/technical-education/client", () => ({
  useTechnicalProgress: () => ({ progress: {}, update }),
  technicalCompleted: () => 0,
  technicalCommand: rpc,
  technicalDownload: download,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it.each(SUPPORTED_LOCALES)(
  "grades using server feedback and downloads protected PDFs in %s",
  async (locale) => {
    const c = getTechnicalCopy(locale);
    const lesson: TechnicalLesson = {
      id: "M01-L01",
      locale,
      title: "Synthetic lesson",
      intro: "Synthetic",
      goals: [],
      sections: [],
      example: { title: "Example", text: "Example", decision: "Review" },
      quiz: [{ id: "q1", question: "Choose one", options: ["A", "B"] }],
      assignment: { prompt: "Draft", fields: ["Notes"], criteria: ["One", "Two", "Three"] },
      faq: [],
    };
    rpc.mockResolvedValue({
      allowed: true,
      score: 1,
      total: 1,
      passed: true,
      feedback: [{ id: "q1", correct: true, explanation: "Server feedback" }],
    });
    update.mockResolvedValue({ allowed: true });
    download.mockResolvedValue(undefined);
    render(
      <TechnicalLessonView
        lesson={lesson}
        video={`https://iframe.mediadelivery.net/embed/670679/${locale}`}
        files={[
          { kind: "workbook", path: `M01-L01/${locale}/workbook.pdf` },
          { kind: "worksheet", path: `M01-L01/${locale}/worksheet.pdf` },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: c.video }));
    expect(screen.getByTitle(lesson.title)).toHaveAttribute("src", expect.stringContaining(locale));
    fireEvent.click(screen.getByRole("button", { name: c.quiz }));
    fireEvent.click(screen.getByLabelText("A"));
    fireEvent.click(screen.getByRole("button", { name: c.check }));
    expect(await screen.findByText("Server feedback", { exact: false })).toHaveTextContent(
      c.correct,
    );
    expect(rpc).toHaveBeenCalledWith("quiz", "M01-L01", locale, { answers: { q1: 0 } });
    fireEvent.click(screen.getByRole("button", { name: c.downloads }));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(c.workbook) }));
    expect(download).toHaveBeenCalledWith(
      `M01-L01/${locale}/workbook.pdf`,
      expect.stringContaining(".pdf"),
    );
  },
);
it.each(SUPPORTED_LOCALES)("preserves furniture geometry and private downloads in %s", (locale) => {
  const copy = getPilotCopy(locale);
  render(
    <FurniturePilotLesson
      locale={locale}
      copy={copy}
      video="https://iframe.mediadelivery.net/embed/670679/synthetic"
      files={[{ kind: "workbook", path: `M04-L02/${locale}/workbook.pdf` }]}
    />,
  );
  expect(screen.getByRole("heading", { level: 1, name: copy.title })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: copy.labels.calculator }));
  expect(screen.getAllByText("564").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: copy.labels.downloads }));
  const link = screen.getByRole("link", { name: copy.labels.downloadPack });
  fireEvent.click(link);
  expect(download).toHaveBeenCalledWith(
    `M04-L02/${locale}/workbook.pdf`,
    expect.stringContaining(".pdf"),
  );
});
