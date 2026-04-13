"use client";

import { usePrivy } from "@privy-io/react-auth";

export function AuthControls() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return <p className="text-xs text-slate-500">Auth loading...</p>;
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={login}
        className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
      >
        Login
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-600">{user?.id.slice(0, 8)}</span>
      <button
        type="button"
        onClick={logout}
        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
      >
        Logout
      </button>
    </div>
  );
}
