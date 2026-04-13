import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SurfaceCard } from "@/components/ui";

export default function LandingPage() {
  return (
    <PageShell
      title="Pocket Connect"
      subtitle="Meet coworkers, make connections, and build your Pokemon squad."
      hideNav
    >
      <SurfaceCard>
        <p className="text-sm text-slate-700">
          A playful off-site mini game. Pick your starter, connect during the event, and race up the
          leaderboard.
        </p>
        <Link href="/how-to" className="mt-3 inline-block text-sm font-semibold text-slate-700 underline">
          Read quick how-to
        </Link>
      </SurfaceCard>
      <Link
        href="/starter"
        className="inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
      >
        Start Adventure
      </Link>
    </PageShell>
  );
}
