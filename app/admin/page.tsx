import { PageShell } from "@/components/page-shell";
import { AdminPageClient } from "@/components/admin-page-client";

export default function AdminPage() {
  return (
    <PageShell title="Admin Moderation" subtitle="Small manual tools for anti-farming checks">
      <AdminPageClient />
    </PageShell>
  );
}
