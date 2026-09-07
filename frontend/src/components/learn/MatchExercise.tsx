"use client";

import { useEffect, useState } from "react";

export type PairResult = { key: string; left: string; right: string; correct: boolean };

type Props = {
  left: string[];
  right: string[];
  matched: Record<string, string>;
  result: PairResult | null;
  disabled: boolean;
  onPair: (pair: Record<string, string>) => void;
};

export function MatchExercise({ left, right, matched, result, disabled, onPair }: Props) {
  const [selection, setSelection] = useState<{ left?: string; right?: string }>({});
  const [dismissed, setDismissed] = useState<string | null>(null);
  const flash = result && result.key !== dismissed ? result : null;

  useEffect(() => {
    if (!result) return;
    // Keep feedback readable even when CSS motion is disabled.
    const timer = window.setTimeout(() => {
      setSelection({});
      setDismissed(result.key);
    }, 550);
    return () => window.clearTimeout(timer);
  }, [result]);

  function select(side: "left" | "right", word: string) {
    if (disabled || flash) return;
    const next = { ...selection, [side]: selection[side] === word ? undefined : word };
    setSelection(next);
    if (next.left && next.right) onPair({ [next.left]: next.right });
  }

  return (
    <div className="matching-exercise">
      <div className="matching-caption">
        <span>Find the words with the same meaning.</span>
        <span>{Object.keys(matched).length} / {left.length}</span>
      </div>
      <div className="matching-board" aria-label="Matching word pairs">
        {(["left", "right"] as const).map(side => (
          <div className="matching-column" role="group" aria-label={side === "left" ? "English words" : "Spanish words"} key={side}>
            {(side === "left" ? left : right).map(word => {
              const done = side === "left" ? Object.hasOwn(matched, word) : Object.values(matched).includes(word);
              const flashing = flash?.[side] === word;
              const selected = selection[side] === word && !done;
              const state = flashing ? flash.correct ? "pair-correct" : "pair-wrong" : done ? "pair-matched" : selected ? "pair-selected" : "";
              return (
                <button
                  key={word}
                  type="button"
                  className={`matching-tile ${state}`}
                  disabled={disabled || done || !!flash}
                  aria-pressed={selected}
                  aria-label={`${word}${done ? ", matched" : ""}`}
                  onClick={() => select(side, word)}
                >
                  <span>{word}</span>
                  {(done || flashing) && <span className="pair-mark" aria-hidden>{done || flash?.correct ? "✓" : "×"}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className={`matching-status ${flash && !flash.correct ? "matching-error" : ""}`} role="status" aria-live="polite">
        {flash ? flash.correct ? "Pair matched!" : "Those don’t match. Try again." : Object.keys(matched).length === left.length ? "All pairs matched!" : "Tap a word, then its translation."}
      </p>
    </div>
  );
}
