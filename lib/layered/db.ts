import { neon } from "@neondatabase/serverless";

export type SqlFn = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>;

function getSql(injected?: SqlFn): SqlFn | null {
  if (injected) return injected;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url) as unknown as SqlFn;
}

export interface ReportRow {
  mint: string;
  model: string;
  chain?: string | null;
  token: { name: string; price: number; liquidity: number; change24h: number; symbol: string };
  reports: Record<string, string>;
  debate: { phase: string; round: number; side: string; text: string }[];
  risks: Record<string, string>;
  decision: string;
  rating: string | null;
  confidence: string | null;
  wallet?: string | null;
  views?: number;
}

export async function saveReport(row: ReportRow, deps: { sql?: SqlFn } = {}): Promise<{ id: string }> {
  const sql = getSql(deps.sql);
  if (!sql) throw new Error("Missing Neon database configuration");
  const rows = (await sql`
    insert into reports (mint, model, chain, token, reports, debate, risks, decision, rating, confidence, wallet)
    values (
      ${row.mint}, ${row.model}, ${row.chain ?? null},
      ${JSON.stringify(row.token)}::jsonb, ${JSON.stringify(row.reports)}::jsonb,
      ${JSON.stringify(row.debate)}::jsonb, ${JSON.stringify(row.risks)}::jsonb,
      ${row.decision}, ${row.rating}, ${row.confidence}, ${row.wallet ?? null}
    )
    returning id
  `) as { id?: string }[];
  if (!rows[0]?.id) throw new Error("Neon save returned no id");
  return { id: rows[0].id };
}

export async function loadReport(id: string, deps: { sql?: SqlFn } = {}): Promise<(ReportRow & { id: string }) | null> {
  if (!/^[0-9a-f-]{1,64}$/i.test(id)) return null;
  const sql = getSql(deps.sql);
  if (!sql) return null;
  try {
    const rows = (await sql`select * from reports where id = ${id}`) as (ReportRow & { id: string })[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export interface HistoryItem {
  id: string;
  mint: string;
  symbol: string;
  rating: string | null;
  created_at: string;
}

export async function listHistory(wallet: string, deps: { sql?: SqlFn; limit?: number } = {}): Promise<HistoryItem[]> {
  if (!validWallet(wallet)) return [];
  const sql = getSql(deps.sql);
  if (!sql) return [];
  const limit = Math.min(deps.limit ?? 20, 50);
  try {
    const rows = (await sql`
      select id, mint, token, rating, created_at from reports
      where wallet = ${wallet}
      order by created_at desc
      limit ${limit}
    `) as { id: string; mint: string; token?: { symbol?: string }; rating?: string; created_at?: string }[];
    return rows.map((r) => ({ id: r.id, mint: r.mint, symbol: r.token?.symbol ?? "?", rating: r.rating ?? "?", created_at: r.created_at ?? "" }));
  } catch {
    return [];
  }
}

export async function bumpViews(id: string, deps: { sql?: SqlFn } = {}): Promise<void> {
  try {
    if (!/^[0-9a-f-]{1,64}$/i.test(id)) return;
    const sql = getSql(deps.sql);
    if (!sql) return;
    await sql`update reports set views = views + 1 where id = ${id}`;
  } catch {
    // analytics best-effort: ignore
  }
}

export type AnalyticsType = "run_started" | "run_completed";

function validWallet(wallet: unknown): wallet is string {
  return (
    typeof wallet === "string" &&
    (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet) || /^0x[0-9a-fA-F]{40}$/.test(wallet))
  );
}

// Best-effort analytics. Never throws, never blocks a run.
export async function logEvent(type: AnalyticsType, wallet: unknown, reportId?: string, deps: { sql?: SqlFn } = {}): Promise<void> {
  try {
    if (!validWallet(wallet)) return;
    const sql = getSql(deps.sql);
    if (!sql) return;
    await sql`insert into events (wallet, type, report_id) values (${wallet}, ${type}, ${reportId ?? null})`;
  } catch {
    // ignore
  }
}

export async function walletStats(wallet: string, deps: { sql?: SqlFn } = {}): Promise<{ runs: number; lastRun: string | null }> {
  const fallback = { runs: 0, lastRun: null as string | null };
  try {
    if (!validWallet(wallet)) return fallback;
    const sql = getSql(deps.sql);
    if (!sql) return fallback;
    const rows = (await sql`
      select created_at from events
      where wallet = ${wallet} and type = 'run_completed'
      order by created_at desc
      limit 100
    `) as { created_at?: string }[];
    return { runs: rows.length, lastRun: rows[0]?.created_at ?? null };
  } catch {
    return fallback;
  }
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// Daily run counter for hold tiers. Returns runs used today. Never throws.
export async function dailyUsage(wallet: string, deps: { sql?: SqlFn } = {}): Promise<number> {
  try {
    if (!validWallet(wallet)) return 0;
    const sql = getSql(deps.sql);
    if (!sql) return 0;
    const rows = (await sql`
      select runs from usage where wallet = ${wallet.toLowerCase()} and day = ${todayUTC()}
    `) as { runs?: number }[];
    return rows[0]?.runs ?? 0;
  } catch {
    return 0;
  }
}

// Increment today's counter (upsert). Never throws.
export async function bumpDailyUsage(wallet: string, deps: { sql?: SqlFn } = {}): Promise<void> {
  try {
    if (!validWallet(wallet)) return;
    const sql = getSql(deps.sql);
    if (!sql) return;
    await sql`
      insert into usage (wallet, day, runs) values (${wallet.toLowerCase()}, ${todayUTC()}, 1)
      on conflict (wallet, day) do update set runs = usage.runs + 1
    `;
  } catch {
    // ignore
  }
}
