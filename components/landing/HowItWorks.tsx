import IllustrationPanel from "./IllustrationPanel";
import styles from "./landing.module.css";

export default function HowItWorks() {
  return (
    <section id="how" className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.secHead}>
          <h2 className={styles.h2}>How a run works</h2>
        </div>
        <p className={styles.secSub}>
          Four stages, each one reading the stage before it. Nothing is decided in isolation, and every claim in the final report traces back to
          something an analyst actually found.
        </p>
        <div className={styles.stages}>
          <div className={styles.stage}>
            <IllustrationPanel>
              <svg viewBox="0 0 360 200">
                <circle className="ln" cx="60" cy="100" r="26" />
                <circle className="ln" cx="60" cy="100" r="10" />
                <path className="ln-dash" d="M86 92 L216 38" />
                <path className="ln-dash" d="M86 97 L216 82" />
                <path className="ln-dash" d="M86 103 L216 122" />
                <path className="ln-dash" d="M86 108 L216 166" />
                <g className="ln">
                  <rect x="220" y="24" width="96" height="30" rx="6" />
                  <rect x="220" y="68" width="96" height="30" rx="6" />
                  <rect x="220" y="112" width="96" height="30" rx="6" />
                  <rect x="220" y="156" width="96" height="30" rx="6" />
                </g>
                <g className="fill-soft">
                  <rect x="230" y="34" width="52" height="4" rx="2" />
                  <rect x="230" y="43" width="70" height="4" rx="2" />
                  <rect x="230" y="78" width="52" height="4" rx="2" />
                  <rect x="230" y="87" width="70" height="4" rx="2" />
                  <rect x="230" y="122" width="52" height="4" rx="2" />
                  <rect x="230" y="131" width="70" height="4" rx="2" />
                  <rect x="230" y="166" width="52" height="4" rx="2" />
                  <rect x="230" y="175" width="70" height="4" rx="2" />
                </g>
              </svg>
            </IllustrationPanel>
            <h3>
              <span>1</span>Four analysts read the token
            </h3>
            <p>Chain structure, price action, crowd sentiment, and news — read in parallel from live markets. When data is missing, the report says missing. It is never invented.</p>
          </div>

          <div className={styles.stage}>
            <IllustrationPanel>
              <svg viewBox="0 0 360 200">
                <rect className="ln" x="28" y="46" width="110" height="108" rx="8" />
                <g className="fill-soft">
                  <rect x="42" y="62" width="60" height="5" rx="2" />
                  <rect x="42" y="76" width="82" height="4" rx="2" />
                  <rect x="42" y="86" width="82" height="4" rx="2" />
                  <rect x="42" y="96" width="64" height="4" rx="2" />
                </g>
                <path className="ln-green" d="M42 132 l16 -14 l12 8 l22 -20" />
                <rect className="ln" x="222" y="46" width="110" height="108" rx="8" />
                <g className="fill-soft">
                  <rect x="236" y="62" width="60" height="5" rx="2" />
                  <rect x="236" y="76" width="82" height="4" rx="2" />
                  <rect x="236" y="86" width="82" height="4" rx="2" />
                  <rect x="236" y="96" width="64" height="4" rx="2" />
                </g>
                <path className="ln" d="M236 118 l16 14 l12 -8 l22 20" style={{ stroke: "rgba(255,80,68,.5)" }} />
                <path className="ln-dash" d="M146 88 H214 M206 82 l8 6 l-8 6" />
                <path className="ln-dash" d="M214 112 H146 M154 106 l-8 6 l8 6" />
              </svg>
            </IllustrationPanel>
            <h3>
              <span>2</span>Two sides argue
            </h3>
            <p>One agent builds the case for the token. Another is tasked with breaking it. Two rounds, every claim cited back to the analyst reports.</p>
          </div>

          <div className={styles.stage}>
            <IllustrationPanel>
              <svg viewBox="0 0 360 200">
                <circle className="ln" cx="110" cy="38" r="14" />
                <circle className="ln" cx="180" cy="38" r="14" />
                <circle className="ln" cx="250" cy="38" r="14" />
                <path className="ln-dash" d="M110 54 L168 96" />
                <path className="ln-dash" d="M180 54 L180 92" />
                <path className="ln-dash" d="M250 54 L192 96" />
                <path className="ln" d="M180 96 l44 14 v28 c0 24 -20 40 -44 48 c-24 -8 -44 -24 -44 -48 v-28 z" />
                <path className="ln-green" d="M162 138 l12 12 l24 -26" />
              </svg>
            </IllustrationPanel>
            <h3>
              <span>3</span>Risk reviews the fight
            </h3>
            <p>Three reviewers check the ways tokens actually kill you: exit liquidity, rug paths, and whale concentration. Risk can overrule both sides.</p>
          </div>

          <div className={styles.stage}>
            <IllustrationPanel>
              <svg viewBox="0 0 360 200">
                <rect className="ln" x="118" y="22" width="124" height="156" rx="8" />
                <g className="fill-soft">
                  <rect x="134" y="70" width="92" height="5" rx="2" />
                  <rect x="134" y="82" width="92" height="5" rx="2" />
                  <rect x="134" y="94" width="64" height="5" rx="2" />
                  <rect x="134" y="118" width="92" height="5" rx="2" />
                  <rect x="134" y="130" width="76" height="5" rx="2" />
                </g>
                <rect className="ln-green" x="134" y="38" width="58" height="16" rx="4" />
                <rect className="ln" x="134" y="150" width="72" height="14" rx="7" />
                <path className="ln-dash" d="M206 157 H268" />
                <circle className="ln" cx="282" cy="157" r="10" />
              </svg>
            </IllustrationPanel>
            <h3>
              <span>4</span>You get the verdict
            </h3>
            <p>A rating with stated confidence, key risks up top, and the full transcript below. One permanent link per report, built to be sent around.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
