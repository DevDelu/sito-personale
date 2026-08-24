"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { sendContactMessage, type ContactState } from "@/app/[locale]/contact-actions";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";

export function Contact() {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, undefined);

  return (
    <section id="contatti" className="mx-auto w-full max-w-2xl px-6 py-16">
      <RevealGroup>
        <RevealItem>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        </RevealItem>

        <RevealItem className="mt-8">
          {state?.success ? (
            <p className="animate-slide-up rounded-xl border border-border bg-surface p-5 text-sm text-foreground">
              {t("success")}
            </p>
          ) : (
            <form action={action} className="flex flex-col gap-4">
              <input type="hidden" name="locale" value={locale} />
              {/* Honeypot: nascosto via CSS, non con `hidden`, così i bot che
                  ignorano gli stili lo compilano comunque. */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="azienda">Azienda</label>
                <input id="azienda" name="azienda" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium text-muted">
                  {t("nameLabel")}
                </label>
                <input id="name" name="name" type="text" required className="field-input bg-surface" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-muted">
                  {t("emailLabel")}
                </label>
                <input id="email" name="email" type="email" required className="field-input bg-surface" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-sm font-medium text-muted">
                  {t("messageLabel")}
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="field-input resize-none bg-surface"
                />
              </div>

              {state?.error && (
                <p className="animate-slide-down text-sm text-spesa" role="alert">
                  {state.error}
                </p>
              )}

              <button type="submit" disabled={pending} className="btn-primary mt-2 self-start">
                {pending ? t("sending") : t("send")}
              </button>
            </form>
          )}
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
