import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import styles from "./landing.module.css";

interface LatestVerdict {
  id: string;
  symbol: string;
  rating: string | null;
  confidence: string | null;
  created_at: string;
}

async function getLatest(): Promise<LatestVerdict[]> {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) return [];
    const sql = neon(url);
    const rows = (await sql`
      select id, token, rating, confidence, created_at from reports
      order by created_at desc
      limit 3
    `) as { id: string; token?: { symbol?: string }; rating?: string; confidence?: string; created_at?: string | Date }[];
    return rows.map((r) => ({
      id: r.id,
      symbol: r.token?.symbol ?? "?",
      rating: r.rating ?? null,
      confidence: r.confidence ?? null,
      // driver returns a Date for timestamptz columns, not a string
      created_at: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "",
    }));
  } catch {
    return [];
  }
}

function ratingClass(rating: string | null): string {
  const r = (rating ?? "").toLowerCase();
  if (r.includes("buy") || r.includes("overweight")) return styles.buy;
  if (r.includes("hold")) return styles.hold;
  if (r.includes("sell") || r.includes("underweight")) return styles.sell;
  return "";
}

export default async function LatestVerdicts() {
  const items = await getLatest();

  return (
    <section id="verdicts" className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.secHead}>
          <h2 className={styles.h2}>Latest verdicts</h2>
          <Link href="/analyze">Run yours</Link>
        </div>
        <div className={styles.ledger}>
          <div className={`${styles.ledgerRow} ${styles.ledgerRowHead}`} aria-hidden="true">
            <span>Token</span>
            <span>Rating</span>
            <span>Confidence</span>
            <span>Date</span>
          </div>
          {items.length === 0 ? (
            <p className={styles.emptyLedger}>No verdicts yet — be the first to run one.</p>
          ) : (
            items.map((v) => (
              <Link key={v.id} className={styles.ledgerRow} href={`/r/${v.id}`}>
                <span className={styles.tk}>{v.symbol}</span>
                <span className={`${styles.rating} ${ratingClass(v.rating)}`}>{v.rating ?? "?"}</span>
                <span className={styles.conf}>{v.confidence ?? "?"}</span>
                <span className={styles.date}>{v.created_at}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
