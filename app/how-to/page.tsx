import { PageShell } from "@/components/page-shell";
import { SurfaceCard } from "@/components/ui";

export default function HowToPage() {
  return (
    <PageShell title="How to Play" subtitle="Quick event guide">
      <SurfaceCard>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>Connect with people to earn coins and points.</li>
          <li>Use coins to open balls and unlock random Pokemon.</li>
          <li>Connected battles give full rewards (best for ranking).</li>
          <li>Ticket battles give reduced rewards.</li>
          <li>You get 5 daily tickets and they reset each event day.</li>
          <li>Top players climb the public leaderboard.</li>
        </ul>
      </SurfaceCard>
    </PageShell>
  );
}
