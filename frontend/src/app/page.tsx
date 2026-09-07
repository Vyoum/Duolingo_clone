import { AppShell } from "@/components/layout/AppShell";
import { TopStatsBar } from "@/components/layout/TopStatsBar";
import { LearningPath } from "@/components/learn/LearningPath";

export default function HomePage() {
  return <AppShell><TopStatsBar /><LearningPath /></AppShell>;
}
