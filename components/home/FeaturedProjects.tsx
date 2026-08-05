import { getLocale, getTranslations } from "next-intl/server";
import { getFeaturedProjects } from "@/lib/projects";
import { ProjectCard } from "@/components/progetti/project-card";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { Link } from "@/i18n/navigation";

export async function FeaturedProjects() {
  const locale = await getLocale();
  const projects = getFeaturedProjects(locale, 3);
  if (projects.length === 0) return null;

  const t = await getTranslations("FeaturedProjects");
  const tCategory = await getTranslations("ProjectCategory");

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <RevealGroup>
        <RevealItem className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t("title")}</h2>
          <Link href="/progetti" className="text-sm text-muted transition-colors hover:text-foreground">
            {t("viewAll")} →
          </Link>
        </RevealItem>
        <RevealItem className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              categoryLabel={tCategory(project.category)}
            />
          ))}
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
