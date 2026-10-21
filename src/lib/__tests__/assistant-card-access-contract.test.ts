import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (name: string) => fs.readFileSync(path.join(root, "supabase/migrations", name), "utf8");
const sql = read("20261021120000_assistant_card_content_access.sql");

describe("assistant content gateway SQL contract", () => {
  it("restricts the definer gateway to the server and an explicit bounded card/user scope", () => {
    expect(sql).toContain("SECURITY DEFINER SET search_path = ''");
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.assistant_card_content_access\(uuid, text\)\s+FROM PUBLIC, anon, authenticated/);
    expect(sql).toContain("TO service_role");
    expect(sql).toContain("p_user_id IS NULL OR p_card_id IS NULL");
    expect(sql).toContain("char_length(p_card_id) > 128");
  });

  it("preserves the installed eligible-admin review and snapshot policy without writing billing or corpus", () => {
    expect(read("20260926180000_rag_corpus_admin_select_only.sql")).toContain("public.has_role((SELECT auth.uid()), 'admin'::public.app_role)");
    const commerce = read("20261004012000_commerce_access.sql");
    expect(commerce).toContain("billing.account_deletion_blocked(p_user)");
    expect(commerce).toContain("access_state='suspended'");
    expect(sql.indexOf("billing.commerce_account_allowed(p_user_id)")).toBeLessThan(sql.indexOf("public.has_role(p_user_id"));
    expect(sql).toContain("billing.get_entitlement_snapshot(p_user_id)");
    expect(sql).not.toMatch(/\b(?:INSERT INTO|UPDATE|DELETE FROM)\b/i);
    expect(sql).not.toContain("reserve_learner_ai_access(");
    expect(sql).not.toContain("SET ROLE");
  });
});
