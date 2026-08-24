"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { sendContactMessage, type ContactState } from "@/app/[locale]/contact-actions";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { SectionEyebrow } from "@/components/home/section-eyebrow";

const inputClass =
  "w-full border-0 border-b border-border bg-transparent px-0 py-2 text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent";

export function Contact() {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, undefined);

  return (
    <section id="contatti" className="mx-auto w-full max-w-2xl border-t border-border px-6 py-16">
      <RevealGroup>
        <RevealItem>
          <SectionEyebrow>contatti</SectionEyebrow>
          <h2 className="font-sans text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        </RevealItem>

        <RevealItem className="mt-8">
          {state?.success ? (
            <p className="animate-slide-up rounded-md border border-border bg-surface p-5 text-sm text-foreground">
              {t("success")}
            </p>
          ) : (
            <form action={action} className="flex flex-col gap-5">
              <input type="hidden" name="locale" value={locale} />
              {/* Honeypot: nascosto via CSS, non con `hidden`, così i bot che
                  ignorano gli stili lo compilano comunque. */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="azienda">Azienda</label>
                <input id="azienda" name="azienda" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  {t("nameLabel")}
                </label>
                <input id="name" name="name" type="text" required className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  {t("emailLabel")}
                </label>
                <input id="email" name="email" type="email" required className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  {t("messageLabel")}
                </label>
                <textarea id="message" name="message" required rows={5} className={`${inputClass} resize-none`} />
              </div>

              {state?.error && (
                <p className="animate-slide-down text-sm text-stamp" role="alert">
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-2 self-start rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
              >
                {pending ? t("sending") : t("send")}
              </button>
            </form>
          )}
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
