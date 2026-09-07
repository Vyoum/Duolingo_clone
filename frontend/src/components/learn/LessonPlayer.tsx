"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, ApiError, type Attempt, type Feedback, type Learner } from "@/lib/api";

type Answer = string | number | string[] | Record<string, string>;

function Modal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="lesson-modal" onCancel={e => e.preventDefault()}>{children}</dialog>;
}

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [hearts, setHearts] = useState<number | null>(null);
  const [answer, setAnswer] = useState<Answer>("");
  const [tokens, setTokens] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [modal, setModal] = useState<"complete" | "hearts" | "exit" | null>(null);
  const [retry, setRetry] = useState(0);
  const pending = useRef<{ key: string; body: { exercise_id: string; answer: Answer } } | null>(null);
  const submitting = useRef(false);
  const storageKey = `lesson-start:${lessonId}`;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let key = sessionStorage.getItem(storageKey);
        if (!key) { key = crypto.randomUUID(); sessionStorage.setItem(storageKey, key); }
        const [loaded, learner] = await Promise.all([api<Attempt>("attempts", { lesson_id: lessonId }, key), api<Learner>("me")]);
        let value = loaded;
        if (value.status === "abandoned") {
          key = crypto.randomUUID(); sessionStorage.setItem(storageKey, key);
          value = await api<Attempt>("attempts", { lesson_id: lessonId }, key);
        }
        if (!active) return;
        setAttempt(value); setHearts(learner.hearts); setError("");
        const stored = sessionStorage.getItem(`pending:${value.id}`);
        if (stored && value.status === "active") { pending.current = JSON.parse(stored); setHasPending(true); }
        if (value.status === "completed") { sessionStorage.removeItem(storageKey); setModal("complete"); }
        else if (learner.hearts === 0) setModal("hearts");
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Unable to start lesson");
        if (e instanceof ApiError && e.status === 403 && e.message.includes("hearts")) setModal("hearts");
      }
    }
    void load();
    return () => { active = false; };
  }, [lessonId, retry, storageKey]);

  const exercise = attempt?.lesson.exercises[attempt.position];
  const payload = exercise?.payload;
  const mapping = typeof answer === "object" && !Array.isArray(answer) ? answer : {};
  const ready = payload?.type === "translate" ? tokens.length > 0 : payload?.type === "match" ? payload.left?.every(left => mapping[left]) : typeof answer === "number" || (typeof answer === "string" && answer.trim().length > 0);

  async function check() {
    if (!attempt || !exercise || submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    if (!pending.current) {
      const submittedAnswer = payload?.type === "translate" ? tokens.map(i => payload.tokens![i]) : answer;
      pending.current = { key: crypto.randomUUID(), body: { exercise_id: exercise.id, answer: submittedAnswer } };
      sessionStorage.setItem(`pending:${attempt.id}`, JSON.stringify(pending.current));
      setHasPending(true);
    }
    try {
      const result = await api<Feedback>(`attempts/${attempt.id}/answers`, pending.current.body, pending.current.key);
      setFeedback(result); setHearts(result.hearts);
      pending.current = null; setHasPending(false); sessionStorage.removeItem(`pending:${attempt.id}`);
      window.dispatchEvent(new Event("learner-updated"));
      if (result.completed) sessionStorage.removeItem(storageKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save answer");
      if (e instanceof ApiError && e.status === 403) setModal("hearts");
    } finally { submitting.current = false; setBusy(false); }
  }
  function next() {
    if (!feedback || !attempt) return;
    if (feedback.completed) { setModal("complete"); return; }
    if (feedback.out_of_hearts) { setModal("hearts"); return; }
    setAttempt({ ...attempt, position: feedback.position }); setFeedback(null); setAnswer(""); setTokens([]);
  }
  return <main className="lesson-player">
    <header className="lesson-header"><button className="exit-button" onClick={() => setModal("exit")} aria-label="Exit lesson">✕</button><progress aria-label="Lesson progress" max={attempt?.lesson.exercises.length || 1} value={feedback?.position ?? attempt?.position ?? 0} /><span className="heart-count" aria-label={`${hearts ?? "Loading"} hearts`}>♥ {hearts ?? "…"}</span></header>
    {!attempt && !error && <p role="status" className="learning-message">Getting your lesson ready…</p>}
    {payload && <section className="exercise-area">
      <p className="exercise-eyebrow">{payload.type.replaceAll("_", " ")} · {attempt!.position + 1} OF {attempt!.lesson.exercises.length}</p>
      <h1>{payload.prompt}</h1>
      <div className="exercise-guide"><span aria-hidden="true">🦉</span><p>{payload.sentence || "Take your time. You’ve got this!"}</p></div>
      <fieldset disabled={busy || !!feedback || hasPending} className="exercise-inputs"><legend className="sr-only">Your answer</legend>
        {(payload.type === "multiple_choice" || (payload.type === "fill_blank" && payload.options)) && <div className="answer-options">{payload.options!.map((option, i) => <button key={i} className={`answer-option ${answer === (payload.type === "multiple_choice" ? i : option) ? "selected" : ""}`} aria-pressed={answer === (payload.type === "multiple_choice" ? i : option)} onClick={() => setAnswer(payload.type === "multiple_choice" ? i : option)}><span>{i + 1}</span>{option}</button>)}</div>}
        {(payload.type === "type_answer" || (payload.type === "fill_blank" && !payload.options)) && <textarea autoFocus aria-label="Type your answer in Spanish" placeholder="Type in Spanish…" value={typeof answer === "string" ? answer : ""} onChange={e => setAnswer(e.target.value)} autoComplete="off" spellCheck={false} />}
        {payload.type === "translate" && <><div className="token-answer" aria-label="Your translation">{tokens.length === 0 && <span>Tap words to build your answer</span>}{tokens.map((token, i) => <button key={i} className="word-token selected" onClick={() => setTokens(tokens.filter((_, position) => position !== i))}>{payload.tokens![token]}</button>)}</div><div className="token-bank">{payload.tokens!.map((token, i) => <button key={i} className="word-token" disabled={tokens.includes(i)} onClick={() => setTokens([...tokens, i])}>{token}</button>)}</div></>}
        {payload.type === "match" && <div className="match-pairs">{payload.left!.map(left => <label key={left}><span>{left}</span><select aria-label={`Spanish match for ${left}`} value={mapping[left] || ""} onChange={e => setAnswer({ ...mapping, [left]: e.target.value })}><option value="">Choose a match</option>{payload.right!.map(right => <option key={right} value={right}>{right}</option>)}</select></label>)}</div>}
      </fieldset>
    </section>}
    <footer className={`feedback-bar ${feedback ? feedback.correct ? "correct" : "incorrect" : ""}`}>
      {error && <p role="alert">{error}</p>}
      {feedback && <div role="status"><h2>{feedback.correct ? "✓ Nicely done!" : "Let’s try that again"}</h2>{!feedback.correct && <p>Correct answer: <strong>{feedback.expected}</strong></p>}</div>}
      {attempt && payload ? <button className="action-button" disabled={busy || (!feedback && !ready && !hasPending)} onClick={feedback ? next : check}>{busy ? "Saving…" : feedback ? "Continue" : hasPending ? "Retry saving answer" : "Check"}</button> : error && <button className="action-button" onClick={() => setRetry(v => v + 1)}>Try again</button>}
    </footer>
    {modal === "complete" && <Modal><div className="modal-art">🏆</div><h1>Lesson complete!</h1><p>You’re one step closer. Keep that momentum going!</p><div className="result-summary"><span>⚡ {feedback?.xp_earned ?? ""} XP{!feedback && " saved"}</span><span>♥ {hearts} hearts</span></div><p className="muted">Your progress is saved. Rewards may take a moment to update.</p><Link className="action-button" href="/">Back to the path</Link></Modal>}
    {modal === "hearts" && <Modal><div className="modal-art">💔</div><h1>Time for a little break</h1><p>You’re out of hearts. You’ll get one back every 30 minutes, up to five. Your lesson progress is saved.</p><Link className="action-button" href="/">Back to the path</Link></Modal>}
    {modal === "exit" && <Modal><div className="modal-art">🦉</div><h1>Take a break?</h1><p>Your saved answers will be here when you come back.</p><button className="action-button" onClick={() => setModal(null)}>Keep learning</button><Link className="secondary-action" href="/">Save and exit</Link></Modal>}
  </main>;
}
