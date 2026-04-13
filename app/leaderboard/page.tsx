import { PageShell } from "@/components/page-shell";
import { LeaderboardPageClient } from "@/components/leaderboard-page-client";

export default function LeaderboardPage() {
  return (
    <PageShell title="Leaderboard" subtitle="Public event ranking">
      <LeaderboardPageClient />
    </PageShell>
  );
}
