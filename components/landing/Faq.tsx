import styles from "./landing.module.css";

const FAQS = [
  {
    q: "How long does a run take?",
    a: "A few minutes end to end. Analysts run in parallel, the debate goes two rounds, risk reviews, and the decider seals it. Every step streams live, so waiting feels like watching — not loading.",
  },
  {
    q: "Do I need a wallet?",
    a: "Yes. Connect a Solana or EVM wallet to run an analysis. Reports save to your wallet history automatically.",
  },
  {
    q: "What does a run cost?",
    a: "Nothing during the demo. Each run burns real model tokens behind the scenes, so demo runs are throttled per IP.",
  },
  {
    q: "Which tokens work?",
    a: "Solana mints plus Ethereum, BNB Chain, Base, and Robinhood Chain contracts with DexScreener coverage. Very new tokens analyze fine, but expect missing sections and lower confidence.",
  },
  {
    q: "Is this financial advice?",
    a: "No. Aries is a research tool. The output is automated analysis with stated confidence — read it, check the sources, and make your own call.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.secHead}>
          <h2 className={styles.h2}>Questions</h2>
        </div>
        {FAQS.map((f) => (
          <details key={f.q} className={styles.faqItem}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
