"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, type Payload } from "@/lib/api";

type Session = { id: string; position: number; status: string; deadline: string; xp_reward: number; lesson: { exercises: { id: string; payload: Payload }[] } };
type Result = { correct: boolean; expected?: string; timeout: boolean; completed: boolean; xp_earned: number; position: number };

function secondsUntil(deadline: string) { return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)); }

export function LegendaryPractice() {
  const [duration, setDuration] = useState(90);
  const [session, setSession] = useState<Session | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [answer, setAnswer] = useState<string | number | string[]>("");
  const [feedback, setFeedback] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef<{ key: string; body: { exercise_id: string; answer: string | number | string[] } } | null>(null);
  const timingOut = useRef(false);
  const exercise = session?.lesson.exercises[session.position];
  const payload = exercise?.payload;

  useEffect(() => {
    if (!session || session.status !== "active") return;
    const update = () => setSeconds(secondsUntil(session.deadline));
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (!session || !exercise || seconds || timingOut.current || session.status !== "active") return;
    timingOut.current = true;
    void submit("");
  // `seconds` is intentionally the trigger; submit uses the current exercise snapshot.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, session, exercise]);

  async function start() {
    setBusy(true); setError("");
    try {
      const value = await api<Session>("practice/legendary", { duration_seconds: duration }, crypto.randomUUID());
      timingOut.current = false; setSession(value); setSeconds(secondsUntil(value.deadline)); setAnswer(""); setFeedback(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not start Legendary practice."); }
    finally { setBusy(false); }
  }

  async function submit(value: string | number | string[] = answer) {
    if (!session || !exercise || busy) return;
    setBusy(true); setError("");
    if (!pending.current) pending.current = { key: crypto.randomUUID(), body: { exercise_id: exercise.id, answer: value } };
    try {
      const result = await api<Result>(`practice/legendary/${session.id}/answers`, pending.current.body, pending.current.key);
      pending.current = null;
      setFeedback(result);
      if (result.timeout || result.completed) setSession(current => current ? { ...current, status: result.timeout ? "timed_out" : "completed", position: result.position } : current);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your answer."); }
    finally { setBusy(false); }
  }

  function next() {
    if (!session || !feedback) return;
    if (feedback.completed || feedback.timeout) return;
    if (!feedback.correct) { setFeedback(null); setAnswer(""); return; }
    setSession({ ...session, position: feedback.position }); setFeedback(null); setAnswer("");
  }

  if (!session) return <main className="legendary-player"><section className="legendary-intro"><div className="modal-art">🏆</div><h1>Legendary practice</h1><p>Race through seeded Spanish exercises. Finish every answer before time expires to earn 15 XP.</p><label>Time limit<select aria-label="Legendary time limit" value={duration} onChange={e => setDuration(Number(e.target.value))}><option value={60}>1 minute</option><option value={90}>90 seconds</option><option value={120}>2 minutes</option></select></label>{error && <p role="alert">{error}</p>}<button className="action-button" disabled={busy} onClick={() => void start()}>{busy ? "Starting…" : "Start Legendary"}</button><Link className="secondary-action" href="/practice">Back to Practice</Link></section></main>;

  if (session.status !== "active") return <main className="legendary-player"><section className="legendary-intro" role="dialog"><div className="modal-art">{session.status === "completed" ? "🏆" : "⌛"}</div><h1>{session.status === "completed" ? "Legendary complete!" : "Time’s up"}</h1><p>{session.status === "completed" ? `You earned ${feedback?.xp_earned ?? session.xp_reward} XP.` : "This run did not earn XP. Try again with a little more time."}</p><button className="action-button" onClick={() => { setSession(null); setFeedback(null); pending.current = null; }}>Practice again</button><Link className="secondary-action" href="/">Back to the path</Link></section></main>;

  const ready = payload?.type === "translate" ? Array.isArray(answer) && answer.length > 0 : typeof answer === "number" || (typeof answer === "string" && answer.trim().length > 0);
  return <main className="legendary-player"><header className="lesson-header"><Link href="/practice" className="exit-button" aria-label="Exit Legendary practice">✕</Link><progress aria-label="Legendary progress" max={session.lesson.exercises.length} value={session.position} /><strong className={seconds <= 10 ? "legendary-urgent" : ""} aria-label={`${seconds} seconds remaining`}>⏱ {seconds}s</strong></header><section className="exercise-area"><p className="exercise-eyebrow">LEGENDARY · {session.position + 1} OF {session.lesson.exercises.length}</p><h1>{payload?.prompt}</h1>{payload?.type === "multiple_choice" || (payload?.type === "fill_blank" && payload.options) ? <div className="answer-options">{payload.options!.map((option, index) => <button key={option} className={`answer-option ${answer === (payload.type === "multiple_choice" ? index : option) ? "selected" : ""}`} onClick={() => setAnswer(payload.type === "multiple_choice" ? index : option)}>{option}</button>)}</div> : payload?.type === "translate" ? <><div className="token-answer">{Array.isArray(answer) && answer.map((word, index) => <button key={`${word}-${index}`} className="word-token selected" onClick={() => setAnswer(answer.filter((_, i) => i !== index))}>{word}</button>)}</div><div className="token-bank">{payload.tokens?.map(word => <button key={word} className="word-token" disabled={Array.isArray(answer) && answer.includes(word)} onClick={() => setAnswer([...(Array.isArray(answer) ? answer : []), word])}>{word}</button>)}</div></> : <textarea aria-label="Legendary answer" value={typeof answer === "string" ? answer : ""} onChange={e => setAnswer(e.target.value)} placeholder="Type your answer…" />}{error && <p role="alert">{error}</p>}</section><footer className={`feedback-bar ${feedback ? `feedback-visible ${feedback.correct ? "correct" : "incorrect"}` : ""}`}>{feedback && <div role="status"><h2>{feedback.correct ? "✓ Correct!" : "Try again"}</h2>{!feedback.correct && !feedback.timeout && <p>Correct answer: <strong>{feedback.expected}</strong></p>}</div>}<button className="action-button" disabled={!feedback && (!ready || busy)} onClick={() => feedback ? next() : void submit()}>{busy ? "Saving…" : error ? "Retry saving answer" : feedback ? (feedback.correct ? "Continue" : "Try again") : "Check"}</button></footer></main>;
}
