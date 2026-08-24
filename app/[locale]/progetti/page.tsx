import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { getProjects } from "@/lib/projects";
import { ProjectCard } from "@/components/progetti/project-card";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Progetti");
  return { title: t("title"), description: t("description") };
}

export default async function ProgettiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const currentLocale = await getLocale();
  const projects = getProjects(currentLocale);
  const t = await getTranslations("Progetti");
  const tCaseStudy = await getTranslations("CaseStudy");
  const tCategory = await getTranslations("ProjectCategory");

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <RevealGroup>
        <RevealItem>
          <Link
            href="/"
            className="inline-block py-2 font-mono text-sm text-muted transition-colors hover:text-foreground"
          >
            ← {tCaseStudy("backLink")}
          </Link>
        </RevealItem>
        <RevealItem className="mt-4">
          <h1 className="font-sans text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("description")}</p>
        </RevealItem>
        <RevealItem className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(260px,340px))] gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} categoryLabel={tCategory(project.category)} />
          ))}
        </RevealItem>
      </RevealGroup>
    </div>
  );
}
