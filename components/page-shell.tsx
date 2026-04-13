import { AuthControls } from "@/components/auth-controls";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-5">
      <header className="mb-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <AuthControls />
        </div>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </header>

      <section className="space-y-3">{children}</section>
    </main>
  );
}
