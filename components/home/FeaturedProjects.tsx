import { getLocale, getTranslations } from "next-intl/server";
import { getFeaturedProjects } from "@/lib/projects";
import { ProjectCard } from "@/components/progetti/project-card";
import { RevealGroup, RevealItem } from "@/components/progetti/reveal";
import { SectionHeading } from "@/components/home/section-heading";
import { Link } from "@/i18n/navigation";

export async function FeaturedProjects() {
  const locale = await getLocale();
  const projects = getFeaturedProjects(locale, 3);
  if (projects.length === 0) return null;

  const t = await getTranslations("FeaturedProjects");
  const tCategory = await getTranslations("ProjectCategory");

  return (
    <section id="progetti" className="mx-auto w-full max-w-5xl border-t border-border px-6 py-16">
      <RevealGroup>
        <RevealItem className="flex items-baseline justify-between gap-4">
          <div>
            <SectionHeading>{t("title")}</SectionHeading>
          </div>
          <Link
            href="/progetti"
            className="shrink-0 font-mono text-sm text-muted transition-colors hover:text-foreground"
          >
            {t("viewAll")} →
          </Link>
        </RevealItem>
        <RevealItem className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(260px,340px))] gap-6">
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
