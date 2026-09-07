"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useApi, type Course } from "@/lib/api";
import { motion, softSpring, springPop } from "@/lib/motion";

/** Gentle S-curve offsets (px) — left / center / right alternation. */
const PATH_X = [0, -58, -78, -42, 0, 42, 78, 58];

const CONNECTOR_W = 220;
const CONNECTOR_H = 36;

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

export function LearningPath() {
  const { data, error, reload } = useApi<Course>("path");
  const reduce = useReducedMotion();
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
  if (!data) {
    return (
      <p className="learning-message" role="status">
        Loading your learning path…
      </p>
    );
  }

  let index = 0;
  const complete = data.units.every((u) =>
    u.skills.every((s) => s.lessons.every((l) => l.completed)),
  );

  return (
    <div className="learning-path">
      {complete && (
        <div className="duo-card learning-message">
          🏆 Course complete! Revisit any lesson for 5 practice XP.
        </div>
      )}
      {data.units.map((unit, unitIndex) => {
        const stops = unit.skills.flatMap((skill) =>
          skill.lessons.map((lesson, li) => ({ skill, lesson, li })),
        );
        return (
          <section key={unit.id} aria-labelledby={`unit-${unit.id}`}>
            <header className={`unit-banner unit-${unitIndex % 2}`}>
              <div>
                <p>
                  SECTION 1 · UNIT {unitIndex + 1}
                </p>
                <h2 id={`unit-${unit.id}`}>{unit.title}</h2>
                <p className="unit-subtitle">{unitSubtitle(unit)}</p>
              </div>
              <span aria-hidden="true">{unitIndex === 0 ? "☀" : "✈"}</span>
            </header>

            <div className="path-track">
              {stops.map(({ skill, lesson, li }, stopLocal) => {
                const stopIndex = index++;
                const offset = PATH_X[stopIndex % PATH_X.length];
                const nextOffset =
                  stopLocal < stops.length - 1
                    ? PATH_X[(stopIndex + 1) % PATH_X.length]
                    : null;
                const crowns = skill.crowns;
                const crownShare = skill.lessons.length
                  ? crowns / skill.lessons.length
                  : 0;

                return (
                  <div key={lesson.id} className="path-stop-wrap">
                    <motion.div
                      className="path-stop"
                      style={{ x: offset }}
                      initial={reduce ? false : { opacity: 0, y: 20, scale: 0.86 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{
                        ...softSpring,
                        delay: Math.min(stopIndex * 0.035, 0.3),
                      }}
                    >
                      {lesson.unlocked && !lesson.completed && (
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
                            delay: 0.2,
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
                          background: `conic-gradient(var(--duo-yellow) ${crownShare * 360}deg, var(--duo-border) 0deg)`,
                        }}
                        animate={
                          reduce || crowns === 0
                            ? undefined
                            : { scale: [1, 1.06, 1] }
                        }
                        transition={{ duration: 0.55, delay: 0.15 }}
                      >
                        {lesson.unlocked ? (
                          <motion.div
                            whileHover={reduce ? undefined : { y: -3, scale: 1.04 }}
                            whileTap={reduce ? undefined : { scale: 0.94 }}
                            transition={springPop}
                          >
                            <Link
                              href={`/lesson/${lesson.id}`}
                              className={`path-node ${lesson.completed ? "done" : "ready"}`}
                              aria-label={`${skill.title}, lesson ${li + 1}${lesson.completed ? ", completed, practice again" : ", start"}`}
                            >
                              {lesson.completed ? (
                                <motion.span
                                  className="path-check"
                                  aria-hidden
                                  initial={
                                    reduce
                                      ? false
                                      : { scale: 0.4, rotate: -20, opacity: 0 }
                                  }
                                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                  transition={springPop}
                                >
                                  ✓
                                </motion.span>
                              ) : (
                                <motion.span
                                  aria-hidden
                                  animate={
                                    reduce
                                      ? undefined
                                      : { scale: [1, 1.12, 1] }
                                  }
                                  transition={{
                                    duration: 1.6,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                >
                                  ★
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
                    </motion.div>

                    {nextOffset !== null && (
                      <svg
                        className="path-connector"
                        width={CONNECTOR_W}
                        height={CONNECTOR_H}
                        viewBox={`0 0 ${CONNECTOR_W} ${CONNECTOR_H}`}
                        aria-hidden
                      >
                        <path
                          d={connectorD(offset, nextOffset)}
                          fill="none"
                          stroke="var(--duo-path-line)"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      <div className="path-finish">
        <span aria-hidden="true">🏆</span>
        <p>Great things start with a small step.</p>
      </div>
    </div>
  );
}
