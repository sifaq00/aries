import Link from "next/link";
import styles from "./landing.module.css";

export default function CtaBand() {
  return (
    <section className={`${styles.section} ${styles.cta}`}>
      <div className={styles.wrap}>
        <h2 className={styles.ctaTitle}>Paste a contract. Meet the desk.</h2>
        <p className={styles.ctaText}>Free demo, throttled per IP. Your first verdict lands in about two minutes.</p>
        <Link className={styles.btn} href="/analyze">
          Run an analysis
        </Link>
      </div>
    </section>
  );
}
