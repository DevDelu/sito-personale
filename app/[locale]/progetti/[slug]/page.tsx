import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProjectBySlug, getProjects } from "@/lib/projects";
import { CaseStudyLayout } from "@/components/progetti/case-study-layout";

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
  return { title: project.title, description: project.summary };
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

  return (
    <CaseStudyLayout project={project} categoryLabel={tCategory(project.category)} backLinkLabel={t("backLink")} />
  );
}
