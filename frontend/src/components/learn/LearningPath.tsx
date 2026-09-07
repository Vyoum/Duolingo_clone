"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useApi, type Course } from "@/lib/api";
import { entrance, motion, softSpring, springPop } from "@/lib/motion";

export function LearningPath() {
  const { data, error, reload } = useApi<Course>("path");
  const reduce = useReducedMotion();
  if (error) return <div className="learning-message" role="alert"><p>{error}</p><button className="action-button" onClick={reload}>Try again</button></div>;
  if (!data) return <p className="learning-message" role="status">Loading your learning path…</p>;
  let index = 0;
  const complete = data.units.every(u => u.skills.every(s => s.lessons.every(l => l.completed)));
  return <div className="learning-path">
    <motion.div className="path-intro" {...(reduce ? {} : entrance(0))}>
      <span>YOUR DAILY DOSE OF SPANISH</span>
      <h1>A little every day.<br />A world of possibility.</h1>
      <p>Build your confidence, one lesson at a time.</p>
    </motion.div>
    {complete && <div className="duo-card learning-message">🏆 Course complete! Revisit any lesson for 5 practice XP.</div>}
    {data.units.map((unit, unitIndex) => <section key={unit.id} aria-labelledby={`unit-${unit.id}`}>
      <div className={`unit-banner unit-${unitIndex % 2}`}><div><p>SECTION 1 · UNIT {unitIndex + 1}</p><h2 id={`unit-${unit.id}`}>{unit.title}</h2></div><span aria-hidden="true">{unitIndex === 0 ? "☀" : "✈"}</span></div>
      <div className="path-track">{unit.skills.map(skill => <div key={skill.id} className="skill-group">
        {skill.lessons.map((lesson, li) => {
          const stopIndex = index++;
          const offset = [0, -56, -80, -40, 35, 75][stopIndex % 6];
          const crowns = skill.crowns;
          const crownShare = skill.lessons.length ? crowns / skill.lessons.length : 0;
          return (
            <motion.div
              key={lesson.id}
              className="path-stop"
              style={{ x: offset }}
              initial={reduce ? false : { opacity: 0, y: 28, scale: 0.82 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ ...softSpring, delay: Math.min(stopIndex * 0.04, 0.35) }}
            >
              {lesson.unlocked && !lesson.completed && (
                <motion.span
                  className="start-bubble"
                  initial={reduce ? false : { opacity: 0, y: 8, scale: 0.8 }}
                  animate={reduce ? undefined : { opacity: 1, y: [0, -4, 0], scale: 1 }}
                  transition={{ ...softSpring, delay: 0.2, y: { repeat: Infinity, duration: 1.8, ease: "easeInOut" } }}
                >
                  START
                </motion.span>
              )}
              <motion.div
                className="node-ring"
                style={{ background: `conic-gradient(var(--duo-yellow) ${crownShare * 360}deg, var(--duo-border) 0deg)` }}
                animate={reduce || crowns === 0 ? undefined : { scale: [1, 1.06, 1] }}
                transition={{ duration: 0.55, delay: 0.15 }}
              >
                {lesson.unlocked ? (
                  <motion.div
                    whileHover={reduce ? undefined : { y: -4, scale: 1.05 }}
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
                          initial={reduce ? false : { scale: 0.4, rotate: -20, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          transition={springPop}
                        >
                          ✓
                        </motion.span>
                      ) : (
                        <motion.span
                          aria-hidden
                          animate={reduce ? undefined : { scale: [1, 1.12, 1] }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        >
                          ★
                        </motion.span>
                      )}
                    </Link>
                  </motion.div>
                ) : (
                  <button className="path-node locked" disabled aria-label={`${skill.title}, lesson ${li + 1}, locked`}>🔒</button>
                )}
              </motion.div>
              <p>{skill.title}{skill.lessons.length > 1 ? ` ${li + 1}` : ""}</p>
              <small>{lesson.completed ? "COMPLETE" : lesson.unlocked ? `${lesson.xp_reward} XP` : "LOCKED"}</small>
            </motion.div>
          );
        })}
      </div>)}</div>
    </section>)}
    <div className="path-finish"><span aria-hidden="true">🏆</span><p>Great things start with a small step.</p></div>
  </div>;
}
