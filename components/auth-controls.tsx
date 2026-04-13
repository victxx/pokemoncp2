"use client";

import { usePrivy } from "@privy-io/react-auth";

function AuthControlsInner() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return <p className="text-xs text-slate-500">Auth loading...</p>;
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={login}
        className="btn-pokemon text-xs px-3 py-1"
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
        className="btn-pokemon-secondary text-xs px-3 py-1"
      >
        Logout
      </button>
    </div>
  );
}

export function AuthControls() {
  const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!hasPrivy) return null;
  return <AuthControlsInner />;
}
