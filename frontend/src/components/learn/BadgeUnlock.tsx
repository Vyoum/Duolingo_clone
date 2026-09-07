"use client";

import { useEffect, useRef, useState } from "react";
import { type Goal, useApi, type Learner } from "@/lib/api";
import { badgeMeta, consumeNewUnlocks, isUnlocked } from "@/lib/badges";
import { playBadgeFanfare } from "@/lib/feedback-sfx";

function Confetti() {
  return (
    <div className="lesson-celebration" aria-hidden>
      {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
    </div>
  );
}

export function BadgeUnlockModal({
  name,
  onClose,
}: {
  name: string;
  onClose: () => void;
}) {
  const meta = badgeMeta({ name, current: 1, target: 1 });
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
    playBadgeFanfare();
  }, []);

  return (
    <dialog
      ref={ref}
      className="badge-unlock-modal"
      data-testid="badge-unlock-modal"
      onCancel={e => {
        e.preventDefault();
        onClose();
      }}
    >
      <Confetti />
      <p className="badge-unlock-eyebrow">Badge unlocked</p>
      <div
        className="badge-unlock-medal"
        style={{ background: meta.color, boxShadow: `0 8px 0 ${meta.accent}` }}
      >
        <span aria-hidden>{meta.icon}</span>
      </div>
      <h1>{meta.name}</h1>
      <p className="badge-unlock-copy">{meta.description}</p>
      <button type="button" className="action-button" onClick={onClose}>
        Awesome
      </button>
    </dialog>
  );
}

/** Watches learner achievements and presents unlock celebrations one at a time. */
export function BadgeUnlockWatcher() {
  const { data } = useApi<Learner>("me", true);
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    if (!data?.achievements?.length) return;
    const fresh = consumeNewUnlocks(data.achievements);
    if (!fresh.length) return;
    // Let the API effect complete before adding an overlay to the render tree.
    // This avoids a synchronous render cascade when learner data refreshes.
    const timer = window.setTimeout(() => {
      setQueue(current => [...current, ...fresh.filter(name => !current.includes(name))]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [data]);

  if (!queue[0]) return null;
  return (
    <BadgeUnlockModal
      name={queue[0]}
      onClose={() => setQueue(current => current.slice(1))}
    />
  );
}

export function AchievementBadges({ items }: { items: Goal[] }) {
  return (
    <div className="badge-grid" data-testid="achievement-badges">
      {items.map(goal => {
        const meta = badgeMeta(goal);
        const unlocked = isUnlocked(goal);
        const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
        return (
          <article
            key={goal.name}
            className={`badge-card ${unlocked ? "badge-unlocked" : "badge-locked"}`}
            aria-label={`${meta.name}${unlocked ? ", unlocked" : `, ${goal.current} of ${goal.target}`}`}
          >
            <div
              className="badge-medal"
              style={{
                background: unlocked ? meta.color : "#2d4049",
                boxShadow: unlocked ? `inset 0 -6px ${meta.accent}` : "inset 0 -6px #24343c",
              }}
            >
              <span aria-hidden>{unlocked ? meta.icon : "🔒"}</span>
            </div>
            <div className="badge-copy">
              <div className="badge-title-row">
                <h3>{meta.name}</h3>
                <span>{goal.current}/{goal.target}</span>
              </div>
              <div className="badge-track" aria-hidden>
                <div className="badge-fill" style={{ width: `${pct}%`, background: meta.color }} />
              </div>
              <p>{unlocked ? "Unlocked!" : meta.description}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
