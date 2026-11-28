import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PictureGalleryLab } from "./PictureGalleryLab";
import type { LessonContent } from "./CurriculumContent";

const subjects = ["boat", "desk", "bag"];
const lesson: LessonContent = {
  id: "KAI-02-L05",
  title: "Gallery",
  sections: [],
  assets: subjects.flatMap((subject) => [
    { id: subject === "boat" ? "picture" : "figure-" + subject, label: subject, type: "image" },
    ...[1, 2].map((i) => ({
      id: subject + "-phrase-" + i,
      label: subject + " phrase " + i,
      type: "file",
    })),
  ]),
};
const values = Object.fromEntries(
  subjects.flatMap((s) => [
    [s + "-line-1", "p2"],
    [s + "-line-2", "p1"],
    [s + "-basis", "<b>my " + s + " evidence</b>"],
  ]),
);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("gallery from the child's own activity choices", () => {
  it("requires distinct phrases for all three cards before fetching private assets", () => {
    const resolve = vi.fn();
    render(
      <PictureGalleryLab
        locale="en"
        lesson={lesson}
        values={{ ...values, "desk-line-2": "p2" }}
        resolveAsset={resolve}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Prepare and listen" }));
    expect(screen.getByRole("status")).toHaveTextContent("two different sentences");
    expect(resolve).not.toHaveBeenCalled();
  });
  it("assembles the selected phrases in order and exports independent media for three cards", async () => {
    class Decoder {
      async decodeAudioData() {
        return { length: 2, getChannelData: () => new Float32Array([0.3, -0.2]) };
      }
    }
    vi.stubGlobal("OfflineAudioContext", Decoder);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        ok: true,
        blob: async () => {
          const b = new Blob(["fixture"], {
            type: url.includes("phrase") ? "audio/wav" : "image/jpeg",
          });
          Object.defineProperty(b, "arrayBuffer", { value: async () => new ArrayBuffer(2) });
          return b;
        },
      })),
    );
    let exported: Blob | undefined;
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL(b: Blob) {
          exported = b;
          return "blob:gallery";
        }
        static revokeObjectURL() {}
      },
    );
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const view = render(
      <PictureGalleryLab
        locale="en"
        lesson={lesson}
        values={values}
        resolveAsset={async (id) => "https://media.example/" + id + "?expires=test"}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Prepare and listen" }));
    const download = await screen.findByRole("button", { name: "Download my gallery" });
    expect(download).toBeDisabled();
    for (const s of subjects) {
      expect(screen.getByText(s + " phrase 2 " + s + " phrase 1")).toBeVisible();
      fireEvent.ended(screen.getByLabelText(s));
    }
    fireEvent.click(download);
    const html = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(exported!);
    });
    const opened = new DOMParser().parseFromString(html, "text/html");
    expect(
      opened.querySelectorAll('article audio[controls][src^="data:audio/wav;base64,"]'),
    ).toHaveLength(3);
    expect(opened.querySelectorAll('article img[src^="data:image/jpeg;base64,"]')).toHaveLength(3);
    expect(opened.querySelector("b,script")).toBeNull();
    expect(html).not.toContain("expires=test");
    expect(opened.body.textContent).toContain("<b>my boat evidence</b>");
    view.rerender(
      <PictureGalleryLab
        locale="en"
        lesson={lesson}
        values={{ ...values, "boat-line-1": "p1" }}
        resolveAsset={async (id) => id}
      />,
    );
    expect(screen.queryByRole("button", { name: "Download my gallery" })).toBeNull();
  });
});
