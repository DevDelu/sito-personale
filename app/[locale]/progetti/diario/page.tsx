import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { Link } from "@/i18n/navigation";
import { leggiPrMergiate, raggruppaPerSettimana } from "@/lib/diario";
import { metadataPubblica } from "@/lib/seo";

// HTML cacheabile dalla CDN, rigenerato ogni 6 ore (niente cookie, nessuna chiamata dal browser).
export const revalidate = 21600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Diario" });
  return metadataPubblica({ locale, percorso: "/progetti/diario", title: `${t("title")} — Lorenzo De Luca`, description: t("description") });
}

export default async function DiarioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const currentLocale = await getLocale();
  const t = await getTranslations("Diario");
  const tCaseStudy = await getTranslations("CaseStudy");
  const settimane = raggruppaPerSettimana(await leggiPrMergiate());
  const formatoData = new Intl.DateTimeFormat(currentLocale === "en" ? "en-GB" : "it-IT", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <RevealGroup>
        <RevealItem>
          <Link
            href="/progetti"
            className="inline-flex min-h-11 items-center font-mono text-sm text-muted transition-colors hover:text-foreground"
          >
            ← {tCaseStudy("backLink")}
          </Link>
        </RevealItem>
        <RevealItem className="mt-4">
          <h1 className="font-sans text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("intro")}</p>
          {currentLocale === "en" && <p className="mt-1 text-xs text-muted">{t("noteLang")}</p>}
        </RevealItem>
        <RevealItem className="mt-8">
          {settimane.length === 0 ? (
            <p className="text-sm text-muted">{t("empty")}</p>
          ) : (
            settimane.map((s) => (
              <section key={s.inizio} className="mb-8">
                <h2 className="font-mono text-xs tracking-wide text-muted uppercase">
                  {t("week", { data: formatoData.format(new Date(`${s.inizio}T00:00:00Z`)) })}
                </h2>
                <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
                  {s.prs.map((pr) => (
                    <li key={pr.numero}>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-hover"
                      >
                        <span>{pr.titolo}</span>
                        <span className="font-mono text-xs whitespace-nowrap text-muted">#{pr.numero}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </RevealItem>
      </RevealGroup>
    </div>
  );
}
