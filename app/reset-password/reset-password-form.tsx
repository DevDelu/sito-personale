"use client";

import { useActionState } from "react";
import { updatePassword, type UpdatePasswordState } from "./actions";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<UpdatePasswordState, FormData>(
    updatePassword,
    undefined
  );

  return (
    <form action={action} className="flex w-full max-w-sm animate-slide-up flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-muted">
          Nuova password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field-input bg-surface"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password-confirm" className="text-sm font-medium text-muted">
          Conferma password
        </label>
        <input
          id="password-confirm"
          name="password-confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field-input bg-surface"
        />
      </div>

      {state?.error && (
        <p className="animate-slide-down text-sm text-spesa" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-2">
        {pending ? "Salvataggio in corso..." : "Salva nuova password"}
      </button>
    </form>
  );
}
