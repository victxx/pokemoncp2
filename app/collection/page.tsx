import { PageShell } from "@/components/page-shell";
import { CollectionPageClient } from "@/components/collection/collection-page-client";

export default function CollectionPage() {
  return (
    <PageShell title="Collection" subtitle="Unlocked and locked Pokemon">
      <CollectionPageClient />
    </PageShell>
  );
}
