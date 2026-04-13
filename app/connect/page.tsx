import { PageShell } from "@/components/page-shell";
import { ConnectPageClient } from "@/components/connect-page-client";

export default function ConnectPage() {
  return (
    <PageShell title="Connect" subtitle="Use a personal code to connect with coworkers">
      <ConnectPageClient />
    </PageShell>
  );
}
