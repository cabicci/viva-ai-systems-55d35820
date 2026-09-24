import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const pg = new PGlite();
const migration = readFileSync(
  "supabase/migrations/20260924190000_kids_parent_content_access_foundation.sql",
  "utf8",
);
const privateMigration = readFileSync(
  "supabase/migrations/20260924191000_kids_private_lesson_content.sql",
  "utf8",
);
const parentA = "11111111-1111-4111-8111-111111111111";
const parentB = "22222222-2222-4222-8222-222222222222";
function assert(value, message) {
  if (!value) throw new Error(message);
}
async function asParent(id, fn) {
  await pg.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${id}'`);
  try {
    return await fn();
  } finally {
    await pg.exec("RESET ROLE; RESET request.jwt.claim.sub");
  }
}
try {
  await pg.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN; GRANT USAGE ON SCHEMA public TO authenticated, service_role;
    CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    GRANT USAGE ON SCHEMA auth TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, service_role;
    INSERT INTO auth.users(id) VALUES ('${parentA}'), ('${parentB}');
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean,
      file_size_limit integer, allowed_mime_types text[]);
    CREATE TABLE storage.objects(bucket_id text NOT NULL);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA storage TO authenticated;
    GRANT SELECT ON storage.objects TO authenticated;
    CREATE POLICY broad_access ON storage.objects FOR SELECT TO authenticated USING (true);
  `);
  await pg.exec(migration);
  await pg.exec(privateMigration);
  const bucket = await pg.query(
    "SELECT public FROM storage.buckets WHERE id = 'kids-lesson-content'",
  );
  assert(
    bucket.rows.length === 1 && bucket.rows[0].public === false,
    "Kids bucket must be private",
  );
  await pg.exec(
    "INSERT INTO storage.objects(bucket_id) VALUES ('kids-lesson-content'), ('public-assets')",
  );
  await asParent(parentA, async () => {
    const visible = await pg.query("SELECT bucket_id FROM storage.objects");
    assert(
      visible.rows.length === 1 && visible.rows[0].bucket_id === "public-assets",
      "Existing broad storage policy must not expose Kids files",
    );
  });
  let unsignedApproval = false;
  try {
    await pg.exec(
      "INSERT INTO public.kids_content_approvals(level_id,lesson_number,locale,approved_at,approval_reference) VALUES ('level-1',2,'en',now(),'no-hash')",
    );
  } catch {
    unsignedApproval = true;
  }
  assert(unsignedApproval, "Kids approval must require exact content digest");
  let blocked = false;
  await asParent(parentA, async () => {
    try {
      await pg.exec(`INSERT INTO public.kids_profiles(parent_id,display_name,level_id)
                     VALUES ('${parentA}','A','level-1')`);
    } catch {
      blocked = true;
    }
  });
  assert(blocked, "Profile creation must fail while child collection disabled");
  await pg.exec(`
    UPDATE public.kids_release_control
      SET accepts_child_data = true, lesson_access_enabled = true;
    INSERT INTO public.kids_parent_verifications(parent_id,verified_at,verification_reference)
      VALUES ('${parentA}',now(),'replay-a'),('${parentB}',now(),'replay-b');
    INSERT INTO public.kids_content_approvals(level_id,lesson_number,locale,approved_at,approval_reference,approved_sha256)
      VALUES ('level-1',1,'en',now(),'owner-declaration', repeat('a',64));
  `);
  let child;
  await asParent(parentA, async () => {
    const inserted =
      await pg.query(`INSERT INTO public.kids_profiles(parent_id,display_name,level_id)
      VALUES ('${parentA}','Alias','level-1') RETURNING id`);
    child = inserted.rows[0].id;
    const free = await pg.query(
      "SELECT public.kids_can_access_lesson($1,'level-1',1,'en') AS allowed",
      [child],
    );
    assert(free.rows[0].allowed, "Reviewed free lesson should open for own verified profile");
    const paid = await pg.query(
      "SELECT public.kids_can_access_lesson($1,'level-1',3,'en') AS allowed",
      [child],
    );
    assert(!paid.rows[0].allowed, "Paid lesson must remain closed");
    const wrongLocale = await pg.query(
      "SELECT public.kids_can_access_lesson($1,'level-1',1,'ar-EG') AS allowed",
      [child],
    );
    assert(!wrongLocale.rows[0].allowed, "Unapproved locale must remain closed");
  });
  await asParent(parentB, async () => {
    const rows = await pg.query("SELECT id FROM public.kids_profiles");
    assert(rows.rows.length === 0, "Another family must not read child profile");
    const access = await pg.query(
      "SELECT public.kids_can_access_lesson($1,'level-1',1,'en') AS allowed",
      [child],
    );
    assert(!access.rows[0].allowed, "Another family must not open child lesson");
  });
  await pg.exec(`INSERT INTO public.kids_content_approvals(level_id,lesson_number,locale,approved_at,approval_reference,approved_sha256)
    VALUES ('level-1',3,'en',now(),'owner-declaration', repeat('b',64));
    INSERT INTO public.kids_family_entitlements(parent_id,active_from,active_until,entitlement_reference)
    VALUES ('${parentA}',now()-interval '1 day',now()+interval '1 day','replay-paid');`);
  await asParent(parentA, async () => {
    const paid = await pg.query(
      "SELECT public.kids_can_access_lesson($1,'level-1',3,'en') AS allowed",
      [child],
    );
    assert(
      paid.rows[0].allowed,
      "Reviewed paid lesson should require separate active Kids entitlement",
    );
  });
  console.log(
    "Kids SQL replay PASS: closed default, private storage and digest, verified parent, free/paid, locale and cross-family gates",
  );
} finally {
  await pg.close();
}
