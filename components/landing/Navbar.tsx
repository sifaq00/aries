import Link from "next/link";
import styles from "./landing.module.css";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#verdicts", label: "Verdicts" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  return (
    <header className={styles.header}>
      <div className={`${styles.wrap} ${styles.nav}`}>
        <Link href="/" aria-label="Aries home" className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static local webp */}
          <img src="/logo.webp" alt="" width={26} height={26} />
          Aries
        </Link>
        <nav className={styles.navLinks} aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className={styles.navCta}>
          <Link className={styles.btn} href="/analyze">
            Run analysis
          </Link>
        </div>
      </div>
    </header>
  );
}
