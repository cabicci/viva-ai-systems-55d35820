import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import { LanternMarketTable } from "./LanternMarketTable";
import { tableCopy } from "./lantern-market-copy";

describe("Lantern Market scoring table", () => {
  it.each(SUPPORTED_LOCALES)(
    "hides the first bid, corrects awards and finishes four rounds in %s",
    (locale) => {
      const view = render(<LanternMarketTable locale={locale} />);
      const t = tableCopy[locale];
      const table = within(view.getByTestId("lantern-market-table"));
      fireEvent.click(table.getByText(t.title));
      for (const [i, [a, b]] of [
        [1, 1],
        [4, 3],
        [2, 4],
        [3, 2],
      ].entries()) {
        fireEvent.click(table.getByRole("button", { name: String(a) }));
        expect(table.getByTestId("market-status")).toHaveTextContent(t.pass);
        expect(table.getAllByRole("button")).toHaveLength(1);
        fireEvent.click(table.getByRole("button", { name: t.ready }));
        expect(table.getAllByRole("button")).toHaveLength(4 - i);
        fireEvent.click(table.getByRole("button", { name: String(b) }));
        const inputs = table.getAllByRole("spinbutton");
        inputs.forEach((input) => fireEvent.change(input, { target: { value: "4" } }));
        fireEvent.click(table.getByRole("button", { name: t.submit }));
        expect(table.getByRole("alert")).toHaveTextContent(a === b ? t.tie : t.tryAgain);
        [a > b ? i + 1 : 0, b > a ? i + 1 : 0].forEach((score, index) =>
          fireEvent.change(inputs[index], { target: { value: String(score) } }),
        );
        fireEvent.click(table.getByRole("button", { name: t.submit }));
        expect(table.getAllByRole("row")).toHaveLength(i + 2);
      }
      expect(table.getByTestId("market-status")).toHaveTextContent(t.winner + " A");
      expect(table.getByText("A 6 · B 3")).toBeTruthy();
      fireEvent.click(table.getByRole("button", { name: t.reset }));
      expect(table.queryByRole("table")).toBeNull();
    },
  );
});
