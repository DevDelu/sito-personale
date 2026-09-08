"use client";

import { useActionState } from "react";
import Link from "next/link";
import Script from "next/script";
import { requestPasswordReset, type RequestResetState } from "../actions";

export function RecoverForm() {
  const [state, action, pending] = useActionState<RequestResetState, FormData>(
    requestPasswordReset,
    undefined
  );

  if (state?.sent) {
    return (
      <div className="flex w-full max-w-sm animate-slide-up flex-col gap-4 text-center">
        <p className="text-sm text-muted">
          Se l&apos;indirizzo è registrato riceverai a breve un&apos;email con il link per reimpostare la password.
        </p>
        <Link href="/login" className="text-sm text-muted hover:text-fg">
          Torna al login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-sm animate-slide-up flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-muted">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field-input bg-surface" />
      </div>

      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div
        className="cf-turnstile"
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        data-theme="auto"
      />

      {state?.error && (
        <p className="animate-slide-down text-sm text-spesa" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-2">
        {pending ? "Invio in corso..." : "Invia link di recupero"}
      </button>

      <Link href="/login" className="self-center text-sm text-muted hover:text-fg">
        Torna al login
      </Link>
    </form>
  );
}
