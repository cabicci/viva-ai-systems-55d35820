// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

it.each(["technical-stripe-checkout", "kids-stripe-checkout"])(
  "%s ships all relative dependencies in its own folder or _shared",
  (name) => {
    const own = resolve("supabase/functions", name) + sep;
    const shared = resolve("supabase/functions/_shared") + sep;
    const seen = new Set<string>();
    const inspect = (file: string) => {
      expect(
        file.startsWith(own) || file.startsWith(shared),
        `Deployment omits sibling function dependency: ${file}`,
      ).toBe(true);
      if (seen.has(file)) return;
      seen.add(file);
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      for (const statement of source.statements) {
        if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
        const specifier = statement.moduleSpecifier;
        if (!specifier || !ts.isStringLiteral(specifier) || !specifier.text.startsWith("."))
          continue;
        inspect(resolve(dirname(file), specifier.text));
      }
    };
    inspect(resolve(own, "index.ts"));
  },
);
