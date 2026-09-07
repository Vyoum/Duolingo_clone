export type Friend = {
  id: string;
  name: string;
  xp: number;
  avatarHue: string;
  caption?: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  current: number;
  target: number;
  level: number;
  theme: "wildfire" | "sage";
};

/** Seeded profile data until gamification-service is wired up. */
export const PROFILE = {
  displayName: "Vyoum",
  username: "Vyoumm",
  joined: "Joined June 2024",
  friendsCount: 6,
  courses: ["de", "fr"] as const,
  stats: {
    dayStreak: 0,
    totalXp: 7665,
    league: "Silver",
    top3Finishes: 3,
  },
  suggestions: [
    {
      id: "1",
      name: "Sunny Kumar",
      xp: 0,
      avatarHue: "#7c3aed",
      caption: "Follows you",
    },
    {
      id: "2",
      name: "Shaivya Sharma",
      xp: 0,
      avatarHue: "#0891b2",
      caption: "Followed by Sunny Kumar",
    },
    {
      id: "3",
      name: "Aarav Mehta",
      xp: 0,
      avatarHue: "#ca8a04",
      caption: "Followed by Shaivya Sharma",
    },
  ] satisfies Friend[],
  following: [
    { id: "f1", name: "jack novi", xp: 7650, avatarHue: "#16a34a" },
    { id: "f2", name: "maya chen", xp: 3978, avatarHue: "#db2777" },
    { id: "f3", name: "leo parks", xp: 3120, avatarHue: "#2563eb" },
    { id: "f4", name: "nina ross", xp: 2800, avatarHue: "#ea580c" },
    { id: "f5", name: "omar ali", xp: 2100, avatarHue: "#4f46e5" },
  ] satisfies Friend[],
  achievements: [
    {
      id: "a1",
      name: "Wildfire",
      description: "Reach a 50 day streak",
      current: 39,
      target: 50,
      level: 5,
      theme: "wildfire",
    },
    {
      id: "a2",
      name: "Sage",
      description: "Earn 1000 XP with legendary lessons",
      current: 191,
      target: 1000,
      level: 9,
      theme: "sage",
    },
  ] satisfies Achievement[],
};
