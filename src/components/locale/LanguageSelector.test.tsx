import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/locale/feature-flags", () => ({
  localeRuntimeEnabled: false,
  localeUiEnabled: false,
  localizedLessonsEnabled: false,
  localizedVideosEnabled: false,
  localizedRagEnabled: false,
}));

import { LanguageSelector } from "@/components/locale/LanguageSelector";

describe("LanguageSelector", () => {
  it("does not render when localeUiEnabled is false", () => {
    const { container } = render(<LanguageSelector />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
