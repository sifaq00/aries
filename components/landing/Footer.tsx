import styles from "./landing.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.wrap} ${styles.footGrid}`}>
        <p className={styles.footNote}>
          Aries is a research tool, not financial advice. Every run costs real model tokens. Method based on &ldquo;TradingAgents: Multi-Agents LLM
          Financial Trading Framework&rdquo; (arXiv 2412.20138). © 2026 Aries.
        </p>
        <nav className={styles.footLinks} aria-label="Footer">
          <a href="/analyze">Analyze</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>
      </div>
    </footer>
  );
}
