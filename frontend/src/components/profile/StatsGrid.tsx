export function StatsGrid({
  dayStreak,
  totalXp,
  league,
  top3Finishes,
}: {
  dayStreak: number;
  totalXp: number;
  league: string;
  top3Finishes: number;
}) {
  return (
    <section className="mx-4 mt-6">
      <h3 className="mb-3 text-2xl font-extrabold text-white">Statistics</h3>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<FlameIcon active={dayStreak > 0} />}
          value={String(dayStreak)}
          label="Day streak"
        />
        <StatCard
          icon={<BoltIcon />}
          value={totalXp.toLocaleString()}
          label="Total XP"
        />
        <StatCard icon={<ShieldIcon />} value={league} label="League" />
        <StatCard
          icon={<MedalIcon />}
          value={String(top3Finishes)}
          label="Top 3 finishes"
        />
      </div>
    </section>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="duo-card flex min-h-[78px] items-center gap-3 px-3 py-3">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-lg font-extrabold leading-tight text-white">
          {value}
        </p>
        <p className="truncate text-sm font-bold text-duo-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

function FlameIcon({ active }: { active: boolean }) {
  const fill = active ? "#FF9600" : "#52656D";
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2c2 3 1 5 1 5s3-1 5 2c2 3 1 7-2 9-2 1.5-4 2-4 2s-2-.5-4-2c-3-2-4-6-2-9 2-3 5-2 5-2s-1-2 1-5Z"
        fill={fill}
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path d="M13 2 4 14h7l-1 8 10-14h-7l0-6Z" fill="#FFC800" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3Z"
        fill="#C0C0C0"
        stroke="#8A8A8A"
        strokeWidth="1"
      />
    </svg>
  );
}

function MedalIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="14" r="7" fill="#FFC800" />
      <circle cx="12" cy="14" r="4" fill="#FFE57A" />
      <path d="M8 2h3l1 6H9L8 2Zm5 0h3l-1 6h-3l1-6Z" fill="#1CB0F6" />
    </svg>
  );
}
