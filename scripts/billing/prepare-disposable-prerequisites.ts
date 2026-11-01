/** CI-only schema/fixtures for the existing billing proofs. Never loads .env or calls Stripe. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import postgres from "postgres";

const BASELINE = [
  "scripts/email-access/email-access-candidate.sql",
  "docs/billing/20260920_stripe_refunds.sql",
  "scripts/academic-education/assistant-rag-candidate.sql",
  "scripts/academic-education/assistant-native-candidate.sql",
] as const;

type CorePrice = { id: string; plan_key: string; billing_interval: string; market_code: string; amount_minor: string | number };
export function academicFixturePrices(core: CorePrice[], market: string, interval: string, policy: Record<string, unknown>) {
  const prices = core.filter((r) => r.plan_key === "pro_plus" && r.market_code === market && r.billing_interval === interval);
  const base = Number(prices[0]?.amount_minor);
  const extra = Number(policy[`${market === "EG" ? "eg" : "usd"}_${interval}_minor`]);
  if (prices.length !== 1 || !Number.isSafeInteger(base) || base <= 0 || !Number.isSafeInteger(extra) || extra <= 0 ||
      policy.sales_enabled !== false || policy.runtime_enabled !== false)
    throw new Error("Unambiguous approved prices and disabled Academic activation required");
  return { base, addon: base + extra };
}

export function requireDisposableTarget(env: NodeJS.ProcessEnv): void {
  if (env.BILLING_DISPOSABLE_DB !== "1" || env.PGHOST !== "127.0.0.1" ||
      env.PGPORT !== "54322" || env.PGDATABASE !== "postgres" || env.PGUSER !== "postgres" ||
      env.DATABASE_URL) throw new Error("Exact disposable loopback database required");
}

export function disposablePrerequisiteSources(root: string) {
  const journal = JSON.parse(readFileSync(path.join(root, "drizzle/migrations/meta/_journal.json"), "utf8")) as {
    entries: { idx: number; tag: string }[];
  };
  // 0000–0007 already exist in the Supabase baseline. 0026 is assistant/free-
  // access installation with separate prerequisites, outside these billing proofs.
  const entries = journal.entries.filter((r) => r.idx >= 8 && r.idx <= 25);
  if (entries.length !== 18 || entries.some((r, i) => r.idx !== i + 8 || !r.tag.startsWith(`${String(r.idx).padStart(4, "0")}_`)))
    throw new Error("Billing prerequisite journal changed");
  return [...BASELINE, ...entries.map((r) => `drizzle/migrations/${r.tag}.sql`)].map((file) => {
    const bytes = readFileSync(path.join(root, file));
    return { file, bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
  });
}

export async function prepareDisposablePrerequisites(env: NodeJS.ProcessEnv, root: string) {
  requireDisposableTarget(env);
  const sources = disposablePrerequisiteSources(root); // Resolve all sources before any connection/write.
  const db = postgres({ host: "127.0.0.1", port: 54322, database: "postgres", username: "postgres",
    password: env.PGPASSWORD, ssl: false, max: 1, onnotice: () => {} });
  try {
    const [baseline] = await db`select to_regclass('billing.commerce_orders') is not null as ready,
      to_regclass('billing.stripe_live_control') is null as clean`;
    if (!baseline?.ready || !baseline.clean) throw new Error("Clean Supabase baseline required");
    for (const source of sources) {
      await db.unsafe(source.bytes.toString("utf8"));
      console.log(JSON.stringify({ applied: source.file, sha256: source.sha256 }));
    }
    // Synthetic mappings only: derive amounts from the actual catalogue/quote
    // and disabled add-on policy. No users, checkout, subscriptions or offers.
    await db.begin(async (sql) => {
      await sql`select set_config('request.jwt.claims','{"role":"service_role"}',true),
        set_config('masaarat.stripe_environment','live',true)`;
      const core = await sql<CorePrice[]>`select distinct on (p.plan_key,v.billing_interval,m.market_code)
        m.id,p.plan_key,v.billing_interval,m.market_code,m.amount_minor
        from billing.market_prices m join billing.plan_versions v on v.id=m.plan_version_id
        join billing.plan_catalog p on p.id=v.plan_id
        where p.plan_key in ('pro','pro_plus') and p.is_active and v.status='published'
          and m.status='active' and v.effective_from<=now() and (v.effective_to is null or v.effective_to>now())
          and m.effective_from<=now() and (m.effective_to is null or m.effective_to>now())
        order by p.plan_key,v.billing_interval,m.market_code,v.version_number desc,m.effective_from desc`;
      if (core.length !== 8) throw new Error("Expected eight active core catalogue combinations");
      let id = 0;
      const ids = () => { id += 1; return { price: `price_CIOnly${id}`, product: `prod_CIOnly${id}` }; };
      for (const row of core) {
        const f = ids();
        await sql`select public.register_stripe_gateway_catalog(${row.id},${f.price},${f.product})`;
      }
      for (const market of ["EG", "INTL"]) for (const interval of ["month", "year"]) {
        const currency = market === "EG" ? "egp" : "usd";
        const [kids] = await sql`select billing.commerce_price('kids',${market},${interval}) as quote`;
        for (const discounted of [false, true]) {
          const f = ids();
          const base = Number(kids.quote.original_minor);
          const amount = discounted ? Math.round(base * 0.9) : base;
          await sql`select public.register_kids_stripe_price(${market},${interval},${discounted},${currency},${amount},${f.product},${f.price})`;
        }
        const [technical] = await sql`select billing.commerce_price('technical',${market},${interval}) as value`;
        const tech = ids();
        await sql`select public.register_technical_stripe_price(${market},${interval},false,${currency},${Number(technical.value.original_minor)},${tech.product},${tech.price})`;
        const [policy] = await sql`select * from public.academic_assistant_policy where course_id='AC-BUS'`;
        if (!policy) throw new Error("Missing disabled Academic policy");
        // Academic sales remain closed: its purchase quote correctly refuses.
        // Only fixture mappings use the existing Academic→Pro Plus base-price
        // contract plus the disabled policy surcharge, without enabling sales.
        const prices = academicFixturePrices(core, market, interval, policy);
        for (const assistant of [false, true]) {
          const f = ids();
          await sql`insert into billing.academic_stripe_prices
            (market_code,billing_interval,amount_minor,currency_code,gateway_product_id,gateway_price_id,includes_assistant,course_id)
            values(${market},${interval},${assistant ? prices.addon : prices.base},${currency},${f.product},${f.price},${assistant},'AC-BUS')`;
        }
      }
      const [state] = await sql`select billing.stripe_live_enabled() as live,
        exists(select 1 from public.academic_assistant_policy where sales_enabled or runtime_enabled) as academic`;
      if (id !== 28 || state.live || state.academic) throw new Error("Disposable fixture/disabled-state mismatch");
    });
    console.log(JSON.stringify({ synthetic_price_mappings: 28, live_enabled: false, academic_activation: false,
      external_provider_calls: 0, note: "Disposable catalogue query fixture; not proof of real Stripe inventory" }));
  } finally { await db.end(); }
}

if (import.meta.main) {
  await prepareDisposablePrerequisites(process.env, path.resolve(import.meta.dirname, "../.."));
}
