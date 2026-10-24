import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { Skills } from "@/components/home/Skills";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Contact } from "@/components/home/Contact";
import { QuizSection } from "@/components/quiz/QuizSection";
import { baseUrlPubblica, jsonLdSicuro, metadataPubblica, personaJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return metadataPubblica({ locale, percorso: "/", title: t("title"), description: t("description") });
}

// Il teaser del quiz (top 5 in classifica) è una query diretta a Supabase in
// un Server Component: revalidate qui, a livello di route segment, tiene la
// classifica ragionevolmente fresca senza farla ricalcolare a ogni request.
export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Meta");
  const persona = personaJsonLd({ base: baseUrlPubblica(), jobTitle: t("jobTitle") });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSicuro(persona) }} />
      <Hero />
      <About />
      <QuizSection />
      <Skills />
      <FeaturedProjects />
      <Contact />
    </>
  );
}
