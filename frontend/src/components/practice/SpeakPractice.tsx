"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SPEAK_PROMPTS } from "@/lib/speak-content";
import {
  getSpeechSupport,
  speechMatches,
  speakText,
  startListening,
  stopSpeaking,
  type ListenHandle,
} from "@/lib/speech";
import { playCorrectChime, playIncorrectThud } from "@/lib/feedback-sfx";

type Phase = "idle" | "listening" | "feedback" | "complete";

/**
 * Careful speak practice: browser STT + TTS, typed fallback, local grading.
 * Does not deduct shared demo hearts (safer for the fixed demo user).
 */
export function SpeakPractice() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [useType, setUseType] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [expected, setExpected] = useState("");
  const [error, setError] = useState("");
  const [support, setSupport] = useState({ recognition: false, synthesis: false });
  const [score, setScore] = useState({ correct: 0, tried: 0 });
  const listenRef = useRef<ListenHandle | null>(null);
  const gradedRef = useRef(false);

  const prompt = SPEAK_PROMPTS[index];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = getSpeechSupport();
      setSupport(next);
      if (!next.recognition) setUseType(true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      listenRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  function resetTurn() {
    listenRef.current?.stop();
    listenRef.current = null;
    stopSpeaking();
    gradedRef.current = false;
    setTranscript("");
    setTyped("");
    setCorrect(null);
    setExpected("");
    setError("");
    setPhase("idle");
  }

  async function playModel() {
    if (!prompt) return;
    setError("");
    try {
      await speakText(prompt.phrase, "es-ES");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not play the phrase.");
    }
  }

  function grade(raw: string) {
    if (gradedRef.current) return;
    gradedRef.current = true;
    const result = speechMatches(raw, prompt.accepted);
    setCorrect(result.ok);
    setExpected(result.expected);
    setScore(s => ({ correct: s.correct + (result.ok ? 1 : 0), tried: s.tried + 1 }));
    setPhase("feedback");
    if (result.ok) playCorrectChime();
    else playIncorrectThud();
  }

  function startMic() {
    if (!prompt || phase === "listening") return;
    setError("");
    setTranscript("");
    setCorrect(null);
    gradedRef.current = false;
    setPhase("listening");
    const handle = startListening({
      lang: "es-ES",
      onInterim: text => setTranscript(text),
      onFinal: text => {
        setTranscript(text);
        listenRef.current = null;
        grade(text);
      },
      onError: message => {
        if (gradedRef.current) return;
        setError(message);
        setPhase("idle");
        listenRef.current = null;
        setUseType(true);
      },
      onEnd: () => {
        listenRef.current = null;
        if (!gradedRef.current) setPhase("idle");
      },
    });
    listenRef.current = handle;
    if (!handle) setPhase("idle");
  }

  function stopMic() {
    listenRef.current?.stop();
    listenRef.current = null;
  }

  function checkTyped() {
    if (!typed.trim()) return;
    grade(typed);
  }

  function continueNext() {
    if (!correct) {
      resetTurn();
      return;
    }
    if (index >= SPEAK_PROMPTS.length - 1) {
      setPhase("complete");
      return;
    }
    setIndex(i => i + 1);
    resetTurn();
  }

  if (phase === "complete") {
    return (
      <main className="speak-player">
        <div className="speak-complete" role="status">
          <div className="modal-art" aria-hidden>🎤</div>
          <h1>Speaking practice complete</h1>
          <p>
            You got <strong>{score.correct}</strong> of <strong>{score.tried}</strong> phrases.
          </p>
          <p className="muted">This app does not store recordings. Your browser may use its speech service to process audio.</p>
          <Link className="action-button" href="/practice">Back to Practice</Link>
          <button
            type="button"
            className="secondary-action"
            onClick={() => {
              setIndex(0);
              setScore({ correct: 0, tried: 0 });
              resetTurn();
            }}
          >
            Practice again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="speak-player">
      <header className="speak-header">
        <Link href="/practice" className="exit-button" aria-label="Back to practice">✕</Link>
        <progress
          aria-label="Speak practice progress"
          max={SPEAK_PROMPTS.length}
          value={Math.min(index + (correct ? 1 : 0), SPEAK_PROMPTS.length)}
        />
        <span className="speak-count">{index + 1}/{SPEAK_PROMPTS.length}</span>
      </header>

      <section className="speak-area">
        <p className="exercise-eyebrow">Speak · Spanish</p>
        <h1>{prompt.prompt}</h1>
        <div className="exercise-guide">
          <span aria-hidden>🦉</span>
          <p>{prompt.hint}. Tap the speaker to hear the model phrase, then speak it back.</p>
        </div>

        <div className="speak-phrase-card">
          <button type="button" className="speak-hear" onClick={() => void playModel()} disabled={!support.synthesis || phase === "listening"}>
            <span aria-hidden>🔊</span> Hear it
          </button>
          <p className="speak-target" lang="es">{phase === "feedback" || useType ? prompt.phrase : "••••••"}</p>
          <small>{support.recognition ? "Microphone ready" : "Mic unavailable — typing enabled"}</small>
        </div>

        {!useType && (
          <div className="speak-mic-block">
            <button
              type="button"
              className={`speak-mic ${phase === "listening" ? "listening" : ""}`}
              aria-pressed={phase === "listening"}
              aria-label={phase === "listening" ? "Stop listening" : "Tap to speak"}
              disabled={phase === "feedback"}
              onClick={() => (phase === "listening" ? stopMic() : startMic())}
            >
              <span aria-hidden>{phase === "listening" ? "⏹" : "🎙️"}</span>
            </button>
            <p className="speak-mic-label" role="status">
              {phase === "listening" ? "Listening… speak clearly" : "Tap the mic and say the phrase"}
            </p>
            {transcript && <p className="speak-transcript" lang="es">“{transcript}”</p>}
            <button type="button" className="secondary-action" onClick={() => { stopMic(); setUseType(true); setPhase("idle"); }}>
              Type instead
            </button>
          </div>
        )}

        {useType && phase !== "feedback" && (
          <div className="speak-type-block">
            <label className="sr-only" htmlFor="speak-typed">Type the Spanish phrase</label>
            <textarea
              id="speak-typed"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="Type what you would say…"
              lang="es"
              autoComplete="off"
              spellCheck={false}
            />
            {support.recognition && (
              <button type="button" className="secondary-action" onClick={() => setUseType(false)}>
                Use microphone
              </button>
            )}
          </div>
        )}

        {error && <p className="speak-error" role="alert">{error}</p>}
      </section>

      <footer className={`feedback-bar ${phase === "feedback" ? `feedback-visible ${correct ? "correct" : "incorrect"}` : ""}`}>
        {phase === "feedback" && (
          <div role="status">
            <h2>{correct ? "✓ Sounded great!" : "Almost — try again"}</h2>
            {!correct && <p>Expected: <strong lang="es">{expected}</strong></p>}
            {(transcript || typed) && (
              <p className="speak-heard">
                Heard: <strong lang="es">{transcript || typed}</strong>
              </p>
            )}
          </div>
        )}
        {phase === "feedback" ? (
          <button type="button" className="action-button" onClick={continueNext}>
            {correct ? (index >= SPEAK_PROMPTS.length - 1 ? "Finish" : "Continue") : "Try again"}
          </button>
        ) : useType ? (
          <button type="button" className="action-button" disabled={!typed.trim()} onClick={checkTyped}>
            Check
          </button>
        ) : (
          <button type="button" className="action-button" disabled={phase === "listening"} onClick={startMic}>
            {phase === "listening" ? "Listening…" : "Tap mic to speak"}
          </button>
        )}
      </footer>
    </main>
  );
}
