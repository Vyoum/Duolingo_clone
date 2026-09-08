"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { useApi, type Course, type LessonNode } from "@/lib/api";
import { motion, softSpring, springPop } from "@/lib/motion";
import { showToast } from "@/lib/toast";
import { PathScenery, TreasureChest } from "./PathScenery";

/** Center → left → center → right so even nodes line up with the first. */
const PATH_X = [0, -62, -96, -62, 0, 62, 96, 62];

const CONNECTOR_W = 220;
const CONNECTOR_H = 32;

const UNIT_THEMES = [
  { bg: "#17afe9", edge: "#1494c9", mist: "#c1edff", soft: "#d7f3ff" },
  { bg: "#cc348d", edge: "#a42370", mist: "#ffd1ec", soft: "#ffe4f3" },
  { bg: "#2b6e4f", edge: "#1d4d37", mist: "#b8f0d0", soft: "#d7f7e6" },
];

const SKILL_GLYPH: Record<string, string> = {
  wave: "👋",
  apple: "🍎",
  plane: "✈️",
  people: "👨‍👩‍👧",
  hash: "#",
};

type LessonStop = {
  kind: "lesson";
  skill: Course["units"][number]["skills"][number];
  lesson: LessonNode;
  li: number;
  globalIndex: number;
};

type ChestStop = {
  kind: "chest";
  id: string;
  unlocked: boolean;
  globalIndex: number;
};

type PathStop = LessonStop | ChestStop;

function connectorD(fromX: number, toX: number) {
  const cx = CONNECTOR_W / 2;
  const x1 = cx + fromX;
  const x2 = cx + toX;
  const mid = CONNECTOR_H / 2;
  return `M ${x1} 2 C ${x1} ${mid + 4}, ${x2} ${mid - 4}, ${x2} ${CONNECTOR_H - 2}`;
}

function unitSubtitle(unit: Course["units"][number]) {
  const names = unit.skills.map((s) => s.title);
  if (names.length === 0) return "Keep going";
  if (names.length <= 3) return names.join(" · ");
  return `${names.slice(0, 2).join(" · ")} · +${names.length - 2} more`;
}

function buildStops(data: Course): { units: { unit: Course["units"][number]; unitIndex: number; stops: PathStop[] }[]; flat: PathStop[] } {
  let globalIndex = 0;
  const units = data.units.map((unit, unitIndex) => {
    const stops: PathStop[] = [];
    unit.skills.forEach((skill) => {
      skill.lessons.forEach((lesson, li) => {
        stops.push({ kind: "lesson", skill, lesson, li, globalIndex: globalIndex++ });
      });
      // A chest closes out every skill, including the last one in the unit, so
      // short units still have enough stops to wind down the page.
      const prev = skill.lessons[skill.lessons.length - 1];
      stops.push({
        kind: "chest",
        id: `chest-${skill.id}`,
        unlocked: Boolean(prev?.completed),
        globalIndex: globalIndex++,
      });
    });
    return { unit, unitIndex, stops };
  });
  return { units, flat: units.flatMap((u) => u.stops) };
}

function PathOwl({ side }: { side: "left" | "right" }) {
  return (
    <div className={`path-owl path-owl-${side}`} aria-hidden>
      <svg viewBox="0 0 72 72" width="64" height="64">
        <ellipse cx="36" cy="40" rx="22" ry="24" fill="#58CC02" />
        <ellipse cx="36" cy="42" rx="14" ry="15" fill="#89E219" />
        <circle cx="28" cy="34" r="8" fill="white" />
        <circle cx="44" cy="34" r="8" fill="white" />
        <circle cx="29" cy="35" r="3.2" fill="#131F24" />
        <circle cx="45" cy="35" r="3.2" fill="#131F24" />
        <path d="M36 40l-4 5h8l-4-5Z" fill="#FF9600" />
        <path d="M18 22c6-10 14-12 18-8 4-4 12-2 18 8-7 2-12 4-18 4s-11-2-18-4Z" fill="#58CC02" />
      </svg>
    </div>
  );
}

export function LearningPath() {
  const { data, error, reload } = useApi<Course>("path");
  const reduce = useReducedMotion();
  const [activeUnit, setActiveUnit] = useState(0);
  const [currentInView, setCurrentInView] = useState(true);
  const currentRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const bannerRef = useRef<HTMLDivElement | null>(null);

  const built = useMemo(() => (data ? buildStops(data) : null), [data]);

  const currentLessonId = useMemo(() => {
    if (!built) return null;
    const hit = built.flat.find(
      (s) => s.kind === "lesson" && s.lesson.unlocked && !s.lesson.completed,
    );
    return hit && hit.kind === "lesson" ? hit.lesson.id : null;
  }, [built]);

  useEffect(() => {
    if (!built) return;
    const nodes = sectionRefs.current.filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    let frame = 0;
    const update = () => {
      if (!bannerRef.current?.getClientRects().length) return;
      const boundary = bannerRef.current.getBoundingClientRect().bottom + 60;
      let next = 0;
      nodes.forEach((node, index) => {
        if (node.getBoundingClientRect().top <= boundary) next = index;
      });
      setActiveUnit(next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    nodes.forEach(node => observer.observe(node));
    if (bannerRef.current) observer.observe(bannerRef.current);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [built]);

  useEffect(() => {
    const el = currentRef.current;
    if (!el) {
      setCurrentInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setCurrentInView(entry.isIntersecting),
      { rootMargin: "-20% 0px -35% 0px", threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [currentLessonId, built]);

  if (error) {
    return (
      <div className="learning-message" role="alert">
        <p>{error}</p>
        <button className="action-button" onClick={reload}>
          Try again
        </button>
      </div>
    );
  }
  if (!data || !built) {
    return (
      <p className="learning-message" role="status">
        Loading your learning path…
      </p>
    );
  }

  if (built.units.length === 0) {
    return <p className="learning-message" role="status">Your course is being prepared. Check back soon.</p>;
  }

  const complete = data.units.every((u) =>
    u.skills.every((s) => s.lessons.every((l) => l.completed)),
  );
  const theme = UNIT_THEMES[activeUnit % UNIT_THEMES.length];
  const activeMeta = built.units[activeUnit] ?? built.units[0];
  const doneInUnit = activeMeta.stops.filter(
    (s) => s.kind === "lesson" && s.lesson.completed,
  ).length;
  const totalInUnit = activeMeta.stops.filter((s) => s.kind === "lesson").length;

  return (
    <div className="learning-path">
      <div
        ref={bannerRef}
        className="path-sticky-bar"
        style={{
          background: theme.bg,
          "--unit-edge": theme.edge,
        } as CSSProperties}
      >
        <div className="path-sticky-copy">
          <p style={{ color: theme.mist }}>
            <span aria-hidden>← </span> SECTION 1, UNIT {activeUnit + 1}
          </p>
          <h2 style={{ color: "#fff" }}>{activeMeta.unit.title}</h2>
          <p className="unit-subtitle sr-only" style={{ color: theme.soft }}>
            {unitSubtitle(activeMeta.unit)}
            {totalInUnit > 0 ? ` · ${doneInUnit}/${totalInUnit} completed` : ""}
          </p>
        </div>
        <button
          type="button"
          className="guidebook-btn"
          onClick={() => showToast("Guidebook — Coming soon")}
        >
          <span aria-hidden>▤</span> GUIDEBOOK
        </button>
      </div>

      {complete && (
        <div className="duo-card learning-message">
          🏆 Course complete! Revisit any lesson for 5 practice XP.
        </div>
      )}

      {built.units.map(({ unit, unitIndex, stops }) => (
        <section
          key={unit.id}
          data-unit-index={unitIndex}
          ref={(el) => {
            sectionRefs.current[unitIndex] = el;
          }}
          aria-label={`Unit ${unitIndex + 1}: ${unit.title}`}
          className="path-unit"
          style={{
            "--unit-color": UNIT_THEMES[unitIndex % UNIT_THEMES.length].bg,
            "--unit-edge": UNIT_THEMES[unitIndex % UNIT_THEMES.length].edge,
          } as CSSProperties}
        >
          <div className="path-unit-sentinel" aria-hidden />
          {unitIndex > 0 && <h3 className="unit-boundary"><span>{unit.title}</span></h3>}
          <div className="path-track">
            <PathScenery />
            {/* Skip the final tennis character so the last unit doesn't end with another racket duo. */}
            {unitIndex < built.units.length - 1 && <PathScenery tennis />}
            {stops.map((stop, stopLocal) => {
              const offset = PATH_X[stop.globalIndex % PATH_X.length];
              const next = stops[stopLocal + 1];
              const nextOffset = next
                ? PATH_X[next.globalIndex % PATH_X.length]
                : null;
              const owlSide = offset <= 0 ? "right" : "left";

              if (stop.kind === "chest") {
                return (
                  <div key={stop.id} className="path-stop-wrap">
                    <motion.div
                      className="path-stop"
                      style={{ x: offset }}
                      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={softSpring}
                    >
                      <button
                        type="button"
                        className={`path-chest ${stop.unlocked ? "openable" : "locked"}`}
                        disabled={!stop.unlocked}
                        aria-label={
                          stop.unlocked
                            ? "Treasure chest, open"
                            : "Treasure chest, locked"
                        }
                        onClick={() =>
                          showToast(
                            stop.unlocked
                              ? "Chest reward — Coming soon"
                              : "Finish the lessons above to open this chest",
                          )
                        }
                      >
                        <TreasureChest />
                      </button>
                      <p className="path-label-muted">Chest</p>
                    </motion.div>
                    {nextOffset !== null && (
                      <Connector from={offset} to={nextOffset} />
                    )}
                  </div>
                );
              }

              const { skill, lesson, li } = stop;
              const isCurrent = lesson.id === currentLessonId;
              const crowns = skill.crowns;
              const crownShare = skill.lessons.length
                ? crowns / skill.lessons.length
                : 0;
              const glyph =
                SKILL_GLYPH[skill.icon] ?? (lesson.completed ? "✓" : "★");
              const showLabel = isCurrent || li === 0;

              return (
                <div key={lesson.id} className="path-stop-wrap">
                  <motion.div
                    ref={isCurrent ? currentRef : undefined}
                    className={`path-stop ${isCurrent ? "is-current" : ""}`}
                    style={{ x: offset }}
                    initial={reduce ? false : { opacity: 0, y: 20, scale: 0.86 }}
                    whileInView={
                      reduce ? undefined : { opacity: 1, y: 0, scale: 1 }
                    }
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      ...softSpring,
                      delay: Math.min(stop.globalIndex * 0.03, 0.28),
                    }}
                  >
                    {isCurrent && <PathOwl side={owlSide} />}
                    {isCurrent && (
                      <motion.span
                        className="start-bubble"
                        initial={reduce ? false : { opacity: 0, y: 8, scale: 0.8 }}
                        animate={
                          reduce
                            ? undefined
                            : { opacity: 1, y: [0, -4, 0], scale: 1 }
                        }
                        transition={{
                          ...softSpring,
                          delay: 0.15,
                          y: {
                            repeat: Infinity,
                            duration: 1.8,
                            ease: "easeInOut",
                          },
                        }}
                      >
                        START
                      </motion.span>
                    )}
                    <motion.div
                      className="node-ring"
                      style={{
                        background: isCurrent ? `conic-gradient(var(--unit-color) ${crownShare * 360}deg, var(--duo-border) 0deg)` : "transparent",
                      }}
                    >
                      {lesson.unlocked ? (
                        <motion.div
                          whileHover={
                            reduce ? undefined : { y: -3, scale: 1.04 }
                          }
                          whileTap={reduce ? undefined : { scale: 0.94 }}
                          transition={springPop}
                        >
                          <Link
                            href={`/lesson/${lesson.id}`}
                            className={`path-node ${lesson.completed ? "done" : isCurrent ? "ready current" : "ready"}`}
                            aria-label={`${skill.title}, lesson ${li + 1}${lesson.completed ? ", completed, practice again" : ", start"}`}
                          >
                            {lesson.completed ? (
                              <span className="path-check" aria-hidden>
                                ✓
                              </span>
                            ) : (
                              <motion.span
                                aria-hidden
                                animate={
                                  reduce || !isCurrent
                                    ? undefined
                                    : { scale: [1, 1.12, 1] }
                                }
                                transition={{
                                  duration: 1.6,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                {glyph}
                              </motion.span>
                            )}
                          </Link>
                        </motion.div>
                      ) : (
                        <button
                          className="path-node locked"
                          disabled
                          aria-label={`${skill.title}, lesson ${li + 1}, locked`}
                        >
                          🔒
                        </button>
                      )}
                    </motion.div>
                    {showLabel && (
                      <>
                        <p>
                          {skill.title}
                          {skill.lessons.length > 1 ? ` ${li + 1}` : ""}
                        </p>
                        <small>
                          {lesson.completed
                            ? "COMPLETE"
                            : lesson.unlocked
                              ? `${lesson.xp_reward} XP`
                              : "LOCKED"}
                        </small>
                      </>
                    )}
                  </motion.div>
                  {nextOffset !== null && (
                    <Connector from={offset} to={nextOffset} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {!currentInView && currentLessonId && (
        <button
          type="button"
          className="jump-here-btn"
          onClick={() =>
            currentRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
          }
        >
          JUMP HERE
        </button>
      )}

      <div className="path-finish">
        <span aria-hidden="true">🏆</span>
        <p>Great things start with a small step.</p>
      </div>
    </div>
  );
}

function Connector({ from, to }: { from: number; to: number }) {
  return (
    <svg
      className="path-connector"
      width={CONNECTOR_W}
      height={CONNECTOR_H}
      viewBox={`0 0 ${CONNECTOR_W} ${CONNECTOR_H}`}
      aria-hidden
    >
      <path
        d={connectorD(from, to)}
        fill="none"
        stroke="var(--duo-path-line)"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
