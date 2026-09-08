"use client";

import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Transition,
} from "framer-motion";

export const springPop: Transition = { type: "spring", stiffness: 420, damping: 22, mass: 0.7 };
export const softSpring: Transition = { type: "spring", stiffness: 280, damping: 26 };
export const slideUp: Transition = { type: "spring", stiffness: 380, damping: 32 };

/** Shared fade/slide used when reduced motion is off. */
export function entrance(delay = 0) {
  return {
    initial: { opacity: 0, y: 18, scale: 0.92 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { ...softSpring, delay },
  };
}

/** Count a number up/down with tabular digits. Respects reduced motion. */
export function AnimatedNumber({
  value,
  className,
  fallback = "…",
}: {
  value: number | null | undefined;
  className?: string;
  fallback?: string;
}) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(value ?? 0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(value == null ? fallback : String(Math.round(value)));

  useEffect(() => {
    if (value == null) {
      return;
    }
    if (reduce) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 0.55,
      ease: [0.2, 0.8, 0.2, 1],
    });
    const unsub = rounded.on("change", (latest) => setDisplay(String(latest)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [fallback, motionValue, reduce, rounded, value]);

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {value == null ? fallback : reduce ? String(Math.round(value)) : display}
    </span>
  );
}

export { motion };
