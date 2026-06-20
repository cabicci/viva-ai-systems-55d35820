import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageSelector } from "@/components/locale/LanguageSelector";

describe("LanguageSelector", () => {
  it("does not render when localeUiEnabled is false", () => {
    const { container } = render(<LanguageSelector />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
