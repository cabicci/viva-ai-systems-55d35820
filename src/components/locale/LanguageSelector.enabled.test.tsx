import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { DEFAULT_LOCALE } from "@/lib/locale/types";

vi.mock("@/lib/locale/feature-flags", () => ({
  localeRuntimeEnabled: false,
  localeUiEnabled: true,
  localizedLessonsEnabled: false,
  localizedVideosEnabled: false,
  localizedRagEnabled: false,
}));

import { LanguageSelector } from "@/components/locale/LanguageSelector";

describe("LanguageSelector (localeUiEnabled)", () => {
  it("shows display names only, not internal locale codes", () => {
    render(
      <LocaleProvider>
        <LanguageSelector />
      </LocaleProvider>,
    );

    expect(screen.getByRole("combobox")).toBeTruthy();
    expect(screen.getByText("العامية المصرية")).toBeTruthy();
    expect(screen.getByText("العربية الفصحى")).toBeTruthy();
    expect(screen.getByText("خليجي")).toBeTruthy();
    expect(screen.getByText("English")).toBeTruthy();
    expect(screen.queryByText("ar-EG")).toBeNull();
    expect(screen.queryByText("ar-MSA")).toBeNull();
    expect(screen.queryByText("ar-Gulf")).toBeNull();
  });

  it("defaults to ar-EG inside LocaleProvider", () => {
    render(
      <LocaleProvider>
        <LanguageSelector />
      </LocaleProvider>,
    );

    expect(screen.getByRole("combobox")).toHaveValue(DEFAULT_LOCALE);
  });
});
