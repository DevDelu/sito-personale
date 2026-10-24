import type { Metadata } from "next";

// Metadata condivisi dalle pagine pubbliche (app/[locale]/): anteprima giusta
// quando il link viene condiviso o cercato, più hreflang IT/EN.
// Puro (niente next-intl qui) così si testa con node:test.

export const LOCALI_PUBBLICHE = ["it", "en"] as const;
const LOCALE_DEFAULT = "it";
const OG_LOCALE: Record<string, string> = { it: "it_IT", en: "en_US" };
const IMMAGINE_OG = "/images/lorenzo-about.png";
export const LINKEDIN_URL = "https://www.linkedin.com/in/lorenzo-de-luca-83819a277/";

// Base assoluta per og:image/canonical. In produzione su Vercel, senza
// NEXT_PUBLIC_SITE_URL, VERCEL_URL è l'URL del singolo deploy: meglio il
// dominio di produzione del progetto.
export function baseUrlPubblica(env: Record<string, string | undefined> = process.env): string {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// localePrefix "as-needed" (i18n/routing.ts): IT senza prefisso, EN su /en.
export function percorsoLocalizzato(percorso: string, locale: string): string {
  const pulito = percorso === "/" ? "" : percorso;
  if (locale === LOCALE_DEFAULT) return pulito || "/";
  return `/${locale}${pulito}`;
}

export function alternatesPubbliche(percorso: string, locale: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of LOCALI_PUBBLICHE) languages[l] = percorsoLocalizzato(percorso, l);
  languages["x-default"] = percorsoLocalizzato(percorso, LOCALE_DEFAULT);
  return { canonical: percorsoLocalizzato(percorso, locale), languages };
}

export function metadataPubblica({
  locale,
  percorso,
  title,
  description,
}: {
  locale: string;
  percorso: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: alternatesPubbliche(percorso, locale),
    openGraph: {
      type: "website",
      siteName: "Lorenzo De Luca",
      locale: OG_LOCALE[locale] ?? OG_LOCALE[LOCALE_DEFAULT],
      url: percorsoLocalizzato(percorso, locale),
      title,
      description,
      images: [{ url: IMMAGINE_OG, width: 738, height: 1145, alt: "Lorenzo De Luca" }],
    },
    twitter: { card: "summary", title, description, images: [IMMAGINE_OG] },
  };
}

// JSON-LD sicuro dentro <script>: niente "<" letterali (guida Next.js).
export function jsonLdSicuro(dati: unknown): string {
  return JSON.stringify(dati).replace(/</g, "\\u003c");
}

export function personaJsonLd({ base, jobTitle }: { base: string; jobTitle: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Lorenzo De Luca",
    url: base,
    image: new URL(IMMAGINE_OG, base).toString(),
    jobTitle,
    sameAs: [LINKEDIN_URL],
    knowsLanguage: ["it", "en"],
  };
}
