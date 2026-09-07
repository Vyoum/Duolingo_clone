"use client";
import Link from "next/link";
import { useApi, type Course } from "@/lib/api";

export function LearningPath() {
  const { data, error, reload } = useApi<Course>("path");
  if (error) return <div className="learning-message" role="alert"><p>{error}</p><button className="action-button" onClick={reload}>Try again</button></div>;
  if (!data) return <p className="learning-message" role="status">Loading your learning path…</p>;
  let index = 0;
  const complete = data.units.every(u => u.skills.every(s => s.lessons.every(l => l.completed)));
  return <div className="learning-path">
    <div className="path-intro"><span>YOUR DAILY DOSE OF SPANISH</span><h1>A little every day.<br />A world of possibility.</h1><p>Build your confidence, one lesson at a time.</p></div>
    {complete && <div className="duo-card learning-message">🏆 Course complete! Revisit any lesson for 5 practice XP.</div>}
    {data.units.map((unit, unitIndex) => <section key={unit.id} aria-labelledby={`unit-${unit.id}`}>
      <div className={`unit-banner unit-${unitIndex % 2}`}><div><p>SECTION 1 · UNIT {unitIndex + 1}</p><h2 id={`unit-${unit.id}`}>{unit.title}</h2></div><span aria-hidden="true">{unitIndex === 0 ? "☀" : "✈"}</span></div>
      <div className="path-track">{unit.skills.map(skill => <div key={skill.id} className="skill-group">
        {skill.lessons.map((lesson, li) => {
          const offset = [0, -56, -80, -40, 35, 75][index++ % 6];
          return <div key={lesson.id} className="path-stop" style={{ transform: `translateX(${offset}px)` }}>
            {lesson.unlocked && !lesson.completed && <span className="start-bubble">START</span>}
            <div className="node-ring" style={{ background: `conic-gradient(var(--duo-yellow) ${skill.crowns / skill.lessons.length * 360}deg, var(--duo-border) 0deg)` }}>
              {lesson.unlocked ? <Link href={`/lesson/${lesson.id}`} className={`path-node ${lesson.completed ? "done" : "ready"}`} aria-label={`${skill.title}, lesson ${li + 1}${lesson.completed ? ", completed, practice again" : ", start"}`}>{lesson.completed ? "♛" : "★"}</Link> : <button className="path-node locked" disabled aria-label={`${skill.title}, lesson ${li + 1}, locked`}>🔒</button>}
            </div>
            <p>{skill.title}{skill.lessons.length > 1 ? ` ${li + 1}` : ""}</p><small>{lesson.completed ? "COMPLETE" : lesson.unlocked ? `${lesson.xp_reward} XP` : "LOCKED"}</small>
          </div>;
        })}
      </div>)}</div>
    </section>)}
    <div className="path-finish"><span aria-hidden="true">🏆</span><p>Great things start with a small step.</p></div>
  </div>;
}
