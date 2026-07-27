"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Accesso in corso..." : "Accedi"}
      </button>
    </form>
  );
}
