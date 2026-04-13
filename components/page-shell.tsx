import { AuthControls } from "@/components/auth-controls";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6 sm:py-5">
      <header className="sticky top-0 z-20 -mx-4 mb-6 border-b border-slate-200/80 bg-slate-50/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-5 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-slate-900 sm:text-2xl">{title}</h1>
          <AuthControls />
        </div>
        {subtitle ? <p className="mt-1 text-base text-slate-600 sm:text-sm">{subtitle}</p> : null}
      </header>

      <section className="space-y-4 sm:space-y-3">{children}</section>
    </main>
  );
}
