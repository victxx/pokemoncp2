import { PageShell } from "@/components/page-shell";
import { HomePageClient } from "@/components/home/home-page-client";

export default function HomePage() {
  return (
    <PageShell title="Home" subtitle="Your trainer dashboard">
      <HomePageClient />
    </PageShell>
  );
}
