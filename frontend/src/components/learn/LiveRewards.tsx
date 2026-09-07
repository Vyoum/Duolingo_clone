"use client";
import { type Goal, type Learner, useApi } from "@/lib/api";
import { AchievementBadges } from "@/components/learn/BadgeUnlock";
import { AnimatedNumber } from "@/lib/motion";

function Goals({ items }: { items: Goal[] }) {
  return <>{items.map(goal => <div className="goal-card" key={goal.name}><div><span>{goal.name}</span><span>{goal.current}/{goal.target}</span></div><progress max={goal.target} value={goal.current} aria-label={goal.name} />{goal.current >= goal.target && <small>✓ Completed</small>}</div>)}</>;
}

export function LiveRewards({ profile = false }: { profile?: boolean }) {
  const { data, error, reload } = useApi<Learner>("me", true);
  if (error) return <div className="learning-message" role="alert">{error}<button className="action-button" onClick={reload}>Try again</button></div>;
  if (!data) return <p className="learning-message" role="status">Loading your progress…</p>;
  return <section className="live-panel">
    {profile ? (
      <>
        <h1>{data.name}&apos;s progress</h1>
        <p className="subtitle">Every lesson counts. Here’s how far you’ve come.</p>
        <div className="learner-stats">
          <div><strong>🔥 <AnimatedNumber value={data.streak} /></strong><span>Day streak</span></div>
          <div><strong>⚡ <AnimatedNumber value={data.xp} /></strong><span>Total XP</span></div>
          <div><strong>♥ <AnimatedNumber value={data.hearts} /></strong><span>Hearts available</span></div>
          <div><strong><AnimatedNumber value={data.lessons_completed} /></strong><span>Lessons completed</span></div>
        </div>
        {data.next_heart_at && <p className="subtitle">Next heart at {new Date(data.next_heart_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}
      </>
    ) : (
      <>
        <h1>Daily quests</h1>
        <p className="subtitle">Little challenges. Lasting progress. Resets at midnight UTC.</p>
        <Goals items={data.quests} />
      </>
    )}
    <h2>Achievements</h2>
    <p className="subtitle">Earn badges as you learn. Newly unlocked ones celebrate automatically.</p>
    <AchievementBadges items={data.achievements} />
  </section>;
}
