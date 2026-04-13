import { PageShell } from "@/components/page-shell";
import { StarterPageClient } from "@/components/starter-page-client";

export default function StarterPage() {
  return (
    <PageShell title="Choose Your Starter" subtitle="Charmander, Piplup, or Treecko">
      <StarterPageClient />
    </PageShell>
  );
}
