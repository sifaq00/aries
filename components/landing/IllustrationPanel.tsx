"use client";

import { useRef } from "react";
import styles from "./landing.module.css";

// Cursor-following glow, ported from landing.html's vanilla-JS mousemove
// listener. Writes CSS vars directly via ref (no state) so the glow tracks
// the pointer without triggering a re-render on every mousemove.
export default function IllustrationPanel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={ref}
      className={styles.illo}
      aria-hidden="true"
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
