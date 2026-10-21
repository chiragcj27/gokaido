"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "../../lib/cartStore";
import styles from "./CartToast.module.css";

/**
 * "Added to bag" toast, driven by the cart store's `lastAdded` — any `addItem` call anywhere
 * shows it, so callers don't wire anything up. Timing lives in CSS: the gold timer bar's
 * animation is the countdown (hover/focus pauses it), and its `animationend` starts the exit.
 */
export default function CartToast() {
  const { lastAdded, dismissLastAdded } = useCart();
  // Keyed to the add, so a new add while one is leaving shows fresh (the `key` below also remounts
  // it, restarting the countdown).
  const [leavingKey, setLeavingKey] = useState<number | null>(null);

  if (!lastAdded) return null;
  const { item, quantity } = lastAdded;
  const leaving = leavingKey === lastAdded.key;
  const leave = () => setLeavingKey(lastAdded.key);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      <div
        key={lastAdded.key}
        className={leaving ? `${styles.toast} ${styles.leaving}` : styles.toast}
        onAnimationEnd={(event) => {
          if (leaving && event.target === event.currentTarget) dismissLastAdded();
        }}
      >
        <span className={styles.slash} aria-hidden="true" />

        <div className={styles.thumb}>
          {item.imageSrc && <Image src={item.imageSrc} alt="" fill sizes="64px" className={styles.thumbImg} />}
          <span className={styles.check} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        <div className={styles.body}>
          <p className={styles.eyebrow}>Added to bag{quantity > 1 && ` · ×${quantity}`}</p>
          <p className={styles.name}>{item.name}</p>
          <p className={styles.meta}>
            {[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")}
          </p>
          <Link href="/cart" className={styles.cta} onClick={leave}>
            View bag
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <button type="button" className={styles.close} aria-label="Dismiss" onClick={leave}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <span className={styles.timer} aria-hidden="true" onAnimationEnd={leave} />
      </div>
    </div>
  );
}
