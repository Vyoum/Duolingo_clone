import type { Goal } from "@/lib/api";

export type BadgeMeta = {
  name: string;
  description: string;
  icon: string;
  color: string;
  accent: string;
};

/** Presentation metadata for gamification achievement names. */
export const BADGE_CATALOG: Record<string, BadgeMeta> = {
  "First steps": {
    name: "First steps",
    description: "Complete your first lesson. Every journey starts somewhere.",
    icon: "🌱",
    color: "#58CC02",
    accent: "#43A000",
  },
  "XP explorer": {
    name: "XP explorer",
    description: "Earn 100 XP. Keep stacking those lightning bolts.",
    icon: "⚡",
    color: "#1CB0F6",
    accent: "#1899D6",
  },
  "On fire": {
    name: "On fire",
    description: "Reach a 3-day streak. Show up again tomorrow.",
    icon: "🔥",
    color: "#FF4B4B",
    accent: "#EA2B2B",
  },
};

const SEEN_KEY = "duo_badges_seen";
const HYDRATED_KEY = "duo_badges_hydrated";

export function badgeMeta(goal: Goal): BadgeMeta {
  return (
    BADGE_CATALOG[goal.name] ?? {
      name: goal.name,
      description: `Reach ${goal.target} to unlock this badge.`,
      icon: "🏅",
      color: "#FFC800",
      accent: "#D7A900",
    }
  );
}

export function isUnlocked(goal: Goal) {
  return goal.current >= goal.target;
}

function readSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSeen(names: Iterable<string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set(names)]));
}

/** Returns newly unlocked badge names that have not been celebrated yet. */
export function consumeNewUnlocks(achievements: Goal[]): string[] {
  const unlocked = achievements.filter(isUnlocked).map(a => a.name);
  const seen = readSeen();

  if (!localStorage.getItem(HYDRATED_KEY)) {
    writeSeen([...seen, ...unlocked]);
    localStorage.setItem(HYDRATED_KEY, "1");
    return [];
  }

  const fresh = unlocked.filter(name => !seen.has(name));
  if (fresh.length) writeSeen([...seen, ...fresh]);
  return fresh;
}
