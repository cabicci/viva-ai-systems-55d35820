import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FurniturePilotLesson } from "./FurniturePilotLesson";
import { getPilotCopy, resolvePilotLocale } from "@/lib/furniture-pilot/content";
import { getBunnyEmbedUrlForLocale } from "@/lib/bunny-videos";
import type { SupportedLocale } from "@/lib/locale/types";

vi.mock("@/lib/bunny-videos", () => ({ getBunnyEmbedUrlForLocale: vi.fn() }));
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.mocked(getBunnyEmbedUrlForLocale).mockReset();
});
const open = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

describe("furniture pilot interaction", () => {
  it.each<SupportedLocale>(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
    "renders %s using its authored language assets with pending Bunny delivery",
    (locale) => {
      const copy = getPilotCopy(locale);
      render(<FurniturePilotLesson locale={locale} />);
      expect(screen.getByRole("main")).toHaveAttribute("dir", locale === "en" ? "ltr" : "rtl");
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy.title);
      open(copy.labels.video);
      expect(screen.getByText(copy.labels.videoPending)).toBeVisible();
      expect(document.querySelector("video, iframe")).toBeNull();
      open(copy.labels.downloads);
      expect(screen.getByRole("link", { name: copy.labels.downloadPack })).toHaveAttribute(
        "href",
        `/experiments/furniture-pilot/${resolvePilotLocale(locale)}/workbook.pdf`,
      );
      open(copy.labels.assistant);
      expect(screen.getByText(copy.labels.guideNote)).toBeVisible();
      open(copy.faq[0].question);
      expect(screen.getByRole("status")).toHaveTextContent(copy.faq[0].answer);
    },
  );

  it.each<SupportedLocale>(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
    "uses the existing Bunny player for %s",
    (locale) => {
      const url =
        "https://iframe.mediadelivery.net/embed/670679/pilot-guid?autoplay=false&preload=true";
      vi.mocked(getBunnyEmbedUrlForLocale).mockReturnValue(url);
      render(<FurniturePilotLesson locale={locale} />);
      const copy = getPilotCopy(locale);
      open(copy.labels.video);
      expect(getBunnyEmbedUrlForLocale).toHaveBeenCalledWith("furniture-m1-cut-list", locale);
      expect(screen.getByTitle(copy.labels.video)).toHaveAttribute("src", url);
      expect(screen.queryByText(copy.labels.videoPending)).toBeNull();
      expect(screen.getByText(copy.labels.videoReady)).toBeVisible();
    },
  );

  it("reports invalid geometry, then restores the sample", () => {
    render(<FurniturePilotLesson locale="en" />);
    open("Panel calculator");
    fireEvent.change(screen.getByLabelText("Outside width (mm)"), { target: { value: "36" } });
    expect(screen.getByRole("alert")).toBeVisible();
    open("Reset example");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("table")).toHaveTextContent("564");
  });

  it("keeps reading, quiz and arithmetic separate and invalidates a changed answer", () => {
    const copy = getPilotCopy("en");
    render(<FurniturePilotLesson locale="en" />);
    open("Mark explanation read");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
    open("Knowledge check");
    open("Check answers");
    expect(screen.getByRole("status")).toHaveTextContent("Answer all questions first.");
    [1, 2, 0, 1].forEach((answer, index) =>
      fireEvent.click(
        screen
          .getByRole("group", { name: `${index + 1}. ${copy.quiz[index].question}` })
          .querySelectorAll("input")[answer],
      ),
    );
    open("Check answers");
    expect(screen.getByRole("status")).toHaveTextContent("Knowledge check passed.");
    fireEvent.click(
      screen
        .getByRole("group", { name: `1. ${copy.quiz[0].question}` })
        .querySelectorAll("input")[0],
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
    open("Practice & assessment");
    fireEvent.change(screen.getByLabelText("Internal width (mm)"), { target: { value: "764" } });
    fireEvent.change(screen.getByLabelText("Body depth (mm)"), { target: { value: "344" } });
    fireEvent.change(screen.getByLabelText("Clear opening height (mm)"), {
      target: { value: "323" },
    });
    open("Check answers");
    expect(screen.getByRole("status")).toHaveTextContent("portfolio has not been reviewed");
    fireEvent.change(screen.getByLabelText("Body depth (mm)"), { target: { value: "300" } });
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
  });
});
