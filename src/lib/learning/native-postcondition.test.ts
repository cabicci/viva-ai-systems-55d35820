// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fixture, monthFunction } from "./test-fixture";
const oldHash = "d314396b20c29c3e356cc0cade7fdf4ed84f59dffb7d2f37a6f9958a3bc97110";
const sql = readFileSync("drizzle/migrations/0031_student_learning_records.sql", "utf8").replaceAll(
  "\r\n",
  "\n",
);
const post = readFileSync(
  "scripts/release/student-learning-native-postcondition.sql",
  "utf8",
).replaceAll("\r\n", "\n");
const root = path.resolve(".unified-test-cache");
mkdirSync(root, { recursive: true });
const dirs: string[] = [];
const databases: PGlite[] = [];
afterEach(async () => {
  for (const db of databases.splice(0)) await db.close();
  for (const dir of dirs.splice(0)) {
    const relative = path.relative(realpathSync(root), realpathSync(dir));
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative))
      throw new Error("Unsafe fixture cleanup target");
    rmSync(dir, { recursive: true });
  }
});
async function setup(previousHash = oldHash) {
  const db = new PGlite();
  databases.push(db);
  await db.exec(fixture);
  await db.exec(monthFunction);
  await db.exec(
    "CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations(id serial primary key, hash text NOT NULL, created_at bigint)",
  );
  await db.query(
    "INSERT INTO drizzle.__drizzle_migrations(id,hash,created_at) VALUES(41,$1,1793637445947)",
    [previousHash],
  );
  await db.exec("SELECT setval('drizzle.__drizzle_migrations_id_seq',41)");
  const dir = mkdtempSync(path.join(root, "student-native-"));
  dirs.push(dir);
  mkdirSync(path.join(dir, "meta"));
  writeFileSync(path.join(dir, "0031_student_learning_records.sql"), sql);
  writeFileSync(path.join(dir, "0032_student_learning_postcondition.sql"), post);
  writeFileSync(
    path.join(dir, "meta/_journal.json"),
    JSON.stringify({
      version: "7",
      dialect: "postgresql",
      entries: [
        {
          idx: 31,
          version: "7",
          when: 1793650000000,
          tag: "0031_student_learning_records",
          breakpoints: true,
        },
        {
          idx: 32,
          version: "7",
          when: 1793650000001,
          tag: "0032_student_learning_postcondition",
          breakpoints: true,
        },
      ],
    }),
  );
  return { db, run: () => migrate(drizzle(db), { migrationsFolder: dir }) };
}
describe("installed native Drizzle runner and reviewed release assertion", () => {
  it("applies the pending feature and meaningful checks once, preserving existing facts", async () => {
    expect(createHash("sha256").update(sql).digest("hex")).toBe(
      "a29fb5acb60633abdb4ba6b28bf91ea2c0e9f1ed7b0db9e83bb381c33725cc3d",
    );
    const { db, run } = await setup();
    await run();
    expect(
      (await db.query("SELECT hash FROM drizzle.__drizzle_migrations ORDER BY id")).rows,
    ).toEqual([
      { hash: oldHash },
      { hash: createHash("sha256").update(sql).digest("hex") },
      { hash: createHash("sha256").update(post).digest("hex") },
    ]);
    expect(
      (await db.query<{ n: number }>("SELECT count(*)::int AS n FROM public.lesson_progress"))
        .rows[0].n,
    ).toBe(1);
    expect(
      (await db.query<{ content: string }>("SELECT content FROM public.lesson_notes")).rows[0]
        .content,
    ).toBe("existing personal note");
    await run();
    expect(
      (await db.query<{ n: number }>("SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations"))
        .rows[0].n,
    ).toBe(3);
  }, 30000);
  it("rolls the whole pending feature back if the final native assertion rejects the prior journal", async () => {
    const { db, run } = await setup("unexpected");
    await expect(run()).rejects.toThrow();
    expect(
      (
        await db.query<{ table_name: string | null }>(
          "SELECT to_regclass('learning_private.courses') AS table_name",
        )
      ).rows[0].table_name,
    ).toBe(null);
    expect(
      (await db.query<{ n: number }>("SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations"))
        .rows[0].n,
    ).toBe(1);
    expect(
      (
        await db.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='lesson_quiz_attempts' AND column_name='locale'",
        )
      ).rows,
    ).toHaveLength(0);
  }, 30000);
});
