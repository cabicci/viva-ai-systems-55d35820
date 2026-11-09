import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  disposablePrerequisiteSources,
  requireDisposableTarget,
} from "../../../scripts/billing/prepare-disposable-prerequisites.ts";
import { candidate, localOrigin, requireValue } from "./local-guards.mjs";

const { repo } = candidate();
requireDisposableTarget(process.env);
assert.equal(localOrigin(requireValue("B023_LOCAL_SUPABASE_ORIGIN"), "Supabase API"), "http://127.0.0.1:54321");

function sql(input: string) {
  return execFileSync(
    "psql",
    ["-XqAt", "-w", "-h", "127.0.0.1", "-p", "54322", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-f", "-"],
    { input, encoding: "utf8" },
  ).trim();
}

const journal = JSON.parse(readFileSync(join(repo, "drizzle/migrations/meta/_journal.json"), "utf8"));
const native = journal.entries.slice(26, 35) as { idx: number; tag: string }[];
assert.equal(native.length, 9);
assert.ok(native.every(({ idx, tag }, offset) =>
  idx === offset + 26 && tag.startsWith(String(idx).padStart(4, "0") + "_") && /^\d{4}_[a-z0-9_]+$/.test(tag),
));
assert.equal(native.at(-1)?.tag, "0034_course_intake");
assert.equal(native[6]?.tag, "0032_student_learning_native_postcondition");

// 0032 verifies the original Lovable installation receipt. It adds no schema.
const migrations = [
  ...disposablePrerequisiteSources(repo).map(({ file, bytes }) => ({ file, body: bytes.toString("utf8") })),
  ...native.filter(({ idx }) => idx !== 32).map(({ tag }) => {
    const file = "drizzle/migrations/" + tag + ".sql";
    return { file, body: "BEGIN;\n" + readFileSync(join(repo, file), "utf8") + "\nCOMMIT;" };
  }),
];

assert.equal(sql("SELECT count(*) = 0 AND to_regclass('billing.commerce_grants') IS NOT NULL AND to_regprocedure('public.curriculum_catalogue(text,text)') IS NULL AND to_regprocedure('public.learning_command(text,jsonb)') IS NULL FROM auth.users;"), "t");
for (const { file, body } of migrations) {
  console.log("Installing disposable journey prerequisite " + file);
  sql(body);
}
assert.equal(sql("SELECT to_regprocedure('public.curriculum_catalogue(text,text)') IS NOT NULL AND to_regprocedure('public.learning_command(text,jsonb)') IS NOT NULL;"), "t");
sql("NOTIFY pgrst, 'reload schema';");

