"use client";
import Link from "next/link";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { api, ApiError, type Attempt, type Feedback, type Learner } from "@/lib/api";
import { playCorrectChime, playIncorrectThud } from "@/lib/feedback-sfx";
import { AnimatedNumber, motion, slideUp, softSpring, springPop } from "@/lib/motion";
import { MatchExercise, type PairResult } from "./MatchExercise";

type Answer = string | number | string[] | Record<string, string>;

function Modal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} className="lesson-modal" onCancel={e => e.preventDefault()}>
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.86, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springPop}
      >
        {children}
      </motion.div>
    </dialog>
  );
}

/** Duo-style speaking mascot that appears with the correct feedback bar. */
function CorrectVoiceBurst({ message }: { message: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="correct-voice"
      data-testid="correct-voice"
      aria-hidden
      initial={reduce ? false : { opacity: 0, x: -16, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={softSpring}
    >
      <div className="correct-voice-owl">
        <span className="correct-voice-face">🦉</span>
        <span className="correct-voice-waves">
          <i /><i /><i />
        </span>
      </div>
      <div className="correct-voice-copy">
        <p className="correct-voice-bubble">{message}</p>
        <small>Keep going!</small>
      </div>
    </motion.div>
  );
}

const CORRECT_LINES = ["Nicely done!", "Great job!", "You got it!", "Amazing!"];

function XpRollup({ value, saved }: { value: number; saved: boolean }) {
  return (
    <motion.span
      className="xp-rollup"
      data-testid="xp-rollup"
      aria-label={saved ? "XP saved" : `${value} XP earned`}
      initial={{ scale: 0.85, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={springPop}
    >
      <span aria-hidden>
        ⚡ {saved ? "XP saved" : <><AnimatedNumber value={value} /> XP</>}
      </span>
    </motion.span>
  );
}

function Celebration() {
  return (
    <div className="lesson-celebration" data-testid="lesson-celebration" aria-hidden>
      {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
    </div>
  );
}

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const reduce = useReducedMotion();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [hearts, setHearts] = useState<number | null>(null);
  const [answer, setAnswer] = useState<Answer>("");
  const [tokens, setTokens] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [pairResult, setPairResult] = useState<PairResult | null>(null);
  const [heartLoss, setHeartLoss] = useState(0);
  const [correctLine, setCorrectLine] = useState(CORRECT_LINES[0]);
  const [modal, setModal] = useState<"complete" | "hearts" | "exit" | null>(null);
  const [retry, setRetry] = useState(0);
  const pending = useRef<{ key: string; body: { exercise_id: string; answer: Answer; match_pair?: boolean } } | null>(null);
  const submitting = useRef(false);
  const storageKey = `lesson-start:${lessonId}`;

  function celebrate(correct: boolean) {
    if (correct) {
      setCorrectLine(CORRECT_LINES[Math.floor(Math.random() * CORRECT_LINES.length)]);
      playCorrectChime();
    } else {
      playIncorrectThud();
    }
  }

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
  const ready = payload?.type === "translate" ? tokens.length > 0 : payload?.type === "match" ? false : typeof answer === "number" || (typeof answer === "string" && answer.trim().length > 0);

  async function check(pair?: Record<string, string>) {
    if (!attempt || !exercise || submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    if (!pending.current) {
      const submittedAnswer = pair ?? (payload?.type === "translate" ? tokens.map(i => payload.tokens![i]) : answer);
      pending.current = { key: crypto.randomUUID(), body: { exercise_id: exercise.id, answer: submittedAnswer, ...(pair ? { match_pair: true } : {}) } };
      sessionStorage.setItem(`pending:${attempt.id}`, JSON.stringify(pending.current));
      setHasPending(true);
    }
    try {
      const submitted = pending.current;
      const result = await api<Feedback>(`attempts/${attempt.id}/answers`, submitted.body, submitted.key);
      celebrate(result.correct);
      if (hearts !== null && result.hearts < hearts) setHeartLoss(n => n + 1);
      setHearts(result.hearts);
      if (submitted.body.match_pair) {
        const [left, right] = Object.entries(submitted.body.answer as Record<string, string>)[0];
        setPairResult({ key: submitted.key, left, right, correct: result.correct });
        setAttempt(current => current ? { ...current, matched_pairs: result.matched_pairs ?? current.matched_pairs } : current);
        if (result.exercise_complete) setFeedback(result);
        if (result.out_of_hearts) setModal("hearts");
      } else {
        setFeedback(result);
      }
      pending.current = null; setHasPending(false); sessionStorage.removeItem(`pending:${attempt.id}`);
      window.dispatchEvent(new Event("learner-updated"));
      if (result.completed) {
        sessionStorage.removeItem(storageKey);
        // Rewards are eventually consistent — refresh so badge unlocks can present.
        window.setTimeout(() => window.dispatchEvent(new Event("learner-updated")), 1500);
        window.setTimeout(() => window.dispatchEvent(new Event("learner-updated")), 4000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save answer");
      if (e instanceof ApiError && e.status === 403) setModal("hearts");
    } finally { submitting.current = false; setBusy(false); }
  }
  function next() {
    if (!feedback || !attempt) return;
    if (feedback.completed) { setModal("complete"); return; }
    if (feedback.out_of_hearts) { setModal("hearts"); return; }
    setAttempt({ ...attempt, position: feedback.position, matched_pairs: {} }); setFeedback(null); setPairResult(null); setAnswer(""); setTokens([]);
  }
  return <main className="lesson-player">
    <header className="lesson-header">
      <button className="exit-button" onClick={() => setModal("exit")} aria-label="Exit lesson">✕</button>
      <progress aria-label="Lesson progress" max={attempt?.lesson.exercises.length || 1} value={feedback?.position ?? attempt?.position ?? 0} />
      <motion.span
        key={heartLoss}
        className={`heart-count ${heartLoss ? "heart-shake" : ""}`}
        aria-label={`${hearts ?? "Loading"} hearts`}
        animate={reduce || !heartLoss ? undefined : { scale: [1, 1.18, 1], rotate: [0, -8, 6, 0] }}
        transition={{ duration: 0.45 }}
      >
        ♥ <AnimatedNumber value={hearts} />
      </motion.span>
    </header>
    {!attempt && !error && <p role="status" className="learning-message">Getting your lesson ready…</p>}
    {payload && (
      <motion.section
        key={exercise?.id ?? attempt?.position}
        className={`exercise-area ${payload.type === "match" ? "exercise-area-matching" : ""}`}
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softSpring}
      >
      {payload.type !== "match" && <p className="exercise-eyebrow">{payload.type.replaceAll("_", " ")} · {attempt!.position + 1} OF {attempt!.lesson.exercises.length}</p>}
      <h1>{payload.type === "match" ? "Tap the matching pairs" : payload.prompt}</h1>
      {payload.type !== "match" && <div className="exercise-guide"><span aria-hidden="true">🦉</span><p>{payload.sentence || "Take your time. You’ve got this!"}</p></div>}
      <fieldset disabled={busy || !!feedback || hasPending} className="exercise-inputs"><legend className="sr-only">Your answer</legend>
        {(payload.type === "multiple_choice" || (payload.type === "fill_blank" && payload.options)) && <div className="answer-options">{payload.options!.map((option, i) => <button key={i} className={`answer-option ${answer === (payload.type === "multiple_choice" ? i : option) ? "selected" : ""}`} aria-pressed={answer === (payload.type === "multiple_choice" ? i : option)} onClick={() => setAnswer(payload.type === "multiple_choice" ? i : option)}><span>{i + 1}</span>{option}</button>)}</div>}
        {(payload.type === "type_answer" || (payload.type === "fill_blank" && !payload.options)) && <textarea autoFocus aria-label="Type your answer in Spanish" placeholder="Type in Spanish…" value={typeof answer === "string" ? answer : ""} onChange={e => setAnswer(e.target.value)} autoComplete="off" spellCheck={false} />}
        {payload.type === "translate" && <><div className="token-answer" aria-label="Your translation">{tokens.length === 0 && <span>Tap words to build your answer</span>}{tokens.map((token, i) => <button key={i} className="word-token selected" onClick={() => setTokens(tokens.filter((_, position) => position !== i))}>{payload.tokens![token]}</button>)}</div><div className="token-bank">{payload.tokens!.map((token, i) => <button key={i} className="word-token" disabled={tokens.includes(i)} onClick={() => setTokens([...tokens, i])}>{token}</button>)}</div></>}
        {payload.type === "match" && <MatchExercise key={exercise!.id} left={payload.left!} right={payload.right!} matched={attempt?.matched_pairs ?? {}} result={pairResult} disabled={busy || !!feedback || hasPending} onPair={pair => { void check(pair); }} />}
      </fieldset>
      </motion.section>
    )}
    <footer data-testid="feedback-bar" className={`feedback-bar ${feedback ? (feedback.correct ? "correct" : "incorrect") : ""}`}>
      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={feedback.correct ? "ok" : "bad"}
            className="feedback-motion"
            initial={reduce ? false : { opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 24 }}
            transition={slideUp}
          >
            {feedback.correct && <CorrectVoiceBurst message={correctLine} />}
            {!feedback.correct && <div role="status"><h2>Let’s try that again</h2><p>Correct answer: <strong>{feedback.expected}</strong></p></div>}
            {feedback.correct && <div role="status" className="sr-only">Correct. {correctLine}</div>}
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p role="alert">{error}</p>}
      {attempt && payload ? <button className="action-button" disabled={busy || (!feedback && !ready && !hasPending)} onClick={feedback ? next : () => { void check(); }}>{busy ? "Saving…" : feedback ? "Continue" : hasPending ? "Retry saving answer" : payload.type === "match" ? "Continue" : "Check"}</button> : error && <button className="action-button" onClick={() => setRetry(v => v + 1)}>Try again</button>}
    </footer>
    <AnimatePresence>
      {modal === "complete" && (
        <Modal key="complete">
          <Celebration />
          <motion.div
            className="modal-art celebration-trophy"
            initial={reduce ? false : { scale: 0.4, y: 30, rotate: -12 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            transition={springPop}
          >
            🏆
          </motion.div>
          <h1>Lesson complete!</h1>
          <p>You’re one step closer. Keep that momentum going!</p>
          <div className="result-summary"><XpRollup value={feedback?.xp_earned ?? 0} saved={!feedback} /><span>♥ <AnimatedNumber value={hearts} /> hearts</span></div>
          <p className="muted">Your progress is saved. Rewards may take a moment to update.</p>
          <Link className="action-button" href="/">Back to the path</Link>
        </Modal>
      )}
      {modal === "hearts" && (
        <Modal key="hearts">
          <motion.div className="modal-art" initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springPop}>💔</motion.div>
          <h1>Time for a little break</h1>
          <p>You’re out of hearts. You’ll get one back every 30 minutes, up to five. Your lesson progress is saved.</p>
          <Link className="action-button" href="/">Back to the path</Link>
        </Modal>
      )}
      {modal === "exit" && (
        <Modal key="exit">
          <motion.div className="modal-art" initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springPop}>🦉</motion.div>
          <h1>Take a break?</h1>
          <p>Your saved answers will be here when you come back.</p>
          <button className="action-button" onClick={() => setModal(null)}>Keep learning</button>
          <Link className="secondary-action" href="/">Save and exit</Link>
        </Modal>
      )}
    </AnimatePresence>
  </main>;
}
