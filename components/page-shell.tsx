import Link from "next/link";
import { APP_ROUTES } from "@/lib/routes/app-routes";
import { AuthControls } from "@/components/auth-controls";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  hideNav?: boolean;
}

export function PageShell({ title, subtitle, children, hideNav = false }: PageShellProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-5">
      <header className="mb-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <AuthControls />
        </div>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </header>

      {hideNav ? null : (
        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {APP_ROUTES.map((route) => (
            <Link
              key={route.path}
              href={route.path}
              className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-medium shadow-sm ring-1 ring-slate-200"
            >
              {route.label}
            </Link>
          ))}
        </nav>
      )}

      <section className="space-y-3">{children}</section>
    </main>
  );
}
