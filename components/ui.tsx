import Link from "next/link";
import type { Rarity } from "@/lib/types/domain";

export function SurfaceCard({ children }: { children: React.ReactNode }) {
  return <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">{children}</article>;
}

export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function ActionLink({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 ${className}`}
    >
      {label}
    </Link>
  );
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const styles: Record<Rarity, string> = {
    Common: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Rare: "bg-blue-50 text-blue-700 ring-blue-200",
    Epic: "bg-violet-50 text-violet-700 ring-violet-200"
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${styles[rarity]}`}>
      {rarity}
    </span>
  );
}
