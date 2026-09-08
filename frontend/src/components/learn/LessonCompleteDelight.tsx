"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { playLessonCompleteFanfare } from "@/lib/feedback-sfx";
import { AnimatedNumber, motion, softSpring, springPop } from "@/lib/motion";

const COACH_LINES = [
  "You crushed it!",
  "Lesson legend!",
  "That streak energy!",
  "Owl-mazing work!",
];

const CONFETTI = [
  { x: -150, y: -120, r: -170, color: "var(--duo-yellow)", delay: 0 },
  { x: -105, y: -175, r: 130, color: "var(--duo-green)", delay: 0.04 },
  { x: -48, y: -145, r: -120, color: "var(--duo-blue)", delay: 0.08 },
  { x: 22, y: -175, r: 190, color: "var(--duo-yellow)", delay: 0.02 },
  { x: 82, y: -142, r: -145, color: "var(--duo-green)", delay: 0.1 },
  { x: 145, y: -95, r: 160, color: "var(--duo-blue)", delay: 0.06 },
  { x: -160, y: -35, r: 125, color: "var(--duo-yellow)", delay: 0.12 },
  { x: 160, y: -20, r: -180, color: "var(--duo-green)", delay: 0.05 },
  { x: -135, y: 65, r: 155, color: "var(--duo-blue)", delay: 0.14 },
  { x: 130, y: 75, r: -135, color: "var(--duo-yellow)", delay: 0.09 },
  { x: -72, y: 115, r: 180, color: "var(--duo-green)", delay: 0.11 },
  { x: 70, y: 125, r: -160, color: "var(--duo-blue)", delay: 0.03 },
  { x: -40, y: -200, r: 90, color: "#ff9600", delay: 0.07 },
  { x: 55, y: -190, r: -100, color: "#ce82ff", delay: 0.13 },
  { x: -180, y: 20, r: 140, color: "#ff4b4b", delay: 0.15 },
  { x: 175, y: 40, r: -150, color: "#1cb0f6", delay: 0.01 },
  { x: 0, y: -210, r: 20, color: "var(--duo-yellow)", delay: 0.16 },
  { x: -90, y: 140, r: -80, color: "var(--duo-green)", delay: 0.18 },
  { x: 95, y: 150, r: 110, color: "var(--duo-blue)", delay: 0.17 },
  { x: 10, y: 160, r: -40, color: "#ffc800", delay: 0.19 },
];

function ConfettiBurst() {
  const reduce = useReducedMotion();
  return (
    <div className="lesson-celebration" data-testid="lesson-celebration" aria-hidden>
      {CONFETTI.map((piece, index) => (
        <motion.span
          key={index}
          className="celebration-piece"
          style={{ background: piece.color }}
          initial={reduce ? false : { opacity: 1, x: 0, y: 0, rotate: 0, scale: 0.4 }}
          animate={
            reduce
              ? { opacity: 0.85 }
              : {
                  opacity: [1, 1, 0],
                  x: piece.x,
                  y: piece.y,
                  rotate: piece.r,
                  scale: [0.4, 1.15, 0.9],
                }
          }
          transition={{ duration: 1.35, delay: piece.delay, ease: [0.15, 0.8, 0.25, 1] }}
        />
      ))}
    </div>
  );
}

function CoachMascot({ line }: { line: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="complete-coach"
      data-testid="complete-coach"
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springPop}
    >
      <motion.div
        className="complete-coach-owl"
        aria-hidden
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      >
        <span className="complete-coach-face">🦉</span>
        <span className="complete-coach-spark" aria-hidden>✨</span>
      </motion.div>
      <motion.p
        className="complete-coach-bubble"
        initial={reduce ? false : { opacity: 0, x: -10, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ ...softSpring, delay: 0.2 }}
      >
        {line}
      </motion.p>
    </motion.div>
  );
}

function XpBump({ value, saved }: { value: number; saved: boolean }) {
  const reduce = useReducedMotion();
  const label = saved ? "XP saved" : `${value} XP earned`;
  return (
    <motion.div
      className="xp-bump"
      data-testid="xp-rollup"
      aria-label={label}
      initial={reduce ? false : { opacity: 0, scale: 0.7, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...springPop, delay: 0.25 }}
    >
      <motion.span
        className="xp-bump-bolt"
        aria-hidden
        animate={reduce ? undefined : { rotate: [0, -12, 10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 0.7, delay: 0.35 }}
      >
        ⚡
      </motion.span>
      <div className="xp-bump-copy">
        {saved ? (
          <strong>XP saved</strong>
        ) : (
          <>
            <strong className="xp-bump-value">
              +<AnimatedNumber value={value} /> XP
            </strong>
            <span>Nice work</span>
          </>
        )}
      </div>
      {!saved && !reduce && (
        <motion.span
          className="xp-bump-ring"
          aria-hidden
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: 1.45, opacity: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
}

/** Lesson-complete delight: confetti, coach line, and XP bump. */
export function LessonCompleteDelight({
  xp,
  hearts,
  saved,
}: {
  xp: number;
  hearts: number | null;
  saved: boolean;
}) {
  const reduce = useReducedMotion();
  const line = COACH_LINES[Math.abs(Math.round(xp)) % COACH_LINES.length];

  useEffect(() => {
    playLessonCompleteFanfare();
  }, []);

  return (
    <div className="lesson-complete-delight" data-testid="lesson-complete-delight">
      <ConfettiBurst />
      <motion.div
        className="modal-art celebration-trophy"
        initial={reduce ? false : { scale: 0.35, y: 36, rotate: -14 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        transition={springPop}
        aria-hidden
      >
        🏆
      </motion.div>
      <CoachMascot line={line} />
      <motion.h1
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...softSpring, delay: 0.12 }}
      >
        Lesson complete!
      </motion.h1>
      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        You’re one step closer. Keep that momentum going!
      </motion.p>
      <div className="result-summary result-summary-delight">
        <XpBump value={xp} saved={saved} />
        <motion.span
          className="hearts-kept"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...softSpring, delay: 0.35 }}
        >
          ♥ <AnimatedNumber value={hearts} /> hearts
        </motion.span>
      </div>
      <p className="muted">Your progress is saved. Rewards may take a moment to update.</p>
      <Link className="action-button" href="/">Back to the path</Link>
    </div>
  );
}
