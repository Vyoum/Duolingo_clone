import type { Achievement } from "@/lib/profile-data";

export function Achievements({ achievements }: { achievements: Achievement[] }) {
  return (
    <section className="mx-4 mt-8 mb-6">
      <h3 className="mb-3 text-2xl font-extrabold text-white">Achievements</h3>
      <div className="duo-card overflow-hidden">
        {achievements.map((item, index) => (
          <AchievementRow
            key={item.id}
            item={item}
            showBorder={index < achievements.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function AchievementRow({
  item,
  showBorder,
}: {
  item: Achievement;
  showBorder: boolean;
}) {
  const pct = Math.min(100, Math.round((item.current / item.target) * 100));
  const theme =
    item.theme === "wildfire"
      ? { bg: "#FF4B4B", icon: "🔥" }
      : { bg: "#58CC02", icon: "🧙" };

  return (
    <div
      className={`flex gap-3 px-4 py-4 ${
        showBorder ? "border-b-2 border-duo-border" : ""
      }`}
    >
      <div
        className="relative flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-2xl"
        style={{ background: theme.bg }}
      >
        <span className="text-2xl" aria-hidden>
          {theme.icon}
        </span>
        <span className="absolute bottom-1 text-[10px] font-black tracking-wide text-white">
          LEVEL {item.level}
        </span>
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-extrabold text-white">{item.name}</p>
          <p className="shrink-0 text-sm font-bold text-duo-muted">
            {item.current}/{item.target}
          </p>
        </div>
        <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-duo-border">
          <div
            className="h-full rounded-full bg-duo-yellow"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold text-duo-muted">
          {item.description}
        </p>
      </div>
    </div>
  );
}
