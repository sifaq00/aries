import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import { parseDecision } from "@/lib/decision";
import styles from "./landing.module.css";

interface ExampleReport {
  id: string;
  symbol: string;
  chain: string | null;
  rating: string;
  confidence: string;
  risks: string[];
  thesis: string;
  date: string;
}

const FALLBACK: ExampleReport = {
  id: "9c222bb6-689b-4fb3-a9fc-9fcfaa7146d4",
  symbol: "SIZE",
  chain: "Solana",
  rating: "Sell",
  confidence: "low",
  risks: [
    "Unknown contract owner authority, unverifiable LP custody — open rug path",
    "$30.7K total liquidity — high slippage on any exit",
    "108 sells vs 84 buys over 24h — weak holder conviction",
    "5 days old, unlisted on major aggregators",
  ],
  thesis:
    "With liquidity insufficient to absorb even minor selling and no verifiable fundamentals, the risk/reward is decisively unfavorable. The recent price rebound is speculative noise in an illiquid pool.",
  date: "Sep 10, 2026",
};

async function getExample(): Promise<ExampleReport> {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) return FALLBACK;
    const sql = neon(url);
    const rows = (await sql`
      select id, chain, token, decision, created_at from reports
      order by created_at desc
      limit 1
    `) as { id: string; chain?: string | null; token?: { symbol?: string }; decision?: string; created_at?: string }[];
    const row = rows[0];
    if (!row?.decision) return FALLBACK;
    const parsed = parseDecision(row.decision);
    if (!parsed.rating || !parsed.thesis) return FALLBACK;
    return {
      id: row.id,
      symbol: row.token?.symbol ?? "?",
      chain: row.chain ?? null,
      rating: parsed.rating,
      confidence: (parsed.confidence ?? "medium").toLowerCase(),
      risks: parsed.risks.length > 0 ? parsed.risks.slice(0, 4) : FALLBACK.risks,
      thesis: parsed.thesis,
      date: new Date(row.created_at ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
  } catch {
    return FALLBACK;
  }
}

function ratingClass(rating: string): string {
  const r = rating.toLowerCase();
  if (r.includes("buy") || r.includes("overweight")) return styles.buy;
  if (r.includes("hold")) return styles.hold;
  return "";
}

export default async function Hero() {
  const report = await getExample();

  return (
    <div className={styles.hero}>
      <div className={styles.wrap}>
        <span className={styles.heroPill}>
          <span className={styles.dot} /> Testnet demo is live
        </span>
        <h1 className={styles.heroTitle}>The research desk for any token.</h1>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.lede}>
              Paste a contract. Four analysts read it, two of them argue about what they found, a risk team reviews the fight — and you get a
              verdict you can read, share, and disagree with.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.btn} href="/analyze">
                Run an analysis
              </Link>
              <Link className={`${styles.btn} ${styles.btnQuiet}`} href={`/r/${report.id}`}>
                Read a live report
              </Link>
            </div>
            <p className={styles.heroFact}>
              Every run: <strong>4 analysts, 2 debate rounds, 3 risk reviewers, 1 decider.</strong> Median full run is about 99 seconds, streamed
              live while it thinks.
            </p>
          </div>

          <figure className={styles.report} aria-label="Example Aries report">
            <div className={styles.reportHead}>
              <span>
                <b>Aries research</b> — report {report.id.slice(0, 8)}
              </span>
              <span>{report.date}</span>
            </div>
            <div className={styles.reportVerdict}>
              <div className={`${styles.verdictWord} ${ratingClass(report.rating)}`}>{report.rating}</div>
              <div className={styles.verdictMeta}>
                <span>Confidence: {report.confidence}</span>
                <span>
                  Token: {report.symbol}
                  {report.chain ? ` (${report.chain})` : ""}
                </span>
              </div>
            </div>
            <div className={styles.reportRisks}>
              <h3>Key risks</h3>
              <ul>
                {report.risks.map((r) => {
                  const [head, ...rest] = r.split(/\s+—\s+/);
                  return (
                    <li key={r}>
                      {head}
                      {rest.length > 0 ? <em> — {rest.join(" — ")}</em> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className={styles.reportThesis}>&ldquo;{report.thesis}&rdquo;</div>
            <div className={styles.reportFoot}>
              <Link href={`/r/${report.id}`}>Read the full report</Link>
              <span className={styles.stamp}>Not financial advice</span>
            </div>
          </figure>
        </div>
      </div>
    </div>
  );
}
