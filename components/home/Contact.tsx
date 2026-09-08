"use client";

import { useActionState, useState } from "react";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { sendContactMessage, type ContactState } from "@/app/[locale]/contact-actions";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { SectionHeading } from "@/components/home/section-heading";

const inputClass =
  "w-full border-0 border-b border-border bg-transparent px-0 py-2 text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent";

export function Contact() {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, undefined);
  const [renderedAt] = useState(() => Date.now());

  return (
    <section id="contatti" className="mx-auto w-full max-w-5xl border-t border-border px-6 py-16">
      <RevealGroup>
        <RevealItem className="max-w-2xl">
          <SectionHeading>{t("title")}</SectionHeading>
          <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        </RevealItem>

        <RevealItem className="mt-8">
          {state?.success ? (
            <p className="animate-slide-up max-w-2xl rounded-md border border-border bg-surface p-5 text-sm text-foreground">
              {t("success")}
            </p>
          ) : (
            <form action={action} className="relative flex flex-col gap-5">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="ts" value={renderedAt} />

              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="azienda">Azienda</label>
                <input id="azienda" name="azienda" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                  {t("messageLabel")}
                </label>
                <textarea id="message" name="message" required rows={5} className={`${inputClass} resize-none`} />
              </div>

              <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
              <div
                className="cf-turnstile"
                data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                data-theme="auto"
              />

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
