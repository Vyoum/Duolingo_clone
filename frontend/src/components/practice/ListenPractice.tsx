"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LISTEN_PROMPTS } from "@/lib/listen-content";
import { getSpeechSupport, speakText, stopSpeaking } from "@/lib/speech";
import { playCorrectChime, playIncorrectThud } from "@/lib/feedback-sfx";

type Phase = "answer" | "feedback" | "complete";

export function ListenPractice() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("answer");
  const [selected, setSelected] = useState("");
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [synthesis, setSynthesis] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const prompt = LISTEN_PROMPTS[index];

  useEffect(() => {
    const timer = window.setTimeout(() => setSynthesis(getSpeechSupport().synthesis), 0);
    return () => { window.clearTimeout(timer); stopSpeaking(); };
  }, []);

  async function play(rate = 0.92) {
    setError(""); setPlaying(true);
    try { await speakText(prompt.phrase, "es-ES", rate); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not play this phrase."); }
    finally { setPlaying(false); }
  }

  function check() {
    if (!selected) return;
    const ok = selected === prompt.meaning;
    setCorrect(ok); setPhase("feedback");
    if (ok) { setScore(value => value + 1); playCorrectChime(); }
    else playIncorrectThud();
  }

  function next() {
    if (!correct) { setSelected(""); setPhase("answer"); return; }
    if (index === LISTEN_PROMPTS.length - 1) { setPhase("complete"); return; }
    setIndex(value => value + 1); setSelected(""); setCorrect(false); setPhase("answer"); setError("");
  }

  if (phase === "complete") return <main className="speak-player"><section className="speak-complete" role="status"><div className="modal-art" aria-hidden>🎧</div><h1>Listening practice complete</h1><p>You understood <strong>{score}</strong> of <strong>{LISTEN_PROMPTS.length}</strong> phrases.</p><Link className="action-button" href="/practice">Back to Practice</Link><button className="secondary-action" onClick={() => { setIndex(0); setScore(0); setSelected(""); setCorrect(false); setPhase("answer"); }}>Practice again</button></section></main>;

  return <main className="speak-player"><header className="speak-header"><Link href="/practice" className="exit-button" aria-label="Back to practice">✕</Link><progress aria-label="Listening practice progress" max={LISTEN_PROMPTS.length} value={index + (correct ? 1 : 0)} /><span className="speak-count">{index + 1}/{LISTEN_PROMPTS.length}</span></header><section className="speak-area"><p className="exercise-eyebrow">Listen · Spanish</p><h1>What do you hear?</h1><div className="listen-speakers"><button className="listen-play" disabled={!synthesis || playing} onClick={() => void play()} aria-label="Play Spanish phrase"><span aria-hidden>🔊</span></button><button className="listen-slow" disabled={!synthesis || playing} onClick={() => void play(0.65)} aria-label="Play Spanish phrase slowly"><span aria-hidden>🐢</span> Slower</button></div>{!synthesis && <div className="listen-fallback" role="status"><strong>Audio is unavailable in this browser.</strong><span>Text fallback:</span><b lang="es">{prompt.phrase}</b></div>}{error && <p className="speak-error" role="alert">{error}</p>}<div className="answer-options">{prompt.choices.map(choice => <button key={choice} className={`answer-option ${selected === choice ? "selected" : ""}`} aria-pressed={selected === choice} disabled={phase === "feedback"} onClick={() => setSelected(choice)}>{choice}</button>)}</div></section><footer className={`feedback-bar ${phase === "feedback" ? `feedback-visible ${correct ? "correct" : "incorrect"}` : ""}`}>{phase === "feedback" && <div role="status"><h2>{correct ? "✓ You got it!" : "Listen once more"}</h2>{!correct && <p>Correct meaning: <strong>{prompt.meaning}</strong></p>}</div>}<button className="action-button" disabled={phase === "answer" && !selected} onClick={phase === "feedback" ? next : check}>{phase === "feedback" ? (correct ? (index === LISTEN_PROMPTS.length - 1 ? "Finish" : "Continue") : "Try again") : "Check"}</button></footer></main>;
}
