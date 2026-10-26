import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProjectBySlug, getProjects } from "@/lib/projects";
import { CaseStudyLayout } from "@/components/progetti/case-study-layout";
import { baseUrlPubblica, jsonLdSicuro, metadataPubblica, progettoJsonLd } from "@/lib/seo";

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return getProjects(params.locale).map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProjectBySlug(slug, locale);
  if (!project) return {};
  return metadataPubblica({
    locale,
    percorso: `/progetti/${slug}`,
    title: project.title,
    description: project.summary,
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const project = getProjectBySlug(slug, locale);
  if (!project) notFound();

  const t = await getTranslations("CaseStudy");
  const tCategory = await getTranslations("ProjectCategory");

  const { opera, briciole } = progettoJsonLd({
    base: baseUrlPubblica(),
    locale,
    slug,
    nome: project.title,
    descrizione: project.summary,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSicuro(opera) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSicuro(briciole) }} />
      <CaseStudyLayout project={project} categoryLabel={tCategory(project.category)} backLinkLabel={t("backLink")} />
    </>
  );
}
