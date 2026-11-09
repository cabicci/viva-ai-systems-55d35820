import { describe, expect, it, vi } from "vitest";
import {
  prepareInvitationImport,
  executeInvitationImport,
  exportInvitationImport,
} from "../canonical-invitation-import";
const catalogue = [{ id: "ai:pro_plus" }, { id: "kids" }, { id: "ai:pro" }];
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const row = {
  email: " Learner@example.test ",
  grant_kind: "single_curriculum",
  scope_mode: "selected",
  catalogues: ["ai:pro_plus"],
  duration_days: 30,
  invitation: true,
  locale: "en",
};
const prepare = (input: unknown[]) => {
  let n = 0;
  return prepareInvitationImport(JSON.stringify(input), catalogue, () => id(++n));
};
describe("canonical invitation bulk import", () => {
  it("keeps same-email invitations distinct and explicit permanent comprehensive terms", () => {
    const rows = prepare([
      row,
      { ...row, catalogues: ["kids"] },
      {
        ...row,
        grant_kind: "comprehensive",
        scope_mode: "all_published",
        catalogues: [],
        duration_days: null,
      },
    ]);
    expect(rows.map((r) => r.data.key)).toEqual([id(1), id(2), id(3)]);
    expect(rows.every((r) => r.data.email === "learner@example.test")).toBe(true);
    expect(rows[2].data.duration_days).toBeNull();
    expect(rows[2].data).not.toHaveProperty("monthly_questions");
  });
  it.each([
    "email",
    "grant_kind",
    "scope_mode",
    "catalogues",
    "duration_days",
    "invitation",
    "locale",
  ])("requires explicit %s", (field) => {
    const input: Record<string, unknown> = { ...row };
    delete input[field];
    expect(() => prepare([input])).toThrow();
  });
  it.each([
    { package: "pro" },
    { catalogues: ["ai:pro"] },
    { catalogues: ["unknown"] },
    { catalogues: ["kids", "kids"], grant_kind: "comprehensive" },
    { scope_mode: "all_published" },
    { duration_days: 0 },
    { duration_days: "30" },
    { locale: "fr" },
    { invitation: "true" },
    { key: null },
    { monthly_questions: 999 },
  ])("rejects invalid input %j", (change) =>
    expect(() => prepare([{ ...row, ...change }])).toThrow(),
  );
  it("rejects duplicate case-varied keys but restores stable keys", () => {
    const key = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    expect(() =>
      prepare([
        { ...row, key },
        { ...row, key: key.toUpperCase() },
      ]),
    ).toThrow(/key/);
    const original = prepare([{ ...row, key }]);
    expect(prepareInvitationImport(exportInvitationImport(original), catalogue)[0].data.key).toBe(
      key,
    );
  });
  it("bounds parsing before writes", () => {
    for (const text of [
      "x",
      "{}",
      "[]",
      " ".repeat(2_000_001),
      JSON.stringify(Array(1001).fill(row)),
    ])
      expect(() => prepareInvitationImport(text, catalogue)).toThrow();
  });
  it("validates every row and current catalogues before any command", async () => {
    const rows = prepare([row, { ...row, catalogues: ["kids"] }]),
      create = vi.fn();
    await expect(
      executeInvitationImport(rows, [{ id: "ai:pro_plus" }], create, vi.fn(), () => true),
    ).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
  it("retains saved rows, stops on uncertainty and retries the identical key", async () => {
    const rows = prepare([row, row, row]),
      update = vi.fn();
    const create = vi
      .fn()
      .mockResolvedValueOnce({ id: id(10) })
      .mockRejectedValueOnce(Error("lost response"));
    const partial = await executeInvitationImport(rows, catalogue, create, update, () => true);
    expect(partial.map((r) => r.status)).toEqual(["saved", "uncertain", "pending"]);
    expect(create).toHaveBeenCalledTimes(2);
    create.mockResolvedValue({ id: id(11) });
    const complete = await executeInvitationImport(partial, catalogue, create, update, () => true);
    expect(complete.map((r) => r.status)).toEqual(["saved", "saved", "saved"]);
    expect(create.mock.calls.map((c) => c[0].data.key)).toEqual([id(1), id(2), id(2), id(3)]);
    expect(rows.every((r) => r.status === "pending")).toBe(true);
  });
  it.each([null, {}, { id: "bad" }])(
    "treats malformed acknowledgements as uncertain %j",
    async (response) => {
      expect(
        (
          await executeInvitationImport(
            prepare([row]),
            catalogue,
            async () => response,
            vi.fn(),
            () => true,
          )
        )[0].status,
      ).toBe("uncertain");
    },
  );
  it("restores inputs without trusting saved status", async () => {
    const rows = prepare([row]);
    rows[0].status = "saved";
    rows[0].id = id(10);
    const restored = prepareInvitationImport(exportInvitationImport(rows), catalogue),
      create = vi.fn(async () => ({ id: id(10) }));
    expect(restored[0].status).toBe("pending");
    await executeInvitationImport(restored, catalogue, create, vi.fn(), () => true);
    expect(create).toHaveBeenCalledWith({ action: "create", data: rows[0].data });
  });
});

describe("M01-F1 runner retirement", () => {
  it("does no work when the batch is retired before invocation", async () => {
    const rows = prepare([row]),
      create = vi.fn(),
      update = vi.fn();
    expect(await executeInvitationImport(rows, catalogue, create, update, () => false)).toEqual(
      rows,
    );
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
  it.each(["resolved", "rejected"])(
    "retains in-flight uncertainty and keys after retired %s response",
    async (outcome) => {
      let current = true,
        resolve!: (value: unknown) => void,
        reject!: (error: Error) => void;
      const pending = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      });
      const rows = prepare([row, row]),
        update = vi.fn(),
        create = vi.fn(() => pending);
      const run = executeInvitationImport(rows, catalogue, create, update, () => current);
      expect(create).toHaveBeenCalledOnce();
      current = false;
      const publications = update.mock.calls.length;
      if (outcome === "resolved") resolve({ id: id(90) });
      else reject(Error("late failure"));
      const result = await run;
      expect(result.map((r) => r.status)).toEqual(["uncertain", "pending"]);
      expect(result.map((r) => r.data.key)).toEqual(rows.map((r) => r.data.key));
      expect(create).toHaveBeenCalledOnce();
      expect(update).toHaveBeenCalledTimes(publications);
    },
  );
  it("checks ownership again after a success publication before starting the next row", async () => {
    let current = true;
    const create = vi.fn(async () => ({ id: id(90) }));
    const update = vi.fn((rows: { status: string }[]) => {
      if (rows[0].status === "saved") current = false;
    });
    const result = await executeInvitationImport(
      prepare([row, row]),
      catalogue,
      create,
      update,
      () => current,
    );
    expect(result.map((r) => r.status)).toEqual(["saved", "pending"]);
    expect(create).toHaveBeenCalledOnce();
  });
});
