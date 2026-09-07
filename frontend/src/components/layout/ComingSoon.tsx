import { AppShell } from "@/components/layout/AppShell";

export default function ComingSoonPage({
  title,
}: {
  title: string;
}) {
  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-extrabold text-white">{title}</h1>
        <p className="mt-2 font-bold text-duo-muted">Coming soon</p>
      </div>
    </AppShell>
  );
}
