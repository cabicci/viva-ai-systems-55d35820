import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { ToolsVendorReferences } from "./ToolsVendorReferences";
afterEach(cleanup);
describe("official tool references", () => {
  for (const locale of ["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const) {
    it(
      locale +
        " provides exact official license, plan and unit links with new-tab notices",
      () => {
        render(
          <LocaleProvider initialLocale={locale}>
            <ToolsVendorReferences lessonId="automator-m3-l1-tools-landscape" />
          </LocaleProvider>,
        );
        const links = screen.getAllByRole("link");
        expect(links.map((link) => link.getAttribute("href"))).toEqual([
          "https://github.com/n8n-io/n8n-docs/blob/main/docs/n8n-community-license/README.md",
          "https://zapier.com/pricing",
          "https://www.make.com/pricing",
          "https://zapier.com/pricing/rates",
          "https://help.make.com/credits",
        ]);
        for (const link of links) {
          expect(link.getAttribute("target")).toBe("_blank");
          expect(link.getAttribute("rel")).toContain("noopener");
          expect(link.textContent).toContain(
            locale === "en"
              ? "opens in a new tab"
              : "يفتح في علامة تبويب جديدة",
          );
        }
        expect(screen.getByRole("complementary")).toBeTruthy();
      },
    );
  }
  it("does not add tool references to unrelated lessons", () => {
    const view = render(
      <LocaleProvider initialLocale="en">
        <ToolsVendorReferences lessonId="intro-m1-l1-what-is-ai" />
      </LocaleProvider>,
    );
    expect(view.container.childElementCount).toBe(0);
  });
});
