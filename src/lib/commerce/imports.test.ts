import { describe, it, expect } from "vitest";
import { zipSync, strToU8 } from "fflate";
import {
  parseCsv,
  parseXlsx,
  previewImport,
  importTemplateXlsx,
  exportCsv,
  IMPORT_COLUMNS,
} from "./imports";
import { validateReceipt } from "./receipts";
import { invitationContent } from "../../../supabase/functions/_shared/masaarat-mail";
import { commerceCopy } from "./copy";
describe("safe import and receipt inputs", () => {
  it("reads a round-trip XLSX template and quoted CSV without evaluating formulas", () => {
    expect(parseXlsx(importTemplateXlsx()).headers).toEqual([...IMPORT_COLUMNS]);
    expect(parseCsv('email,name\r\nmember@example.test,"Name, quoted"').rows).toEqual([
      ["member@example.test", "Name, quoted"],
    ]);
    expect(() => parseCsv('email\n"unfinished')).toThrow();
  });
  it("refuses workbook formulas, entity declarations and excessive decompressed size", () => {
    for (const xml of [
      '<worksheet><row><c r="A1"><f>WEBSERVICE("x")</f></c></row></worksheet>',
      '<!DOCTYPE x [<!ENTITY x SYSTEM "file:///x">]><worksheet/>',
    ])
      expect(() => parseXlsx(zipSync({ "xl/worksheets/sheet1.xml": strToU8(xml) }))).toThrow();
    expect(() =>
      parseXlsx(zipSync({ "xl/worksheets/sheet1.xml": new Uint8Array(9_000_000) })),
    ).toThrow(/Unsafe/);
  });
  it("validates email, duplicates, package boundaries and date rules", () => {
    const defaults = {
      locale: "en" as const,
      package: "pro" as const,
      access_kind: "complimentary" as const,
      duration_days: 30,
      start_rule: "acceptance" as const,
      deadline: new Date(Date.now() + 86400000).toISOString(),
      market: "EG" as const,
      billing_interval: "month" as const,
      currency: "EGP" as const,
      method: "instapay" as const,
    };
    const rows = previewImport(
      parseCsv("email\nmember@example.test\nMEMBER@example.test\nwrong"),
      { email: 0 },
      defaults,
    );
    expect(rows[0].errors).toHaveLength(0);
    expect(rows[1].errors.join()).toMatch(/Duplicate/);
    expect(rows[2].errors.join()).toMatch(/email/);
  });
  it("neutralizes formula injection in exported cells", () => {
    const csv = exportCsv(["email"], [[' =HYPERLINK("x")'], ["\t+CMD"], ["plain@example.test"]]);
    expect(csv).toContain("' =HYPERLINK");
    expect(csv).toContain("'\t+CMD");
  });
  it("checks receipt signatures, upload bounds and allowed MIME types", () => {
    expect(() => validateReceipt(new Uint8Array(5242881), "image/png")).toThrow();
    expect(() =>
      validateReceipt(new TextEncoder().encode("<script>x</script>"), "application/pdf"),
    ).toThrow();
    expect(() =>
      validateReceipt(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"),
    ).not.toThrow();
  });
  it("uses the four existing localized branded invitation templates and escapes names", () => {
    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const) {
      const content = invitationContent({
        id: "00000000-0000-4000-8000-000000000001",
        locale,
        name: "<img onerror=x>",
        package: "pro",
        duration_days: 30,
        deadline: "2026-12-01T00:00:00Z",
        access_kind: "external",
      });
      expect(content.html).toContain("masaarat-logo-lockup.png");
      expect(content.html).toContain(locale === "en" ? 'dir="ltr"' : 'dir="rtl"');
      expect(content.html).not.toContain("<img onerror=x>");
      expect(content.html).toContain(
        `/invitations/00000000-0000-4000-8000-000000000001?locale=${locale}`,
      );
      expect(commerceCopy(locale).receiptNote).toBeTruthy();
    }
  });
});
