import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/lib/locale/locale-context";
import { DEFAULT_LOCALE } from "@/lib/locale/types";

function LocaleProbe() {
  const { locale, lang, dir, displayName } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="lang">{lang}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="displayName">{displayName}</span>
    </div>
  );
}

describe("LocaleProvider", () => {
  it("defaults to ar-EG", () => {
    render(
      <LocaleProvider initialLocale={DEFAULT_LOCALE} effectiveLocale={DEFAULT_LOCALE}>
        <LocaleProbe />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("locale").textContent).toBe(DEFAULT_LOCALE);
    expect(screen.getByTestId("lang").textContent).toBe("ar");
    expect(screen.getByTestId("dir").textContent).toBe("rtl");
    expect(screen.getByTestId("displayName").textContent).toBe("مصري");
  });
});
