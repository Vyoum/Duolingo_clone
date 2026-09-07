"use client";
import { useApi } from "@/lib/api";
type Board = { period: string; items: { rank: number; user_id: string; name: string; xp: number; is_you: boolean; seeded: boolean }[] };
export function LeaderboardScreen() {
  const { data, error, reload } = useApi<Board>("leaderboard", true);
  return <section className="live-panel"><div className="modal-art text-center">🏆</div><h1>Leaderboard</h1><p className="subtitle">All-time XP · Learn a little. Climb a little.</p>
    {error ? <div role="alert">{error}<button className="action-button" onClick={reload}>Try again</button></div> : !data ? <p role="status">Loading rankings…</p> : <ol>{data.items.map(row => <li key={row.user_id} className={`leader-row ${row.is_you ? "you" : ""}`}><span>{row.rank}</span><div>{row.name}{row.is_you && " (you)"}{row.seeded && <small>Demo competitor</small>}</div><strong>{row.xp} XP</strong></li>)}</ol>}
  </section>;
}
