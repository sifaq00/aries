import IllustrationPanel from "./IllustrationPanel";
import styles from "./landing.module.css";

export default function HonestLimits() {
  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.secHead}>
          <h2 className={styles.h2}>What this is, and is not</h2>
        </div>
        <div className={styles.limits}>
          <div className={styles.limit}>
            <IllustrationPanel>
              <svg viewBox="0 0 360 200">
                <rect className="ln" x="96" y="26" width="118" height="148" rx="8" />
                <g className="fill-soft">
                  <rect x="112" y="44" width="66" height="6" rx="2" />
                  <rect x="112" y="60" width="86" height="4" rx="2" />
                  <rect x="112" y="70" width="86" height="4" rx="2" />
                  <rect x="112" y="80" width="60" height="4" rx="2" />
                </g>
                <rect className="ln" x="112" y="104" width="20" height="8" rx="2" />
                <rect className="ln" x="138" y="104" width="20" height="8" rx="2" />
                <rect className="ln-green" x="164" y="104" width="20" height="8" rx="2" />
                <circle className="ln" cx="226" cy="128" r="30" />
                <path className="ln" d="M248 150 L276 178" />
              </svg>
            </IllustrationPanel>
            <h3>Research, not advice</h3>
            <p>Aries produces automated analysis with stated confidence. It can be wrong — especially on new tokens with thin data — and it says so in the report.</p>
          </div>

          <div className={styles.limit}>
            <IllustrationPanel>
              <svg viewBox="0 0 360 200">
                <circle className="ln" cx="180" cy="100" r="58" />
                <path className="ln" d="M180 100 L180 66 M180 100 L206 112" />
                <circle className="fill-soft" cx="180" cy="100" r="4" />
                <path className="ln-dash" d="M180 26 a74 74 0 1 1 -52 21" style={{ stroke: "rgba(0,200,5,.4)" }} />
                <path className="ln" d="M180 46 v6 M234 100 h-6 M180 154 v-6 M126 100 h6" />
              </svg>
            </IllustrationPanel>
            <h3>Minutes, not seconds</h3>
            <p>This is not a scanner. A full run takes a couple of minutes because four analysts, a debate, and a risk review are doing real reads on live markets.</p>
          </div>

          <div className={styles.limit}>
            <IllustrationPanel>
              <svg viewBox="0 0 360 200">
                <rect className="ln" x="112" y="26" width="118" height="148" rx="8" />
                <g className="fill-soft">
                  <rect x="128" y="76" width="86" height="4" rx="2" />
                  <rect x="128" y="86" width="86" height="4" rx="2" />
                  <rect x="128" y="96" width="60" height="4" rx="2" />
                </g>
                <rect x="128" y="42" width="52" height="18" rx="4" style={{ stroke: "rgba(255,80,68,.55)", strokeWidth: 1.6, fill: "none" }} />
                <circle className="ln" cx="246" cy="140" r="26" style={{ stroke: "rgba(255,80,68,.55)" }} />
                <path d="M228 122 L264 158" style={{ stroke: "rgba(255,80,68,.55)", strokeWidth: 1.6 }} />
              </svg>
            </IllustrationPanel>
            <h3>Sometimes the answer is no</h3>
            <p>A tool that only ever says buy is a sales funnel. Aries ships Sell and Hold verdicts, with the reasoning attached, when that is what the desk concludes.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
