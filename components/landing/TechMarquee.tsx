import styles from "./landing.module.css";

const SOURCES = [
  { name: "DexScreener", logo: "/sources/dexscreener.png" },
  { name: "RugCheck", logo: "/sources/rugcheck.png" },
  { name: "CoinGecko", logo: "/sources/coingecko.png" },
  { name: "Neon", logo: "/sources/neon.svg" },
];

const WALLETS = [
  { name: "Phantom", logo: "/wallets/phantom.svg" },
  { name: "MetaMask", logo: "/wallets/metamask.svg" },
  { name: "Backpack", logo: "/wallets/backpack.svg" },
  { name: "Coinbase", logo: "/wallets/coinbase.svg" },
  { name: "OKX", logo: "/wallets/okx.svg" },
  { name: "Solflare", logo: "/wallets/solflare.svg" },
  { name: "Trust", logo: "/wallets/trust.png" },
  { name: "Rabby", logo: "/wallets/rabby.svg" },
  { name: "Bitget", logo: "/wallets/bitget.webp" },
  { name: "Nightly", logo: "/wallets/nightly.svg" },
  { name: "Ledger", logo: "/wallets/ledger.svg" },
];

function Track({ items, reverse }: { items: { name: string; logo: string }[]; reverse?: boolean }) {
  // Item list is duplicated once so the -50% translate loops seamlessly.
  const doubled = [...items, ...items];
  return (
    <div className={styles.marqueeRow}>
      <div className={`${styles.marqueeTrack} ${reverse ? styles.reverse : ""}`} aria-hidden="true">
        {doubled.map((s, i) => (
          <span key={`${s.name}-${i}`} className={styles.marqueeItem}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static local asset */}
            <img src={s.logo} alt="" width={22} height={22} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// Data sources, right under the hero: backs up the "live markets" claim early.
export function SourcesMarquee() {
  return (
    <div className={styles.marqueeSection}>
      <div className={styles.wrap}>
        <p className={styles.marqueeLabel}>Reading live markets with</p>
        <Track items={SOURCES} />
      </div>
    </div>
  );
}

// Wallet compatibility, near the final CTA: relevant right when someone's about to connect.
export function WalletsMarquee() {
  return (
    <div className={styles.marqueeSection}>
      <div className={styles.wrap}>
        <p className={styles.marqueeLabel}>Wallets supported</p>
        <Track items={WALLETS} reverse />
      </div>
    </div>
  );
}
