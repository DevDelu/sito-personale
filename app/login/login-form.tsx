"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <form action={action} className="flex w-full max-w-sm animate-slide-up flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-muted">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field-input bg-surface" />
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
          className="field-input bg-surface"
        />
      </div>

      {state?.error && (
        <p className="animate-slide-down text-sm text-spesa" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-2">
        {pending ? "Accesso in corso..." : "Accedi"}
      </button>
    </form>
  );
}
