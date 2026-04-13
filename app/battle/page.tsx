import { PageShell } from "@/components/page-shell";
import { BattlePageClient } from "@/components/battle/battle-page-client";

export default function BattlePage() {
  return (
    <PageShell title="Battle" subtitle="Instant mini battle">
      <BattlePageClient />
    </PageShell>
  );
}
